export const PDF_PROCESSING = {
  MAX_TEXT_LENGTH: 10000,
  WORKER_SRC:
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs",
};

export const API = {
  GEMINI_ENDPOINT:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
};

export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 5,
  CACHE_MAX_SIZE: 1000,
  CACHE_TTL_MS: 60 * 1000,
};
