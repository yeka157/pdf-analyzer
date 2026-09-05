// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Dropzone from "./Dropzone";

describe("Dropzone", () => {
  it("explains that uploaded PDFs are not saved", () => {
    render(<Dropzone onBrowse={vi.fn()} onFile={vi.fn()} />);

    expect(
      screen.getByText(
        /your pdf is processed in this browser and is not saved to your account or our database/i
      )
    ).toBeInTheDocument();
  });

  it("explains that extracted text is sent to Gemini for a summary", () => {
    render(<Dropzone onBrowse={vi.fn()} onFile={vi.fn()} />);

    expect(
      screen.getByText(
        /extracted text is sent to gemini to create your summary/i
      )
    ).toBeInTheDocument();
  });
});
