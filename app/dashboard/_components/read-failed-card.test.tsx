// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ReadFailedCard from "./read-failed-card";

describe("ReadFailedCard", () => {
  it("retries the same file after a transient failure", () => {
    const onRetry = vi.fn();

    render(
      <ReadFailedCard
        canRetry
        message="The analysis service is unavailable."
        onChooseAnother={vi.fn()}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry this file" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("asks for another file when retrying cannot help", () => {
    const onChooseAnother = vi.fn();

    render(
      <ReadFailedCard
        canRetry={false}
        message="The PDF has no selectable text."
        onChooseAnother={onChooseAnother}
        onRetry={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose another PDF" }));

    expect(onChooseAnother).toHaveBeenCalledOnce();
  });
});
