import { CircleAlert } from "lucide-react";

const ReadFailedCard = ({
  message,
  canRetry,
  onRetry,
  onChooseAnother,
}: {
  message: string;
  canRetry: boolean;
  onRetry: () => void;
  onChooseAnother: () => void;
}) => (
  <div className="flex flex-col gap-3 border border-line border-l-2 border-l-danger bg-surface px-5 py-6 md:gap-4 md:p-10">
    <div className="flex items-center gap-2.5">
      <CircleAlert
        aria-hidden
        strokeWidth={2}
        className="size-5 shrink-0 text-danger"
      />
      <div className="t-card">This file could not be read</div>
    </div>
    <p className="t-body text-subtle">{message}</p>
    {canRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-ink mt-1 self-start px-5.5 py-3 text-[15px] md:text-[14px]"
      >
        Retry this file
      </button>
    ) : (
      <button
        type="button"
        onClick={onChooseAnother}
        className="btn btn-ink mt-1 self-start px-5.5 py-3 text-[15px] md:text-[14px]"
      >
        Choose another PDF
      </button>
    )}
  </div>
);

export default ReadFailedCard;
