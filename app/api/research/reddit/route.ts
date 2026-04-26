import { z } from "zod";

import {
  fetchWithTimeout,
  isAbortError,
  jsonFailure,
  jsonResponse,
  parseRequestJson,
} from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { redditSignalSchema } from "@/types/brief";

const requestSchema = z.object({
  niche: z.string().min(2),
  subreddit: z.string().min(1).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redditHeaders(): HeadersInit {
  const userAgent =
    process.env.REDDIT_USER_AGENT?.trim() ||
    "web:niche-finder:v1.0 (by /u/niche_finder_app)";

  return {
    "User-Agent": userAgent,
    Accept: "application/json",
  };
}

function normalizeSubreddit(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value
    .trim()
    .replace(/^\/?r\//i, "")
    .replace(/\s+/g, "");
  return normalized.length > 0 ? normalized : undefined;
}

type RedditSearchResponse = {
  data?: {
    children?: Array<{
      data?: {
        display_name?: string;
        subscribers?: number;
      };
    }>;
  };
};

type RedditAboutResponse = {
  data?: {
    subscribers?: number;
  };
};

type RedditTopResponse = {
  data?: {
    children?: Array<{
      data?: {
        title?: string;
        score?: number;
        link_flair_text?: string | null;
      };
    }>;
  };
};

function isAccessDeniedStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 429;
}

export async function POST(request: Request): Promise<Response> {
  const rateLimit = await enforceRateLimit(request, {
    route: "api/research/reddit",
    windowSeconds: 60,
    maxRequests: 5,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const parsed = await parseRequestJson(request, requestSchema, {
    maxBytes: 4096,
  });
  if (!parsed.success) {
    return parsed.response;
  }

  const { niche, subreddit: rawSubreddit } = parsed.data;
  const subredditHint = normalizeSubreddit(rawSubreddit);

  try {
    let subreddit = subredditHint;

    if (!subreddit) {
      const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(niche)}&type=sr&limit=3`;
      const searchRes = await fetchWithTimeout(
        searchUrl,
        { headers: redditHeaders() },
        10000,
      );

      if (!searchRes.ok) {
        if (isAccessDeniedStatus(searchRes.status)) {
          return jsonResponse({
            status: "not_found",
            fallbackNote:
              "Reddit blocked server-side access for this request. Continuing with App Store and Web signals.",
          });
        }

        return jsonFailure(
          "Reddit search failed",
          502,
          `status ${searchRes.status}`,
        );
      }

      const searchData = (await searchRes.json()) as RedditSearchResponse;
      subreddit = searchData.data?.children?.[0]?.data?.display_name;
    }

    if (!subreddit) {
      return jsonResponse({
        status: "not_found",
        fallbackNote: "No close subreddit match found for this niche.",
      });
    }

    const aboutUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/about.json`;
    const topUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/top.json?t=year&limit=25`;

    const [aboutRes, topRes] = await Promise.all([
      fetchWithTimeout(aboutUrl, { headers: redditHeaders() }, 10000),
      fetchWithTimeout(topUrl, { headers: redditHeaders() }, 10000),
    ]);

    if ((aboutRes.status === 404 || topRes.status === 404) && subredditHint) {
      return jsonResponse({
        status: "not_found",
        fallbackNote: `Subreddit r/${subredditHint} was not found.`,
      });
    }

    if (!aboutRes.ok || !topRes.ok) {
      if (
        isAccessDeniedStatus(aboutRes.status) ||
        isAccessDeniedStatus(topRes.status)
      ) {
        return jsonResponse(
          {
            status: "partial",
            fallbackNote:
              "Reddit blocked detailed subreddit endpoints for this deployment environment.",
            subredditName: subreddit,
            subscriberCount: 0,
            topPosts: [],
            topFlairs: [],
          },
          200,
        );
      }

      return jsonResponse(
        {
          status: "partial",
          fallbackNote:
            "Subreddit found but full Reddit details were unavailable.",
          subredditName: subreddit,
          subscriberCount: 0,
          topPosts: [],
          topFlairs: [],
        },
        200,
      );
    }

    const aboutData = (await aboutRes.json()) as RedditAboutResponse;
    const topData = (await topRes.json()) as RedditTopResponse;

    const posts = (topData.data?.children ?? [])
      .map((child) => ({
        title: child.data?.title ?? "",
        score: child.data?.score ?? 0,
        flair: child.data?.link_flair_text ?? null,
      }))
      .filter((p) => p.title.length > 0)
      .slice(0, 25);

    const flairCounts = new Map<string, number>();
    for (const post of posts) {
      const flair = post.flair?.trim();
      if (!flair) continue;
      flairCounts.set(flair, (flairCounts.get(flair) ?? 0) + 1);
    }

    const topFlairs = [...flairCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([flair]) => flair);

    const payload = {
      status: "success",
      subredditName: subreddit,
      subscriberCount: aboutData.data?.subscribers ?? 0,
      topPosts: posts,
      topFlairs,
    } as const;

    const validated = redditSignalSchema.safeParse(payload);
    if (!validated.success) {
      return jsonFailure(
        "Reddit response validation failed",
        500,
        validated.error.message,
      );
    }

    return jsonResponse(validated.data);
  } catch (error) {
    if (isAbortError(error)) {
      return jsonResponse({
        status: "partial",
        subredditName: "unavailable",
        subscriberCount: 0,
        topPosts: [],
        topFlairs: [],
        fallbackNote:
          "Reddit timed out after 10 seconds. Continuing with remaining sources.",
      });
    }

    return jsonFailure(
      "Reddit signals unavailable",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
