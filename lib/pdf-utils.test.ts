import { describe, expect, it } from "vitest";

import { assertPageLimit, validatePdfFile } from "./pdf-utils";

describe("validatePdfFile", () => {
  it("accepts a PDF identified by its MIME type", () => {
    expect(
      validatePdfFile({
        name: "agreement",
        size: 1024,
        type: "application/pdf",
      })
    ).toBeNull();
  });

  it("accepts a PDF extension when the browser omits the MIME type", () => {
    expect(
      validatePdfFile({ name: "agreement.PDF", size: 1024, type: "" })
    ).toBeNull();
  });

  it("rejects a non-PDF file before extraction", () => {
    expect(
      validatePdfFile({ name: "notes.txt", size: 1024, type: "text/plain" })
    ).toBe("Choose a PDF file to summarize.");
  });

  it("rejects a PDF larger than 10 MB before extraction", () => {
    expect(
      validatePdfFile({
        name: "large-agreement.pdf",
        size: 10 * 1024 * 1024 + 1,
        type: "application/pdf",
      })
    ).toBe("Choose a PDF that is 10 MB or smaller.");
  });
});

describe("assertPageLimit", () => {
  it("allows a document at the configured page limit", () => {
    expect(() => assertPageLimit(20)).not.toThrow();
  });

  it("rejects a document over the configured page limit", () => {
    expect(() => assertPageLimit(21)).toThrow(
      "This PDF has 21 pages. The limit is 20 pages."
    );
  });
});
