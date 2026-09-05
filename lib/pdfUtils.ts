import { PDF_PROCESSING } from "./constants";
import type { TextContent } from "pdfjs-dist/types/src/display/api";

let workerConfigured = false;

export type ExtractedPdf = {
  text: string;
  pageCount: number;
};

type PdfFileMetadata = Pick<File, "name" | "type" | "size">;

export const validatePdfFile = (file: PdfFileMetadata) => {
  const hasPdfMimeType = file.type === "application/pdf";
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");

  if (!hasPdfMimeType && !hasPdfExtension) {
    return "Choose a PDF file to summarize.";
  }

  if (file.size > PDF_PROCESSING.MAX_FILE_SIZE_BYTES) {
    return "Choose a PDF that is 10 MB or smaller.";
  }

  return null;
};

export const assertPageLimit = (pageCount: number) => {
  if (pageCount > PDF_PROCESSING.MAX_PAGES) {
    throw new Error(
      `This PDF has ${pageCount} pages. The limit is ${PDF_PROCESSING.MAX_PAGES} pages.`
    );
  }
};

/**
 * pdfjs-dist 6 touches browser-only globals (DOMMatrix) at module scope, so it
 * cannot be imported at the top level — client components are still evaluated
 * during server rendering, which would throw. Load it on first use instead.
 */
async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");

  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_PROCESSING.WORKER_SRC;
    workerConfigured = true;
  }

  return pdfjs;
}

export const extractTextFromPDF = async (
  file: File
): Promise<ExtractedPdf> => {
  try {
    const { getDocument } = await loadPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    const numPages = pdf.numPages;
    assertPageLimit(numPages);
    const pagePromise = Array.from({ length: numPages }, (_, i) => i + 1).map(
      async (pageNum) => {
        const page = await pdf.getPage(pageNum);
        const content = (await page.getTextContent()) as TextContent;

        return content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
      }
    );

    const pageTexts = await Promise.all(pagePromise);

    // The page count is part of the document's own metadata line in the UI, so
    // it is returned alongside the text rather than recomputed by the caller.
    return { text: pageTexts.join("\n"), pageCount: numPages };
  } catch (error) {
    console.error("PDF Extraction Failed", error);
    throw new Error(
      error instanceof Error
        ? `Failed to extract text from PDF: ${error.message}`
        : "Failed to extract text from PDF"
    );
  }
};
