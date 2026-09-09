import Link from "next/link";

/**
 * Shown in place of the workspace when the account is signed in but has no
 * active subscription. `invert-panel` keeps it dark in both themes.
 */
const PaywallPanel = () => (
  <div className="px-5 py-6 md:p-10">
    <div className="invert-panel flex flex-col gap-3.5 px-5 py-6 md:gap-5 md:p-12">
      <h1 className="t-section">A plan is needed to run summaries</h1>
      <p className="t-body max-w-[400px] text-subtle">
        $5.99 a month, up to 20 pages and 10 MB per PDF, cancel whenever.
      </p>
      <div className="mt-1 flex flex-col gap-2.5 md:flex-row md:gap-3">
        <Link
          href="/pricing"
          className="btn btn-signal py-3.5 text-[15px] md:px-6 md:py-3.5"
        >
          Subscribe
        </Link>
        <Link
          href="/#features"
          className="btn btn-outline hidden py-3.5 text-[15px] md:inline-flex md:px-6"
        >
          See what&apos;s included
        </Link>
      </div>
    </div>
  </div>
);

export default PaywallPanel;
