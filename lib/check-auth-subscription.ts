import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { stripe } from "./stripe";

export interface AuthCheckResult {
  hasSubscription: boolean;
  isAuthenticated: boolean;
  redirectTo?: string;
  userId: string | null;
}

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
    select: { id: true },
    where: { id: userId },
  });

  if (existing) {
    return;
  }

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
    create: { email, id: userId, name: fullName || null },
    update: {},
    where: { id: userId },
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
    select: { stripeCustomerId: true },
    where: { id: userId },
  });

  if (!user?.stripeCustomerId) {
    return null;
  }

  const active = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    limit: 1,
    status: "active",
  });

  const [remote] = active.data;
  if (!remote) {
    return null;
  }

  const [item] = remote.items.data;

  if (!item) {
    return null;
  }

  console.warn(
    `Reconciling subscription ${remote.id} for ${userId} from Stripe; the webhook did not land`
  );

  return prisma.subscription.upsert({
    create: {
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      currentPeriodStart: new Date(item.current_period_start * 1000),
      interval: item.price.recurring?.interval ?? "month",
      planId: item.price.id,
      status: remote.status,
      stripeSubscriptionId: remote.id,
      userId,
    },
    update: {
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      currentPeriodStart: new Date(item.current_period_start * 1000),
      status: remote.status,
    },
    where: { stripeSubscriptionId: remote.id },
  });
}

export async function checkAuthenticationAndSubscription(
  waitMs = 0
): Promise<AuthCheckResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      hasSubscription: false,
      isAuthenticated: false,
      redirectTo: "/sign-in?redirect_url=/dashboard",
      userId: null,
    };
  }

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  let subscription: Awaited<ReturnType<typeof reconcileSubscription>> = null;
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
      hasSubscription: false,
      isAuthenticated: true,
      userId,
    };
  }

  const hasActiveSubscription = subscription?.status === "active";

  return {
    hasSubscription: hasActiveSubscription,
    isAuthenticated: true,
    redirectTo: hasActiveSubscription ? undefined : "/pricing",
    userId,
  };
}
