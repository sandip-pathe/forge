import { createClient } from "@vercel/kv";

type RateLimitConfig = {
  windowSeconds: number;
  maxRequests: number;
  route: string;
};

export type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      response: Response;
    };

function getClient() {
  const kvUrl =
    process.env.KV_REST_API_URL?.trim() ??
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const kvToken =
    process.env.KV_REST_API_TOKEN?.trim() ??
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!kvUrl || !kvToken) {
    return null;
  }

  return createClient({ url: kvUrl, token: kvToken });
}

function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function enforceRateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const kv = getClient();
  if (!kv) {
    return { allowed: true };
  }

  const ip = getRequestIp(request);
  const key = `rate-limit:${config.route}:${ip}`;

  try {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, config.windowSeconds);
    }

    if (count > config.maxRequests) {
      const retryAfter = String(config.windowSeconds);
      return {
        allowed: false,
        response: Response.json(
          {
            status: "failed",
            fallbackNote: "Rate limit exceeded. Please try again later.",
          },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": retryAfter,
            },
          },
        ),
      };
    }

    return { allowed: true };
  } catch {
    if (process.env.NODE_ENV !== "production") {
      return { allowed: true };
    }

    return {
      allowed: false,
      response: Response.json(
        {
          status: "failed",
          fallbackNote: "Rate limiting is temporarily unavailable.",
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      ),
    };
  }
}
