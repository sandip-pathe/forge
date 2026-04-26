import { kv } from "@vercel/kv";

import { jsonFailure, jsonResponse } from "@/lib/api";
import { nicheBriefSchema } from "@/types/brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;

  if (!id) {
    return jsonResponse(
      {
        status: "failed",
        fallbackNote: "Brief ID is required",
      },
      400,
    );
  }

  try {
    const brief = await kv.get(`brief:${id}`);

    if (!brief) {
      return jsonResponse(
        {
          status: "failed",
          fallbackNote: "Brief not found",
        },
        404,
      );
    }

    const validated = nicheBriefSchema.safeParse(brief);
    if (!validated.success) {
      return jsonFailure(
        "Stored brief is invalid",
        500,
        validated.error.message,
      );
    }

    return jsonResponse({
      status: "success",
      brief: validated.data,
    });
  } catch (error) {
    return jsonFailure(
      "Failed to fetch brief",
      500,
      error instanceof Error ? error.message : "Unknown KV error",
    );
  }
}
