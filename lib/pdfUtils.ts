import { PDF_PROCESSING } from "./constants";
import type { TextContent } from "pdfjs-dist/types/src/display/api";

let workerConfigured = false;

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

export const extractTextFromPDF = async (file: File): Promise<string> => {
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
    let text = "";
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

    text = pageTexts.join("\n");

    return text;
  } catch (error) {
    console.error("PDF Extraction Failed", error);
    throw new Error(
      error instanceof Error
        ? `Failed to extract text from PDF: ${error.message}`
        : "Failed to extract text from PDF"
    );
  }
};
