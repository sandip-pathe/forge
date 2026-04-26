import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/research/appstore/route";

describe("POST /api/research/appstore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns top 5 app results", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              trackId: 1,
              trackName: "App 1",
              averageUserRating: 4.4,
              userRatingCount: 123,
              currentVersionReleaseDate: "2025-01-01",
              sellerName: "Seller",
              description: "Desc",
              trackViewUrl: "https://apps.apple.com/us/app/app-1/id1",
            },
            {
              trackId: 2,
              trackName: "App 2",
              averageUserRating: 4.1,
              userRatingCount: 22,
              currentVersionReleaseDate: "2025-02-01",
              sellerName: "Seller 2",
              description: "Desc 2",
              trackViewUrl: "https://apps.apple.com/us/app/app-2/id2",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/research/appstore", {
        method: "POST",
        body: JSON.stringify({ niche: "speedcubing" }),
      }),
    );

    const json = (await response.json()) as {
      status: string;
      results: Array<{ name: string }>;
    };

    expect(response.status).toBe(200);
    expect(json.status).toBe("success");
    expect(json.results.length).toBe(2);
    expect(json.results[0].name).toBe("App 1");
  });

  it("returns not_found when no results exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ results: [] }), { status: 200 }),
        ),
    );

    const response = await POST(
      new Request("http://localhost/api/research/appstore", {
        method: "POST",
        body: JSON.stringify({ niche: "unknown" }),
      }),
    );

    const json = (await response.json()) as {
      status: string;
      fallbackNote?: string;
    };

    expect(response.status).toBe(200);
    expect(json.status).toBe("not_found");
    expect(json.fallbackNote).toBeTruthy();
  });
});
