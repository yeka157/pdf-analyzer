/* eslint-disable @typescript-eslint/no-explicit-any */
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.customer) return;

  const subscription = (await stripe.subscriptions.retrieve(
    session.subscription as string,
    {
      expand: ["items.data.plan"],
    }
  )) as Stripe.Subscription & { [key: string]: any };

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: session.customer as string },
  });

  if (!user) {
    throw new Error("User not found for checkout session");
  }

  let startTimestamp = subscription.start_date;
  if (!startTimestamp && subscription.billing_cycle_anchor) {
    startTimestamp = subscription.billing_cycle_anchor;
  }
  if (!startTimestamp && subscription.created) {
    startTimestamp = subscription.created;
  }

  // Calculate the end date based on the billing interval
  let endDate = new Date();
  const startDate = new Date(startTimestamp * 1000);

  // Get the interval from the plan
  let interval = "month"; // Default
  if (subscription.items?.data?.[0]?.plan?.interval) {
    interval = subscription.items.data[0].plan.interval;
  }

  // Calculate the end date based on the interval
  switch (interval) {
    case "day":
      endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 1);
      break;
    case "week":
      endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "month":
      endDate = new Date(startDate.getTime());
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "year":
      endDate = new Date(startDate.getTime());
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      // Default to month
      endDate = new Date(startDate.getTime());
      endDate.setMonth(endDate.getMonth() + 1);
  }

  // Get the plan ID safely
  const planId = subscription.items?.data?.[0]?.plan?.id || "unknown_plan";

  // Log the calculated dates
  console.log("Using calculated dates:", {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    interval,
  });

  // Perform the upsert with our calculated dates
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      interval: interval,
      planId: planId,
      userId: user.id,
    },
    update: {
      status: subscription.status,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      interval: interval,
      planId: planId,
    },
  });
}

// async function handleSubscriptionUpdated(
//   subscriptionData: Stripe.Subscription
// ) {
//   const subscription = subscriptionData as Stripe.Subscription & {
//     [key: string]: any;
//   };
//   await prisma.subscription.update({
//     where: { stripeSubscriptionId: subscription.id },
//     data: {
//       status: subscription.status,
//       currentPeriodStart: new Date(subscription.current_period_start * 1000),
//       currentPeriodEnd: new Date(subscription.current_period_end * 1000),
//       interval: subscription.items.data[0].plan.interval,
//       planId: subscription.items.data[0].plan.id,
//     },
//   });
// }

async function handleSubscriptionUpdated(
  subscriptionData: Stripe.Subscription
) {
  const subscription = subscriptionData as Stripe.Subscription & {
    [key: string]: any;
  };

  // Get start date from available properties
  let startTimestamp = subscription.start_date;
  if (!startTimestamp && subscription.billing_cycle_anchor) {
    startTimestamp = subscription.billing_cycle_anchor;
  }
  if (!startTimestamp && subscription.created) {
    startTimestamp = subscription.created;
  }

  // Calculate end date
  let endDate = new Date();
  const startDate = new Date(startTimestamp * 1000);

  // Get interval
  let interval = "month"; // Default
  if (subscription.items?.data?.[0]?.plan?.interval) {
    interval = subscription.items.data[0].plan.interval;
  }

  // Calculate end date based on interval
  switch (interval) {
    case "day":
      endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 1);
      break;
    case "week":
      endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "month":
      endDate = new Date(startDate.getTime());
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "year":
      endDate = new Date(startDate.getTime());
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate = new Date(startDate.getTime());
      endDate.setMonth(endDate.getMonth() + 1);
  }

  // Get plan ID safely
  const planId = subscription.items?.data?.[0]?.plan?.id || "unknown_plan";

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      interval: interval,
      planId: planId,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.delete({
    where: { stripeSubscriptionId: subscription.id },
  });
}

