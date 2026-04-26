import OpenAI from "openai";
import { z } from "zod";

import { jsonFailure, jsonResponse, parseRequestJson } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { buildUserPrompt, getSynthesisSystemPrompt } from "@/lib/synthesis";
import {
  briefSectionIds,
  groundedDataSchema,
  sectionEnvelopeSchema,
} from "@/types/brief";

const requestSchema = z.object({
  niche: z.string().min(2),
  groundedData: groundedDataSchema,
  founderContext: z.string().optional(),
  targetSection: z.enum(briefSectionIds).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const rateLimit = await enforceRateLimit(request, {
    route: "api/synthesize",
    windowSeconds: 10,
    maxRequests: 2,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse(
      {
        status: "failed",
        fallbackNote: "Missing server OpenAI API key. Set OPENAI_API_KEY.",
      },
      500,
    );
  }

  const parsed = await parseRequestJson(request, requestSchema, {
    maxBytes: 131072,
  });
  if (!parsed.success) {
    return parsed.response;
  }

  const { niche, groundedData, founderContext, targetSection } = parsed.data;

  try {
    const systemPrompt = await getSynthesisSystemPrompt();
    const userPrompt = buildUserPrompt(
      niche,
      groundedData,
      founderContext,
      targetSection,
    );

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = "";

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (!delta) {
            continue;
          }

          buffer += delta;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const parsedLine = JSON.parse(trimmed);
              const validated = sectionEnvelopeSchema.safeParse(parsedLine);
              if (validated.success) {
                controller.enqueue(
                  encoder.encode(`${JSON.stringify(validated.data)}\n`),
                );
              }
            } catch {
              continue;
            }
          }
        }

        const tail = buffer.trim();
        if (tail.length > 0) {
          try {
            const parsedTail = JSON.parse(tail);
            const validatedTail = sectionEnvelopeSchema.safeParse(parsedTail);
            if (validatedTail.success) {
              controller.enqueue(
                encoder.encode(`${JSON.stringify(validatedTail.data)}\n`),
              );
            }
          } catch {
            // Ignore malformed tail to preserve successful streamed sections.
          }
        }

        controller.close();
      },
      cancel() {
        // noop
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonFailure(
      "Synthesis failed",
      500,
      error instanceof Error ? error.message : "Unknown synthesis error",
    );
  }
}
