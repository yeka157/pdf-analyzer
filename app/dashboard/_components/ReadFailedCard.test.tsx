// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ReadFailedCard from "./ReadFailedCard";

describe("ReadFailedCard", () => {
  it("retries the same file after a transient failure", () => {
    const onRetry = vi.fn();

    render(
      <ReadFailedCard
        message="The analysis service is unavailable."
        canRetry
        onRetry={onRetry}
        onChooseAnother={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry this file" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("asks for another file when retrying cannot help", () => {
    const onChooseAnother = vi.fn();

    render(
      <ReadFailedCard
        message="The PDF has no selectable text."
        canRetry={false}
        onRetry={vi.fn()}
        onChooseAnother={onChooseAnother}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Choose another PDF" })
    );

    expect(onChooseAnother).toHaveBeenCalledOnce();
  });
});
