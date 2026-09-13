import { afterEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: queryRaw },
}));

describe("GET /api/cron/supabase-keepalive", () => {
  afterEach(() => {
    queryRaw.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects requests when the cron secret is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const responsePromise = import("./route").then(({ GET }) =>
      GET(
        new Request("http://localhost/api/cron/supabase-keepalive", {
          headers: { authorization: "Bearer undefined" },
        })
      )
    );

    await expect(responsePromise).resolves.toMatchObject({ status: 401 });
  });

  it("rejects requests with the wrong cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "expected-secret");
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/cron/supabase-keepalive", {
        headers: { authorization: "Bearer wrong-secret" },
      })
    );

    expect(response.status).toBe(401);
  });

  it("runs a database probe for an authorized cron request", async () => {
    vi.stubEnv("CRON_SECRET", "expected-secret");
    queryRaw.mockResolvedValueOnce([{ connected: 1 }]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/cron/supabase-keepalive", {
        headers: { authorization: "Bearer expected-secret" },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns a server error when the database probe fails", async () => {
    vi.stubEnv("CRON_SECRET", "expected-secret");
    queryRaw.mockRejectedValueOnce(new Error("Database unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { GET } = await import("./route");

    const responsePromise = GET(
      new Request("http://localhost/api/cron/supabase-keepalive", {
        headers: { authorization: "Bearer expected-secret" },
      })
    );

    await expect(responsePromise).resolves.toMatchObject({ status: 500 });
    const response = await responsePromise;
    await expect(response.json()).resolves.toEqual({ ok: false });
  });
});
