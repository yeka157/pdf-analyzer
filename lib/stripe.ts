import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY configuration");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
});

export const getStripeSession = async ({
  priceId,
  domainUrl,
  customerId,
  successUrl,
}: {
  priceId: string;
  domainUrl: string;
  customerId: string;
  successUrl?: string;
}) => {
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    cancel_url: `${domainUrl}/payment/cancel`,
    customer: customerId,
    customer_update: { address: "auto", name: "auto" },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    payment_method_types: ["card"],
    success_url: successUrl || `${domainUrl}/payment/success`,
  });

  return session.url as string;
};
