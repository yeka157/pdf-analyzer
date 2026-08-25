import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { stripe } from "./stripe";

export type AuthCheckResult = {
  userId: string | null;
  isAuthenticated: boolean;
  hasSubscription: boolean;
  redirectTo?: string;
};

/**
 * Guarantee a User row exists for the signed-in Clerk user.
 *
 * The `user.created` webhook is the primary path, but it is not a reliable
 * one: it never fires for accounts that predate this database, and a dropped
 * or delayed delivery would otherwise leave an authenticated user with no row
 * at all. Treating the webhook as an optimisation and reconciling here keeps
 * the two systems consistent.
 */
async function ensureUser(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (existing) return;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  if (!email) {
    console.error(`Cannot backfill user ${userId}: no primary email on Clerk`);
    return;
  }

  const fullName = `${clerkUser?.firstName || ""} ${
    clerkUser?.lastName || ""
  }`.trim();

  // Racing against a webhook for the same user is expected, so treat a
  // concurrent insert as success rather than an error.
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name: fullName || null },
    update: {},
  });
}

/**
 * Rebuild a missing Subscription row from Stripe.
 *
 * Stripe is the source of truth for billing and this table is a mirror of it.
 * A dropped `checkout.session.completed` webhook would otherwise leave a
 * paying customer looking unsubscribed: locked out of the dashboard, and sent
 * to /pricing where the double-subscribe guard bounces them straight back.
 *
 * Only runs when the mirror is empty and we already know the customer, so the
 * happy path never pays for the extra Stripe call.
 */
async function reconcileSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) return null;

  const active = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 1,
  });

  const remote = active.data[0];
  if (!remote) return null;

  const item = remote.items.data[0];

  console.warn(
    `Reconciling subscription ${remote.id} for ${userId} from Stripe; the webhook did not land`
  );

  return prisma.subscription.upsert({
    where: { stripeSubscriptionId: remote.id },
    create: {
      stripeSubscriptionId: remote.id,
      status: remote.status,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      interval: item.price.recurring?.interval ?? "month",
      planId: item.price.id,
      userId,
    },
    update: {
      status: remote.status,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    },
  });
}

export async function checkAuthenticationAndSubscription(
  waitMs = 0
): Promise<AuthCheckResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null,
      isAuthenticated: false,
      hasSubscription: false,
      redirectTo: "/sign-in?redirect_url=/dashboard",
    };
  }

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  let subscription = null;
  try {
    await ensureUser(userId);

    subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await reconcileSubscription(userId);
    }
  } catch (error) {
    console.error("Error checking subscription", error);
    return {
      userId,
      isAuthenticated: true,
      hasSubscription: false,
    };
  }

  const hasActiveSubscription = subscription?.status === "active";

  return {
    userId,
    isAuthenticated: true,
    hasSubscription: hasActiveSubscription,
    redirectTo: hasActiveSubscription ? undefined : "/pricing",
  };
}
