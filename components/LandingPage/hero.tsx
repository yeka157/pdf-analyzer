import Link from "next/link";

const FEATURES = [
  { body: "The whole document in a few paragraphs.", title: "Summaries" },
  { body: "Dates, amounts and names pulled out.", title: "Key terms" },
  { body: "Up to 20 pages and 10 MB per PDF.", title: "Clear limits" },
];

const KEY_TERMS = [
  { label: "Term", value: "12 months" },
  { label: "Payment", value: "Net 30" },
  { label: "Late fee", value: "1.5% monthly" },
  { label: "Cure", value: "15 days" },
];

const Hero = () => {
  return (
    <>
      <div className="grid grid-cols-1 items-center gap-10 px-5 pt-11 pb-10 md:grid-cols-2 md:gap-16 md:px-10 md:pt-26 md:pb-24">
        <div className="flex flex-col gap-5 md:gap-7">
          <h1 className="t-display">The short version of any PDF.</h1>
          <p className="t-body-lg max-w-[400px] text-subtle">
            Upload a document and read a summary you can finish in a minute.
          </p>
          <div className="mt-1 flex flex-col gap-2.5 md:flex-row md:items-center md:gap-3">
            <Link
              className="btn btn-signal px-5 py-4 text-[16px] md:px-[26px] md:py-[15px] md:text-[15px]"
              href="/dashboard"
            >
              Upload a PDF
            </Link>
            <Link
              className="btn btn-outline px-5 py-4 text-[16px] md:px-5 md:py-[15px] md:text-[15px]"
              href="/pricing"
            >
              See pricing
            </Link>
          </div>
        </div>

        {/*
          The right-hand panel is a real summary rather than a decorative
          graphic: it is the product's output, shown at rest.
        */}
        <div className="border border-line-strong bg-surface">
          <div className="t-meta flex items-center justify-between border-line-strong border-b px-4 py-3.5 text-meta md:px-5 md:py-4">
            <span>lease-agreement.pdf</span>
            <span className="text-signal">summary ready</span>
          </div>
          <div className="flex flex-col gap-3.5 px-4 py-4.5 md:px-5 md:py-6">
            <p className="text-[14px] leading-[1.7] md:text-[15px]">
              Twelve-month term from the effective date. Renews automatically
              unless either party gives notice thirty days prior.
            </p>
            <div className="h-px bg-line-strong" />
            <div className="grid grid-cols-2 gap-3">
              {KEY_TERMS.map((term) => (
                <div key={term.label}>
                  <div className="t-label mb-[5px] text-[11px] text-meta">
                    {term.label}
                  </div>
                  <div className="font-mono text-[11px]">{term.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="grid scroll-mt-20 grid-cols-1 border-line border-t md:grid-cols-3"
        id="features"
      >
        {FEATURES.map((feature, index) => (
          <div
            className={`flex flex-col gap-1 px-5 py-5.5 md:gap-2 md:px-10 md:py-9 ${
              index < FEATURES.length - 1
                ? "border-line border-b md:border-r md:border-b-0"
                : ""
            }`}
            key={feature.title}
          >
            <div className="t-sub text-[18px] md:text-[20px]">
              {feature.title}
            </div>
            <div className="text-[14px] text-subtle leading-[1.6] md:text-[15px]">
              {feature.body}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Hero;
