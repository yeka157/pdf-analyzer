import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, handleApiError } from "./errors";

describe("handleApiError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("preserves the status and details from an API error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = handleApiError(
      new ApiError(429, "Try again later", { retryAfter: 60 })
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Try again later",
      details: { retryAfter: 60 },
    });
  });

  it("turns an unexpected error into a generic server error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = handleApiError(new Error("Gemini unavailable"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Gemini unavailable",
    });
  });
});
