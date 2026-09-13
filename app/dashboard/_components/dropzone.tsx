"use client";

import { type DragEvent, useCallback, useState } from "react";
import { PDF_PROCESSING } from "@/lib/constants";

/**
 * Drop target for the file picker the parent owns. While a file is over it, the
 * border and background step to the accent — the only motion is a colour change.
 */
const Dropzone = ({
  onFile,
  onBrowse,
  disabled = false,
}: {
  onFile: (file: File) => void;
  onBrowse: () => void;
  disabled?: boolean;
}) => {
  const [isDragging, setDragging] = useState(false);

  const handleDragLeave = useCallback(() => setDragging(false), []);
  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) {
        setDragging(true);
      }
    },
    [disabled]
  );
  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) {
        return;
      }

      const [file] = event.dataTransfer.files;
      if (file) {
        onFile(file);
      }
    },
    [disabled, onFile]
  );

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions lint/a11y/noStaticElementInteractions: Native drag events need a container while the nested button remains the keyboard-accessible action.
    <div
      className={`flex flex-col items-center gap-3 border border-dashed px-5 py-7 text-center transition-colors duration-150 ${
        isDragging
          ? "border-signal bg-signal-soft"
          : "border-line-strong bg-surface md:bg-surface-2"
      }`}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="font-medium text-[15px]">Drop a PDF here</div>
      <div className="text-[13px] text-meta">
        Up to {PDF_PROCESSING.MAX_PAGES} pages · 10 MB max
      </div>
      <button
        className="btn btn-ink px-5.5 py-3 text-[15px] md:px-4.5 md:py-2.5 md:text-[14px]"
        disabled={disabled}
        onClick={onBrowse}
        type="button"
      >
        Choose file
      </button>
      <p className="max-w-[260px] text-[12px] text-meta leading-[1.5]">
        Your PDF is processed in this browser and is not saved to your account
        or our database. Extracted text is sent to Gemini to create your
        summary.
      </p>
    </div>
  );
};

export default Dropzone;
