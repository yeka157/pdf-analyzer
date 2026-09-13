import type { KeyTerm } from "@/app/api/analyze/route";

const SummaryCard = ({
  summary,
  keyTerms,
}: {
  summary: string[];
  keyTerms: KeyTerm[];
}) => (
  <div className="flex flex-col gap-6 border border-line bg-surface px-5 py-6 md:px-10 md:py-9">
    {/*
      The 62ch measure is the point of this card: a summary should read as
      prose, so the text does not run the full width of the column.
    */}
    {summary.map((paragraph) => (
      <p className="t-prose" key={paragraph}>
        {paragraph}
      </p>
    ))}

    {keyTerms.length > 0 && (
      <>
        <div className="h-px bg-line-soft" />
        <div className="flex flex-col gap-4">
          <div className="t-sub text-[18px] md:text-[20px]">Key terms</div>
          <div className="tile-grid grid-cols-2 border border-line-soft md:grid-cols-4 md:border-0">
            {keyTerms.map((term) => (
              <div className="p-3.5 md:p-4" key={term.label}>
                <div className="t-label-sm mb-1.5 text-meta">{term.label}</div>
                <div className="font-medium text-[15px] md:text-[16px]">
                  {term.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
);

export default SummaryCard;
