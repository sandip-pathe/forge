import { z } from "zod";

import {
  fetchWithTimeout,
  isAbortError,
  jsonFailure,
  jsonResponse,
  parseRequestJson,
} from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { appStoreSignalSchema } from "@/types/brief";

const requestSchema = z.object({
  niche: z.string().min(2),
});

const ITUNES_URL = "https://itunes.apple.com/search";

type ItunesResult = {
  trackId?: number;
  trackName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  currentVersionReleaseDate?: string;
  sellerName?: string;
  description?: string;
  trackViewUrl?: string;
};

type ItunesResponse = {
  results?: ItunesResult[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const rateLimit = await enforceRateLimit(request, {
    route: "api/research/appstore",
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

  const { niche } = parsed.data;

  try {
    const url = `${ITUNES_URL}?term=${encodeURIComponent(niche)}&entity=software&limit=5`;
    const response = await fetchWithTimeout(url, {}, 10000);

    if (!response.ok) {
      return jsonFailure(
        "App Store lookup failed",
        502,
        `status ${response.status}`,
      );
    }

    const data = (await response.json()) as ItunesResponse;
    const mapped = (data.results ?? [])
      .slice(0, 5)
      .map((item) => ({
        id: item.trackId ? String(item.trackId) : undefined,
        name: item.trackName ?? "",
        rating:
          typeof item.averageUserRating === "number"
            ? item.averageUserRating
            : null,
        reviewCount:
          typeof item.userRatingCount === "number"
            ? item.userRatingCount
            : null,
        lastUpdated: item.currentVersionReleaseDate ?? null,
        sellerName: item.sellerName ?? "Unknown seller",
        description: item.description ?? "No description available.",
        url: item.trackViewUrl,
      }))
      .filter((app) => app.name.length > 0);

    if (mapped.length === 0) {
      return jsonResponse({
        status: "not_found",
        results: [],
        fallbackNote: "No relevant App Store apps found for this niche.",
      });
    }

    const payload = {
      status: "success",
      results: mapped,
    } as const;

    const validated = appStoreSignalSchema.safeParse(payload);
    if (!validated.success) {
      return jsonFailure(
        "App Store response validation failed",
        500,
        validated.error.message,
      );
    }

    return jsonResponse(validated.data);
  } catch (error) {
    if (isAbortError(error)) {
      return jsonResponse({
        status: "partial",
        results: [],
        fallbackNote:
          "App Store timed out after 10 seconds. Continuing with remaining sources.",
      });
    }

    return jsonFailure(
      "App Store signals unavailable",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
