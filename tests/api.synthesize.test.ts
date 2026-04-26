import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/synthesize/route";
import { demoBrief } from "@/tests/fixtures";

describe("POST /api/synthesize", () => {
  it("returns 413 when the request body is too large", async () => {
    const response = await POST(
      new Request("http://localhost/api/synthesize", {
        method: "POST",
        body: JSON.stringify({
          niche: "speed cubing",
          groundedData: demoBrief.groundedData,
          padding: "x".repeat(140000),
        }),
      }),
    );

    const json = (await response.json()) as {
      status: string;
      fallbackNote?: string;
    };

    expect(response.status).toBe(413);
    expect(json.status).toBe("failed");
    expect(json.fallbackNote).toContain("too large");
  });
});
