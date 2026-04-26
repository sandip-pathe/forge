import { nanoid } from "nanoid";
import { createClient } from "@vercel/kv";
import { z } from "zod";

import { jsonFailure, jsonResponse, parseRequestJson } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { nicheBriefSchema } from "@/types/brief";

const incomingBriefSchema = nicheBriefSchema.extend({
  id: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const rateLimit = await enforceRateLimit(request, {
    route: "api/brief/save",
    windowSeconds: 60,
    maxRequests: 10,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const kvUrl =
    process.env.KV_REST_API_URL?.trim() ??
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const kvToken =
    process.env.KV_REST_API_TOKEN?.trim() ??
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!kvUrl || !kvToken) {
    return jsonFailure(
      "KV is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) in .env.local.",
      503,
      "Missing KV credentials",
    );
  }

  const kv = createClient({
    url: kvUrl,
    token: kvToken,
  });

  const parsed = await parseRequestJson(request, incomingBriefSchema, {
    maxBytes: 262144,
  });
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const id = nanoid(10);
    const brief = {
      ...parsed.data,
      id,
    };

    const validated = nicheBriefSchema.safeParse(brief);
    if (!validated.success) {
      return jsonFailure(
        "Brief validation failed",
        400,
        validated.error.message,
      );
    }

    await kv.set(`brief:${id}`, validated.data);

    return jsonResponse({
      status: "success",
      id,
    });
  } catch (error) {
    return jsonFailure(
      "Failed to save brief",
      500,
      error instanceof Error ? error.message : "Unknown KV error",
    );
  }
}
