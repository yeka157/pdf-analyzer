import type { KeyTerm } from "@/app/api/analyze/route";

export type DocumentStatus = "reading" | "done" | "failed";

/**
 * A document lives for the length of the session: nothing here is persisted,
 * so "Recent" means "uploaded in this tab" rather than "in your account".
 */
export type DigestDocument = {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  addedAt: number;
  status: DocumentStatus;
  summary: string[];
  keyTerms: KeyTerm[];
  error?: string;
  canRetry: boolean;
};

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  reading: "Reading",
  done: "Done",
  failed: "Failed",
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
