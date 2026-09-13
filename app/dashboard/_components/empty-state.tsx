import { LogoMark } from "@/components/logo";

const EmptyState = ({ onUpload }: { onUpload: () => void }) => (
  <div className="mx-auto flex w-full max-w-[596px] flex-col items-center gap-4 border border-line px-6 py-14 text-center md:gap-4.5 md:px-12 md:py-16">
    <LogoMark />
    <div className="t-section">No documents yet</div>
    <p className="t-body max-w-[380px] text-subtle">
      Upload your first PDF and the summary appears here.
    </p>
    <button
      className="btn btn-ink mt-1.5 px-6.5 py-3.5 text-[15px]"
      onClick={onUpload}
      type="button"
    >
      Upload a PDF
    </button>
  </div>
);

export default EmptyState;
