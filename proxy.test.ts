import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "./proxy";

const doesProxyMatch = (url: string) =>
  unstable_doesMiddlewareMatch({ config, nextConfig: {}, url });

describe("Clerk proxy matcher", () => {
  it("excludes only the Supabase keepalive API route", () => {
    expect(
      doesProxyMatch("https://digest.example/api/cron/supabase-keepalive")
    ).toBe(false);
    expect(doesProxyMatch("https://digest.example/api/analyze")).toBe(true);
    expect(doesProxyMatch("https://digest.example/dashboard")).toBe(true);
  });
});
