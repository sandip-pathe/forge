import { z } from "zod";

export function jsonResponse<T>(payload: T, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function jsonFailure(
  fallbackNote: string,
  status = 500,
  error?: string,
): Response {
  return jsonResponse(
    {
      status: "failed",
      fallbackNote,
      error,
    },
    status,
  );
}

export async function parseRequestJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
  options?: {
    maxBytes?: number;
  },
): Promise<
  | { success: true; data: z.infer<TSchema> }
  | { success: false; response: Response }
> {
  try {
    const bodyText = await request.text();
    if (options?.maxBytes !== undefined && bodyText.length > options.maxBytes) {
      return {
        success: false,
        response: jsonResponse(
          {
            status: "failed",
            fallbackNote: "Request body is too large",
          },
          413,
        ),
      };
    }

    const body = bodyText ? JSON.parse(bodyText) : null;
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        success: false,
        response: jsonResponse(
          {
            status: "failed",
            fallbackNote: "Invalid request body",
            issues: parsed.error.issues,
          },
          400,
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      response: jsonResponse(
        {
          status: "failed",
          fallbackNote: "Request body must be valid JSON",
        },
        400,
      ),
    };
  }
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError")
  );
}
