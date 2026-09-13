import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import RedirectComponent from "@/components/redirect-component";
import ThemeToggle from "@/components/theme/theme-toggle";
import { checkAuthenticationAndSubscription } from "@/lib/check-auth-subscription";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import AccountNav from "./_components/account-nav";
import ProfileForm from "./_components/profile-form";

interface Invoice {
  amount: string;
  date: string;
  id: string;
  status: string;
}

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

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    currency: currency.toUpperCase(),
    style: "currency",
  }).format(amount / 100);

const INTERVAL_LABEL: Record<string, string> = {
  day: "a day",
  month: "a month",
  week: "a week",
  year: "a year",
};

async function getBilling(userId: string) {
  await connection();

  const subscription = await prisma.subscription.findUnique({
    select: {
      currentPeriodEnd: true,
      planId: true,
      status: true,
      stripeSubscriptionId: true,
      user: { select: { stripeCustomerId: true } },
    },
    where: { userId },
  });

  if (!subscription) {
    return { invoices: [], price: null, subscription: null };
  }

  // Stripe is the source of truth for both the amount and the invoice history.
  // Neither is mirrored locally, and neither is worth failing the whole page
  // over — the card degrades to what the database already knows.
  let price: string | null = null;
  let invoices: Invoice[] = [];

  try {
    const remotePrice = await stripe.prices.retrieve(subscription.planId);

    if (remotePrice.unit_amount !== null) {
      const interval = remotePrice.recurring?.interval ?? "month";
      price = `${formatMoney(remotePrice.unit_amount, remotePrice.currency)} ${
        INTERVAL_LABEL[interval] ?? `a ${interval}`
      }`;
    }
  } catch (error) {
    console.error("Could not load the subscription price from Stripe", error);
  }

  const customerId = subscription.user.stripeCustomerId;

  if (customerId) {
    try {
      const remoteInvoices = await stripe.invoices.list({
        customer: customerId,
        limit: 5,
      });

      invoices = remoteInvoices.data
        .filter((invoice) => invoice.status !== "draft")
        .map((invoice) => ({
          amount: formatMoney(invoice.amount_paid, invoice.currency),
          date: new Date(invoice.created * 1000).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          id: invoice.id ?? `${invoice.created}`,
          status: invoice.status ?? "open",
        }));
    } catch (error) {
      console.error("Could not load invoices from Stripe", error);
    }
  }

  return { invoices, price, subscription };
}

const Account = async () => {
  const authCheck = await checkAuthenticationAndSubscription();

  if (!(authCheck.isAuthenticated && authCheck.userId)) {
    return <RedirectComponent to="/sign-in?redirect_url=/account" />;
  }

  const [user, billing] = await Promise.all([
    currentUser(),
    getBilling(authCheck.userId),
  ]);

  const { subscription, price, invoices } = billing;
  const isActive = subscription?.status === "active";
  const hasEnded = !!subscription && !isActive;

  const openBillingPortal = async () => {
    "use server";

    const customerId = subscription?.user.stripeCustomerId;

    if (!customerId) {
      return redirect("/pricing");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getDomainUrl()}/account`,
    });

    return redirect(session.url);
  };

  const openCancelFlow = async () => {
    "use server";

    const customerId = subscription?.user.stripeCustomerId;

    if (!(customerId && subscription)) {
      return redirect("/pricing");
    }

    const returnUrl = `${getDomainUrl()}/account`;
    let url: string;

    // Deep-linking straight to cancellation requires the portal configuration
    // to allow it. If it does not, fall back to the portal's home rather than
    // failing the action.
    try {
      ({ url } = await stripe.billingPortal.sessions.create({
        customer: customerId,
        flow_data: {
          subscription_cancel: {
            subscription: subscription.stripeSubscriptionId,
          },
          type: "subscription_cancel",
        },
        return_url: returnUrl,
      }));
    } catch (error) {
      console.error("Cancellation flow unavailable, opening the portal", error);
      ({ url } = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      }));
    }

    return redirect(url);
  };

  const renewalDate = subscription?.currentPeriodEnd.toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );
  let billingDescription = "No plan yet.";
  let billingStatus = "None";

  if (isActive) {
    billingDescription = `${price ?? "Your plan"}${
      renewalDate ? ` · renews ${renewalDate}` : ""
    }`;
    billingStatus = "Active";
  } else if (hasEnded) {
    billingDescription = `Your plan ended${
      renewalDate ? ` on ${renewalDate}` : ""
    }.`;
    billingStatus = "Ended";
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] md:gap-10">
        <AccountNav />

        <div className="flex max-w-[720px] flex-col gap-6">
          <section className="scroll-mt-24" id="profile">
            <ProfileForm key={user?.id} />
          </section>

          <div className="flex flex-col gap-4 border border-line bg-surface px-5 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:p-8">
            <div className="flex flex-col gap-1.5">
              <h2 className="t-sub">Appearance</h2>
              <p className="t-ui text-subtle">
                Follows your system by default.
              </p>
            </div>
            <ThemeToggle includeSystem />
          </div>

          <section
            className="flex scroll-mt-24 flex-col gap-5 border border-line bg-surface px-5 py-6 md:gap-5.5 md:p-8"
            id="billing"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="t-card">Billing</h2>
                <p className="t-ui text-subtle">{billingDescription}</p>
              </div>

              <span
                className={`t-meta shrink-0 self-start px-2.5 py-1.5 ${
                  isActive ? "pill" : "bg-surface-2 text-meta"
                }`}
              >
                {billingStatus}
              </span>
            </div>

            {invoices.length > 0 && (
              <div className="flex flex-col gap-px bg-line-soft">
                {invoices.map((invoice) => (
                  <div
                    className="flex items-center justify-between gap-4 bg-surface py-3.5 text-[15px]"
                    key={invoice.id}
                  >
                    <span className="text-subtle">{invoice.date}</span>
                    <span>{invoice.amount}</span>
                    <span
                      className={`t-meta ${
                        invoice.status === "paid"
                          ? "text-signal-fg"
                          : "text-meta"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              {subscription ? (
                <>
                  <form action={openBillingPortal}>
                    <button
                      className="btn btn-ink px-5.5 py-3 text-[15px] md:text-[14px]"
                      type="submit"
                    >
                      Manage subscription
                    </button>
                  </form>
                  {isActive && (
                    <form action={openCancelFlow}>
                      <button
                        className="btn btn-quiet px-2 py-3 text-[14px]"
                        type="submit"
                      >
                        Cancel plan
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <Link
                  className="btn btn-ink px-5.5 py-3 text-[15px] md:text-[14px]"
                  href="/pricing"
                >
                  Subscribe
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Account;
