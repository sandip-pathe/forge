import { z } from "zod";

import {
  isAbortError,
  jsonFailure,
  jsonResponse,
  parseRequestJson,
} from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { pickProviderFromNiche, runWebResearch } from "@/lib/web-search";
import { webSignalEnvelopeSchema } from "@/types/brief";

const requestSchema = z.object({
  niche: z.string().min(2),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const rateLimit = await enforceRateLimit(request, {
    route: "api/research/web",
    windowSeconds: 60,
    maxRequests: 2,
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
    const result = await runWebResearch(niche);
    const validated = webSignalEnvelopeSchema.safeParse(result);

    if (!validated.success) {
      return jsonFailure(
        "Web signal validation failed",
        500,
        validated.error.message,
      );
    }

    return jsonResponse(validated.data);
  } catch (error) {
    if (isAbortError(error)) {
      const providerUsed = pickProviderFromNiche(niche);
      return jsonResponse({
        status: "partial",
        providerUsed,
        results: [],
        fallbackNote:
          "Web providers timed out after 10 seconds. Continuing with available sources.",
      });
    }

    return jsonFailure(
      "Web research failed",
      500,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
