import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, limiterMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  limiterMock: {
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock("@vercel/kv", () => ({
  createClient: createClientMock,
}));

import { enforceRateLimit } from "@/lib/rate-limit";

describe("enforceRateLimit", () => {
  beforeEach(() => {
    createClientMock.mockReturnValue(limiterMock);
    limiterMock.incr.mockReset();
    limiterMock.expire.mockReset();
    process.env.KV_REST_API_URL = "https://example.com";
    process.env.KV_REST_API_TOKEN = "token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("allows the first request and blocks requests over the limit", async () => {
    limiterMock.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    limiterMock.expire.mockResolvedValue(undefined);

    const first = await enforceRateLimit(
      new Request("http://localhost/api/research/reddit", {
        headers: { "x-forwarded-for": "203.0.113.10" },
      }),
      { route: "api/research/reddit", windowSeconds: 60, maxRequests: 1 },
    );

    const second = await enforceRateLimit(
      new Request("http://localhost/api/research/reddit", {
        headers: { "x-forwarded-for": "203.0.113.10" },
      }),
      { route: "api/research/reddit", windowSeconds: 60, maxRequests: 1 },
    );

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    if (!second.allowed) {
      expect(second.response.status).toBe(429);
      expect(second.response.headers.get("Retry-After")).toBe("60");
    }
    expect(limiterMock.incr).toHaveBeenCalledTimes(2);
    expect(limiterMock.expire).toHaveBeenCalledTimes(1);
  });
});
