import { formatPages } from "./types";

const SKELETON_WIDTHS = ["100%", "92%", "74%", "88%"];

const ProcessingCard = ({
  name,
  pageCount,
  onCancel,
}: {
  name: string;
  pageCount: number;
  onCancel: () => void;
}) => (
  <div className="flex flex-col gap-5 border border-line bg-surface px-5 py-6 md:gap-6 md:p-10">
    <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-6">
      <div className="t-card truncate">{name}</div>
      <div className="t-meta shrink-0 text-[10px] text-signal md:text-[11px]">
        Reading{pageCount > 0 ? ` · ${formatPages(pageCount)}` : ""}
      </div>
    </div>

    <div
      aria-label="Reading document"
      className="progress-track"
      role="progressbar"
    >
      <span />
    </div>

    <div className="hidden flex-col gap-3 md:flex">
      {SKELETON_WIDTHS.map((width) => (
        <div className="skeleton-bar" key={width} style={{ width }} />
      ))}
    </div>

    <div className="flex items-center justify-between gap-4">
      <div className="t-small text-subtle">
        This usually takes a few seconds.
      </div>
      <button
        className="btn btn-quiet shrink-0 text-[13px]"
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
    </div>
  </div>
);

export default ProcessingCard;
