// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DigestDocument } from "./types";
import RecentList from "./RecentList";

const document: DigestDocument = {
  id: "document-1",
  file: new File(["pdf"], "contract.pdf", { type: "application/pdf" }),
  name: "contract.pdf",
  pageCount: 3,
  addedAt: Date.now(),
  status: "done",
  summary: [],
  keyTerms: [],
  canRetry: false,
};

describe("RecentList", () => {
  it("removes an individual session document", () => {
    const onRemove = vi.fn();

    render(
      <RecentList
        documents={[document]}
        selectedId={document.id}
        onSelect={vi.fn()}
        onRemove={onRemove}
        onClear={vi.fn()}
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
        selectedId={document.id}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(onClear).toHaveBeenCalledOnce();
  });
});