// async function handlePaymentSucceeded(invoiceData: Stripe.Invoice) {
//   const invoice = invoiceData as Stripe.Invoice & { [key: string]: any };
//   if (!invoice.subscription) return;
//   const subscription = (await stripe.subscriptions.retrieve(
//     invoice.subscription as string
//   )) as Stripe.Subscription & { [key: string]: any };
//   await prisma.subscription.update({
//     where: { stripeSubscriptionId: subscription.id },
//     data: {
//       currentPeriodStart: new Date(subscription.current_period_start * 1000),
//       currentPeriodEnd: new Date(subscription.current_period_end * 1000),
//     },
//   });
// }

async function handlePaymentSucceeded(invoiceData: Stripe.Invoice) {
  const invoice = invoiceData as Stripe.Invoice & { [key: string]: any };
  if (!invoice.subscription) return;

  const subscription = (await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )) as Stripe.Subscription & { [key: string]: any };

  // Get start date from available properties
  let startTimestamp = subscription.start_date;
  if (!startTimestamp && subscription.billing_cycle_anchor) {
    startTimestamp = subscription.billing_cycle_anchor;
  }
  if (!startTimestamp && subscription.created) {
    startTimestamp = subscription.created;
  }

  // Calculate end date
  let endDate = new Date();
  const startDate = new Date(startTimestamp * 1000);

  // Get interval
  let interval = "month"; // Default
  if (subscription.items?.data?.[0]?.plan?.interval) {
    interval = subscription.items.data[0].plan.interval;
  }

  // Calculate end date based on interval
  switch (interval) {
    case "day":
      endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 1);
      break;
    case "week":
      endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "month":
      endDate = new Date(startDate.getTime());
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "year":
      endDate = new Date(startDate.getTime());
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate = new Date(startDate.getTime());
      endDate.setMonth(endDate.getMonth() + 1);
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
    },
  });
}

// function mapSubscriptionData(
//   subscription: Stripe.Subscription & { [key: string]: any },
//   userId: string
// ) {
//   return {
//     stripeSubscriptionId: subscription.id,
//     status: subscription.status,
//     currentPeriodStart: new Date(subscription.current_period_start * 1000),
//     currentPeriodEnd: new Date(subscription.current_period_end * 1000),
//     interval: subscription.items.data[0].plan.interval,
//     planId: subscription.items.data[0].plan.id,
//     userId, // essential for `create`
//   };
// }

// function mapSubscriptionData(
//   subscription: Stripe.Subscription & { [key: string]: any },
//   userId: string
// ) {
//   // Get start date from available properties
//   let startTimestamp = subscription.start_date;
//   if (!startTimestamp && subscription.billing_cycle_anchor) {
//     startTimestamp = subscription.billing_cycle_anchor;
//   }
//   if (!startTimestamp && subscription.created) {
//     startTimestamp = subscription.created;
//   }

//   // Calculate end date
//   let endDate = new Date();
//   const startDate = new Date(startTimestamp * 1000);

//   // Get interval
//   let interval = "month"; // Default
//   if (subscription.items?.data?.[0]?.plan?.interval) {
//     interval = subscription.items.data[0].plan.interval;
//   }

//   // Calculate end date based on interval
//   switch (interval) {
//     case "day":
//       endDate = new Date(startDate.getTime());
//       endDate.setDate(endDate.getDate() + 1);
//       break;
//     case "week":
//       endDate = new Date(startDate.getTime());
//       endDate.setDate(endDate.getDate() + 7);
//       break;
//     case "month":
//       endDate = new Date(startDate.getTime());
//       endDate.setMonth(endDate.getMonth() + 1);
//       break;
//     case "year":
//       endDate = new Date(startDate.getTime());
//       endDate.setFullYear(endDate.getFullYear() + 1);
//       break;
//     default:
//       endDate = new Date(startDate.getTime());
//       endDate.setMonth(endDate.getMonth() + 1);
//   }

//   // Get plan ID safely
//   const planId = subscription.items?.data?.[0]?.plan?.id || "unknown_plan";

//   return {
//     stripeSubscriptionId: subscription.id,
//     status: subscription.status,
//     currentPeriodStart: startDate,
//     currentPeriodEnd: endDate,
//     interval: interval,
//     planId: planId,
//     userId,
//   };
// }
