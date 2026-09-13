"use client";

import type { MouseEvent } from "react";

import {
  type DigestDocument,
  formatAdded,
  formatPages,
  STATUS_LABEL,
} from "./types";

const statusColor: Record<DigestDocument["status"], string> = {
  done: "text-signal-fg",
  failed: "text-danger-fg",
  reading: "text-meta",
};

const RecentList = ({
  documents,
  selectedId,
  onSelect,
  onRemove,
  onClear,
}: {
  documents: DigestDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) => {
  if (documents.length === 0) {
    return null;
  }

  const handleSelect = (event: MouseEvent<HTMLButtonElement>) => {
    const { documentId } = event.currentTarget.dataset;
    if (documentId) {
      onSelect(documentId);
    }
  };

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    const { documentId } = event.currentTarget.dataset;
    if (documentId) {
      onRemove(documentId);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="t-label text-meta">Recent</div>
        <button
          className="btn btn-quiet t-label"
          onClick={onClear}
          type="button"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col border border-line md:border-0">
        {documents.map((document, index) => {
          const isSelected = document.id === selectedId;

          return (
            <div
              className={`flex items-stretch gap-1 border-l-2 transition-colors duration-150 ${
                isSelected
                  ? "border-l-signal bg-surface-2 md:bg-surface-2"
                  : "border-l-transparent hover:bg-surface-2"
              } ${index < documents.length - 1 ? "border-b border-b-line-soft md:border-b-0" : ""}`}
              key={document.id}
            >
              <button
                aria-current={isSelected}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-4 text-left md:px-3.5 md:py-3"
                data-document-id={document.id}
                onClick={handleSelect}
                type="button"
              >
                <span className="flex flex-col gap-[3px] overflow-hidden">
                  <span
                    className={`truncate text-[15px] md:text-[14px] ${
                      isSelected ? "font-medium" : ""
                    }`}
                  >
                    {document.name}
                  </span>
                  <span className="t-label-sm text-meta md:hidden">
                    {document.pageCount > 0
                      ? `${formatPages(document.pageCount)} · `
                      : ""}
                    {formatAdded(document.addedAt)}
                  </span>
                </span>

                <span
                  className={`t-label-sm shrink-0 md:hidden ${
                    statusColor[document.status]
                  }`}
                >
                  {STATUS_LABEL[document.status]}
                </span>
                <span className="hidden shrink-0 font-mono text-[11px] text-meta md:inline">
                  {document.pageCount > 0 ? `${document.pageCount}p` : "—"}
                </span>
              </button>
              <button
                aria-label={`Remove ${document.name}`}
                className="btn btn-quiet shrink-0 px-3 text-[11px]"
                data-document-id={document.id}
                onClick={handleRemove}
                type="button"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentList;
