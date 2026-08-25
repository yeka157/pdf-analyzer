import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const err = error as Error;
    console.error(`Stripe webhook error: ${err.message}`);
    return NextResponse.json(
      {
        error: `Webhook Error: ${err.message}`,
      },
      {
        status: 400,
      }
    );
  }
}

/**
 * Billing periods live on the subscription's items rather than the
 * subscription itself — `Subscription.current_period_start/end` were removed
 * in the Basil API release to support mixed-cadence subscriptions.
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];

  if (!item) {
    throw new Error(`Subscription ${subscription.id} has no items`);
  }

  return {
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    interval: item.price.recurring?.interval ?? "month",
    planId: item.price.id,
  };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.customer) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: session.customer as string },
  });

  if (!user) {
    throw new Error("User not found for checkout session");
  }

  const period = getSubscriptionPeriod(subscription);

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      userId: user.id,
      ...period,
    },
    update: {
      status: subscription.status,
      ...period,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      ...getSubscriptionPeriod(subscription),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.delete({
    where: { stripeSubscriptionId: subscription.id },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // `Invoice.subscription` was removed in Basil; the originating subscription
  // now hangs off `invoice.parent.subscription_details`.
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;

  if (!subscriptionRef) return;

  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { currentPeriodStart, currentPeriodEnd } =
    getSubscriptionPeriod(subscription);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { currentPeriodStart, currentPeriodEnd },
  });
}
