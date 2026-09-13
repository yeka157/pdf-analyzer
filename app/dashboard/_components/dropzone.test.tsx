// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Dropzone from "./dropzone";

const PRIVATE_PROCESSING_COPY =
  /your pdf is processed in this browser and is not saved to your account or our database/i;
const GEMINI_PROCESSING_COPY =
  /extracted text is sent to gemini to create your summary/i;

describe("Dropzone", () => {
  it("explains that uploaded PDFs are not saved", () => {
    render(<Dropzone onBrowse={vi.fn()} onFile={vi.fn()} />);

    expect(screen.getByText(PRIVATE_PROCESSING_COPY)).toBeInTheDocument();
  });

  it("explains that extracted text is sent to Gemini for a summary", () => {
    render(<Dropzone onBrowse={vi.fn()} onFile={vi.fn()} />);

    expect(screen.getByText(GEMINI_PROCESSING_COPY)).toBeInTheDocument();
  });
});
