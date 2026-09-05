import { checkAuthenticationAndSubscription } from "@/lib/checkAuthSubscription";
import { API, PDF_PROCESSING } from "@/lib/constants";
import { ApiError, handleApiError } from "@/lib/errors";
import { rateLimiter } from "@/lib/rateLimiters";
import { NextRequest, NextResponse } from "next/server";

export type KeyTerm = { label: string; value: string };

export type AnalyzeResponse = {
  summary: string[];
  keyTerms: KeyTerm[];
};

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
  type: "OBJECT",
  properties: {
    summary: {
      type: "ARRAY",
      description: "Two to four paragraphs of plain prose.",
      items: { type: "STRING" },
    },
    keyTerms: {
      type: "ARRAY",
      description: "Up to four label/value pairs.",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          value: { type: "STRING" },
        },
        required: ["label", "value"],
      },
    },
  },
  required: ["summary", "keyTerms"],
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

    const processedText = text.substring(0, PDF_PROCESSING.MAX_TEXT_LENGTH);

    const response = await fetch(
      `${API.GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: request.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${PROMPT}${processedText}` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
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
    } catch {
      throw new ApiError(500, "Invalid response from AI service");
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

    return NextResponse.json({ summary, keyTerms } satisfies AnalyzeResponse);
  } catch (error) {
    return handleApiError(error);
  }
}
