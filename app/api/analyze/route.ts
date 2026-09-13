import { type NextRequest, NextResponse } from "next/server";
import { checkAuthenticationAndSubscription } from "@/lib/check-auth-subscription";
import { API, PDF_PROCESSING } from "@/lib/constants";
import { ApiError, handleApiError } from "@/lib/errors";
import { rateLimiter } from "@/lib/rate-limiters";

export interface KeyTerm {
  label: string;
  value: string;
}

export interface AnalyzeResponse {
  keyTerms: KeyTerm[];
  summary: string[];
}

const PROMPT = `Summarise this document for someone who will not read it.

Write two to four short paragraphs of plain prose. No headings, no bullet
points, no markdown, no preamble — start with the substance. Keep the tone
factual and concrete: what the document is, what it says, and what follows from
it. Prefer specifics (dates, amounts, obligations, findings) over description of
the document itself.

Then pull out up to four key terms: the concrete values a reader would want at a
glance — durations, amounts, deadlines, rates, named parties. Each label is one
or two words; each value is a short fragment, not a sentence. If the document
has fewer than four such values, return only the ones it actually has.

Document content:
`;

/**
 * Asking Gemini for JSON against a schema, rather than parsing headings back
 * out of prose, is what makes the key-terms grid real data instead of a
 * decoration. The summary comes back pre-split into paragraphs for the same
 * reason.
 */
const RESPONSE_SCHEMA = {
  properties: {
    keyTerms: {
      description: "Up to four label/value pairs.",
      items: {
        properties: {
          label: { type: "STRING" },
          value: { type: "STRING" },
        },
        required: ["label", "value"],
        type: "OBJECT",
      },
      type: "ARRAY",
    },
    summary: {
      description: "Two to four paragraphs of plain prose.",
      items: { type: "STRING" },
      type: "ARRAY",
    },
  },
  required: ["summary", "keyTerms"],
  type: "OBJECT",
};

export async function POST(request: NextRequest) {
  try {
    await rateLimiter(request);

    // Gate the endpoint itself, not just the dashboard page that calls it —
    // otherwise anyone can POST here and consume the AI quota.
    const authCheck = await checkAuthenticationAndSubscription();

    if (!authCheck.isAuthenticated) {
      throw new ApiError(401, "Authentication required");
    }

    if (!authCheck.hasSubscription) {
      throw new ApiError(403, "An active subscription is required");
    }

    const body = await request.json().catch(() => ({}));

    const { text } = body;

    if (!text || typeof text !== "string") {
      throw new ApiError(
        400,
        "Invalid input: text is required and must be a string"
      );
    }

    if (text.length === 0) {
      throw new ApiError(400, "Invalid input: text cannot be empty");
    }

    const processedText = text.slice(0, PDF_PROCESSING.MAX_TEXT_LENGTH);

    const response = await fetch(
      `${API.GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${PROMPT}${processedText}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.4,
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: request.signal,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new ApiError(
        response.status,
        errorData.error?.message ||
          `Failed to analyze document: ${response.statusText}`,
        errorData
      );
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      throw new ApiError(500, "Invalid response from AI service");
    }

    let parsed: Partial<AnalyzeResponse>;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error("Invalid response from AI service", { cause: error });
    }

    const summary = Array.isArray(parsed.summary)
      ? parsed.summary.filter(
          (paragraph): paragraph is string =>
            typeof paragraph === "string" && paragraph.trim() !== ""
        )
      : [];

    if (summary.length === 0) {
      throw new ApiError(500, "No summary was generated");
    }

    // The schema constrains the shape but not the count; the grid is a 4-up.
    const keyTerms = Array.isArray(parsed.keyTerms)
      ? parsed.keyTerms
          .filter(
            (term): term is KeyTerm =>
              !!term &&
              typeof term.label === "string" &&
              typeof term.value === "string" &&
              term.label.trim() !== "" &&
              term.value.trim() !== ""
          )
          .slice(0, 4)
      : [];

    return NextResponse.json({ keyTerms, summary } satisfies AnalyzeResponse);
  } catch (error) {
    return handleApiError(error);
  }
}
