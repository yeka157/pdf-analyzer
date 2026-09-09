import React from "react";
import { prisma } from "@/lib/prisma";
import { getStripeSession, stripe } from "@/lib/stripe";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { checkAuthenticationAndSubscription } from "@/lib/checkAuthSubscription";

const BENEFITS = [
  "Up to 20 pages and 10 MB per PDF",
  "Full summaries and key terms",
  "Priority support",
];

function getDomainUrl() {
  const domainUrl =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.NODE_ENV === "production"
      ? process.env.PRODUCTION_URL
      : "http://localhost:3000");

  if (!domainUrl) {
    throw new Error("Missing domain URL configuration");
  }

  return domainUrl;
}

async function getData(userId: string | null) {
  await connection();

  if (!userId) return null;

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
    select: {
      status: true,
      user: {
        select: { stripeCustomerId: true },
      },
    },
  });

  return subscription;
}

const Pricing = async () => {
  // Check auth status without redirecting
  const authCheck = await checkAuthenticationAndSubscription();
  // Get user data if authenticated
  const user = authCheck.isAuthenticated ? await currentUser() : null;
  // Get subscription data if authenticated
  const subscription = authCheck.isAuthenticated
    ? await getData(authCheck.userId)
    : null;
  const isSubscribed = subscription?.status === "active";

  const createSubscription = async () => {
    "use server";

    if (!authCheck.userId) {
      return redirect("/sign-in?redirect_url=/pricing");
    }

    let databaseUser = await prisma.user.findUnique({
      where: {
        id: authCheck.userId,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!databaseUser) {
      throw new Error("Database User Not Found");
    }

    const email = user?.primaryEmailAddress?.emailAddress;

    if (!databaseUser.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email,
      });

      databaseUser = await prisma.user.update({
        where: {
          id: authCheck.userId,
        },
        data: {
          stripeCustomerId: customer.id,
        },
      });
    }

    if (!databaseUser.stripeCustomerId) {
      throw new Error("Failed to set stripe customer Id for user");
    }

    // Stripe is the source of truth for billing; the Subscription table is a
    // mirror of it. If a webhook was missed the mirror can be empty while the
    // customer is still subscribed, and this page would offer to subscribe
    // them a second time. Ask Stripe directly before opening a new checkout.
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: databaseUser.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (activeSubscriptions.data.length > 0) {
      return redirect("/dashboard");
    }

    const domainUrl = getDomainUrl();

    const subscriptionUrl = await getStripeSession({
      customerId: databaseUser.stripeCustomerId,
      domainUrl: domainUrl,
      priceId: process.env.STRIPE_PRICE_ID as string,
      successUrl: `${domainUrl}/dashboard?payment=success`,
    });

    return redirect(subscriptionUrl);
  };

  const createCustomerPortal = async () => {
    "use server";

    if (!authCheck.userId) {
      return redirect("sign-in?redirect_url=/pricing");
    }

    const customerPortalUrl = await stripe.billingPortal.sessions.create({
      customer: subscription?.user.stripeCustomerId as string,
      return_url: getDomainUrl(),
    });

    return redirect(customerPortalUrl.url);
  };

  const backLink = authCheck.isAuthenticated ? "/dashboard" : "/";

  return (
    <div className="px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto flex max-w-[608px] flex-col gap-6">
        <Link href={backLink} className="btn btn-quiet t-small self-start">
          &larr; Back
        </Link>

        <div className="invert-panel flex flex-col gap-5 px-5 py-7 md:gap-7 md:p-10">
          <div className="flex flex-col gap-2 md:gap-2.5">
            <h1 className="t-page">One plan</h1>
            <p className="t-body text-subtle">
              Everything included. Cancel whenever.
            </p>
          </div>

          <div className="flex items-baseline gap-2 md:gap-2.5">
            <span className="text-[44px] leading-none font-semibold tracking-[-0.04em] md:text-[56px]">
              $5.99
            </span>
            <span className="font-mono text-[11px] text-subtle md:text-[12px]">
              / month
            </span>
          </div>

          {/* 1px background gaps rather than rules: the panel shows through. */}
          <div className="flex flex-col gap-px bg-line">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit}
                className="bg-paper py-3.5 text-[15px] md:text-[16px]"
              >
                {benefit}
              </div>
            ))}
          </div>

          {authCheck.isAuthenticated ? (
            isSubscribed ? (
              <form action={createCustomerPortal}>
                <button
                  type="submit"
                  className="btn btn-signal w-full py-4 text-[16px] md:text-[15px]"
                >
                  Manage subscription
                </button>
              </form>
            ) : (
              <form action={createSubscription}>
                <button
                  type="submit"
                  className="btn btn-signal w-full py-4 text-[16px] md:text-[15px]"
                >
                  Subscribe
                </button>
              </form>
            )
          ) : (
            <Link
              href="/sign-in?redirect_url=/pricing"
              className="btn btn-signal w-full py-4 text-[16px] md:text-[15px]"
            >
              Sign in to subscribe
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
