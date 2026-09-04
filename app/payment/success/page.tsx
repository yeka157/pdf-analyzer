import Link from "next/link";
import { CircleCheck } from "lucide-react";
import React from "react";

const PaymentSuccess = () => (
  <div className="px-5 py-8 md:px-10 md:py-12">
    <div className="mx-auto max-w-[608px] border border-line bg-surface px-5 py-7 md:p-8">
      <div className="mb-3 flex items-center gap-2.5">
        <CircleCheck
          aria-hidden
          strokeWidth={2}
          className="size-5 shrink-0 text-signal"
        />
        <h1 className="t-card">Payment received</h1>
      </div>
      <p className="t-body mb-5.5 text-subtle">Your subscription is active.</p>
      <Link
        href="/dashboard"
        className="btn btn-ink px-5.5 py-3 text-[15px] md:text-[14px]"
      >
        Open documents
      </Link>
    </div>
  </div>
);

export default PaymentSuccess;
