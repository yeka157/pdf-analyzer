// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecentList from "./recent-list";
import type { DigestDocument } from "./types";

const document: DigestDocument = {
  addedAt: Date.now(),
  canRetry: false,
  file: new File(["pdf"], "contract.pdf", { type: "application/pdf" }),
  id: "document-1",
  keyTerms: [],
  name: "contract.pdf",
  pageCount: 3,
  status: "done",
  summary: [],
};

describe("RecentList", () => {
  it("removes an individual session document", () => {
    const onRemove = vi.fn();

    render(
      <RecentList
        documents={[document]}
        onClear={vi.fn()}
        onRemove={onRemove}
        onSelect={vi.fn()}
        selectedId={document.id}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Remove contract.pdf" })
    );

    expect(onRemove).toHaveBeenCalledWith(document.id);
  });

  it("clears all session documents", () => {
    const onClear = vi.fn();

    render(
      <RecentList
        documents={[document]}
        onClear={onClear}
        onRemove={vi.fn()}
        onSelect={vi.fn()}
        selectedId={document.id}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(onClear).toHaveBeenCalledOnce();
  });
});
