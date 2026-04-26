import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/research/reddit/route";

describe("POST /api/research/reddit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns RedditSignal for successful lookup", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              children: [{ data: { display_name: "Cubers" } }],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { subscribers: 12345 } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              children: [
                {
                  data: {
                    title: "Post A",
                    score: 100,
                    link_flair_text: "help",
                  },
                },
                {
                  data: { title: "Post B", score: 50, link_flair_text: "help" },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/research/reddit", {
        method: "POST",
        body: JSON.stringify({ niche: "speed cubing" }),
      }),
    );

    const json = (await response.json()) as {
      status: string;
      subredditName: string;
      subscriberCount: number;
      topPosts: unknown[];
      topFlairs: string[];
    };

    expect(response.status).toBe(200);
    expect(json.status).toBe("success");
    expect(json.subredditName).toBe("Cubers");
    expect(json.subscriberCount).toBe(12345);
    expect(json.topPosts.length).toBeGreaterThan(0);
    expect(json.topFlairs[0]).toBe("help");
  });

  it("returns not_found with fallbackNote when subreddit is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            children: [],
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/research/reddit", {
        method: "POST",
        body: JSON.stringify({ niche: "unknown niche" }),
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
