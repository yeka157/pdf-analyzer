import type { KeyTerm } from "@/app/api/analyze/route";

export type DocumentStatus = "reading" | "done" | "failed";

/**
 * A document lives for the length of the session: nothing here is persisted,
 * so "Recent" means "uploaded in this tab" rather than "in your account".
 */
export interface DigestDocument {
  addedAt: number;
  canRetry: boolean;
  error?: string;
  file: File;
  id: string;
  keyTerms: KeyTerm[];
  name: string;
  pageCount: number;
  status: DocumentStatus;
  summary: string[];
}

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  done: "Done",
  failed: "Failed",
  reading: "Reading",
};

export const formatPages = (pageCount: number) =>
  `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;

export const formatAdded = (addedAt: number) => {
  const added = new Date(addedAt);
  const isToday = added.toDateString() === new Date().toDateString();

  return isToday
    ? "added today"
    : `added ${added.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}`;
};
