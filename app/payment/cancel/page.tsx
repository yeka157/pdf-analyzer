import Link from "next/link";

import { LogoMark } from "@/components/logo";

/**
 * Stripe's `cancel_url`: the customer backed out of checkout, so nothing was
 * charged and no subscription changed. Uses the dark card treatment from the
 * subscription screens.
 */
const PaymentCancel = () => (
  <div className="px-5 py-8 md:px-10 md:py-12">
    <div className="mx-auto max-w-[404px] px-5 py-7 invert-panel md:p-9">
      <LogoMark className="mb-5" />
      <h1 className="t-auth mb-2">Checkout cancelled</h1>
      <p className="t-ui mb-5.5 text-subtle leading-[1.6]">
        Nothing was charged. Pick the plan back up whenever you are ready.
      </p>
      <div className="flex flex-col gap-2.5">
        <Link
          className="btn btn-signal w-full py-3.5 text-[15px]"
          href="/pricing"
        >
          Back to pricing
        </Link>
        <Link
          className="btn btn-outline w-full py-3.5 text-[15px]"
          href="/dashboard"
        >
          Back to documents
        </Link>
      </div>
    </div>
  </div>
);

export default PaymentCancel;
