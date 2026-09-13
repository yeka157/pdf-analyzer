import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes while preserving conditional classes", () => {
    expect(cn("px-2 text-sm", false, "px-4", "font-medium")).toBe(
      "text-sm px-4 font-medium"
    );
  });
});
