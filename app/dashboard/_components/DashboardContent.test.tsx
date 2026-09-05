// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { extractTextFromPDF } = vi.hoisted(() => ({
  extractTextFromPDF: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/pdfUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdfUtils")>();

  return { ...actual, extractTextFromPDF };
});

import DashboardContent from "./DashboardContent";

const fetchMock = vi.fn();
global.fetch = fetchMock;

const selectFile = (file: File) => {
  fireEvent.change(screen.getByLabelText("Upload PDF"), {
    target: { files: [file] },
  });
};

const runSelectedFile = () => {
  fireEvent.click(screen.getByRole("button", { name: "Run summary" }));
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardContent", () => {
  it("shows processing while PDF text is being extracted", async () => {
    let resolveExtraction: (value: { text: string; pageCount: number }) => void;
    extractTextFromPDF.mockReturnValue(
      new Promise((resolve) => {
        resolveExtraction = resolve;
      })
    );

    render(<DashboardContent />);
    selectFile(
      new File(["pdf"], "consulting-agreement.pdf", {
        type: "application/pdf",
      })
    );
    runSelectedFile();

    expect(
      await screen.findByRole("progressbar", { name: "Reading document" })
    ).toBeInTheDocument();

    resolveExtraction!({ text: "Agreement text", pageCount: 1 });
  });

  it("removes a document when processing is cancelled", async () => {
    let resolveExtraction: (value: { text: string; pageCount: number }) => void;
    extractTextFromPDF.mockReturnValue(
      new Promise((resolve) => {
        resolveExtraction = resolve;
      })
    );

    render(<DashboardContent />);
    selectFile(
      new File(["pdf"], "consulting-agreement.pdf", {
        type: "application/pdf",
      })
    );
    runSelectedFile();

    await screen.findByRole("progressbar", { name: "Reading document" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("No documents yet")).toBeInTheDocument();
    expect(
      screen.queryByText("consulting-agreement.pdf")
    ).not.toBeInTheDocument();

    resolveExtraction!({ text: "Agreement text", pageCount: 1 });
  });

  it("aborts the Gemini request when analysis is cancelled", async () => {
    extractTextFromPDF.mockResolvedValue({
      text: "Agreement text",
      pageCount: 1,
    });
    let requestSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url, options) => {
      requestSignal = options.signal;

      return new Promise(() => undefined);
    });

    render(<DashboardContent />);
    selectFile(
      new File(["pdf"], "consulting-agreement.pdf", {
        type: "application/pdf",
      })
    );
    runSelectedFile();

    await screen.findByRole("progressbar", { name: "Reading document" });
    await waitFor(() => expect(requestSignal).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(requestSignal?.aborted).toBe(true);
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
  });

  it("shows a completed summary after a valid PDF is processed", async () => {
    extractTextFromPDF.mockResolvedValue({
      text: "A short agreement about consulting services.",
      pageCount: 2,
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        summary: ["The agreement covers consulting services."],
        keyTerms: [{ label: "Term", value: "12 months" }],
      }),
    });

    render(<DashboardContent />);
    selectFile(
      new File(["pdf"], "consulting-agreement.pdf", {
        type: "application/pdf",
      })
    );
    runSelectedFile();

    expect(await screen.findByText("The agreement covers consulting services.")).toBeInTheDocument();
    expect(screen.getAllByText("2 pages · added today")).not.toHaveLength(0);
    expect(screen.getByText("12 months")).toBeInTheDocument();
  });

  it("offers a retry and replaces the failure with a completed summary", async () => {
    extractTextFromPDF.mockResolvedValue({
      text: "A short agreement about consulting services.",
      pageCount: 1,
    });
    fetchMock
      .mockRejectedValueOnce(new Error("The summary service is unavailable."))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summary: ["The retry completed successfully."],
          keyTerms: [],
        }),
      });

    render(<DashboardContent />);
    selectFile(
      new File(["pdf"], "consulting-agreement.pdf", {
        type: "application/pdf",
      })
    );
    runSelectedFile();

    expect(
      await screen.findByText("The summary service is unavailable.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry this file" }));

    expect(
      await screen.findByText("The retry completed successfully.")
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText("The summary service is unavailable.")
      ).not.toBeInTheDocument();
    });
  });

  it("rejects a PDF over 10 MB before it can be summarized", () => {
    render(<DashboardContent />);
    selectFile(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf", {
        type: "application/pdf",
      })
    );

    expect(
      screen.getByText("Choose a PDF that is 10 MB or smaller.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Run summary" })
    ).not.toBeInTheDocument();
  });
});
