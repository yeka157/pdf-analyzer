import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import { PDF_PROCESSING } from "./constants";
import { TextContent } from "pdfjs-dist/types/src/display/api";

if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = PDF_PROCESSING.WORKER_SRC;
  console.log("PDF Version", version);
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
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
