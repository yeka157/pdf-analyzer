import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!(signature && signingSecret)) {
    return NextResponse.json(
      { error: "Webhook signature configuration is missing" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  // A bad signature can never succeed on a retry, so it is the one case that
  // genuinely warrants a 400.
  try {
    event = stripe.webhooks.constructEvent(body, signature, signingSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
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
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    // Anything that fails past verification — a database blip, a Stripe API
    // timeout — is potentially transient. Returning 5xx lets Stripe retry with
    // backoff; a 4xx would tell it to give up and the event would be lost,
    // leaving a paying customer with no subscription record.
    console.error(
      `Stripe webhook handler failed for ${event.type} (${event.id}):`,
      error
    );
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Billing periods live on the subscription's items rather than the
 * subscription itself — `Subscription.current_period_start/end` were removed
 * in the Basil API release to support mixed-cadence subscriptions.
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const [item] = subscription.items.data;

  if (!item) {
    throw new Error(`Subscription ${subscription.id} has no items`);
  }

  return {
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    currentPeriodStart: new Date(item.current_period_start * 1000),
    interval: item.price.recurring?.interval ?? "month",
    planId: item.price.id,
  };
}

/**
 * Write a subscription's current state, creating the row if it is not there
 * yet.
 *
 * Stripe delivers webhooks at least once and in no guaranteed order, so any
 * handler may be the first to hear about a given subscription. Upserting keeps
 * every one of them safe to run in any order and any number of times, rather
 * than assuming `checkout.session.completed` already landed.
 */
async function upsertSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  // Throwing yields a 5xx, so Stripe retries. That matters when this event
  // beats the Clerk webhook that creates the user.
  if (!user) {
    throw new Error(`No user found for Stripe customer ${customerId}`);
  }

  const period = getSubscriptionPeriod(subscription);

  await prisma.subscription.upsert({
    create: {
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      userId: user.id,
      ...period,
    },
    update: {
      status: subscription.status,
      ...period,
    },
    where: { stripeSubscriptionId: subscription.id },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!(session.subscription && session.customer)) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await upsertSubscription(subscription);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await upsertSubscription(subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // deleteMany rather than delete: a redelivered event would otherwise throw
  // because the row is already gone.
  await prisma.subscription.deleteMany({
    where: { stripeSubscriptionId: subscription.id },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // `Invoice.subscription` was removed in Basil; the originating subscription
  // now hangs off `invoice.parent.subscription_details`.
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;

  if (!subscriptionRef) {
    return;
  }

  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await upsertSubscription(subscription);
}
