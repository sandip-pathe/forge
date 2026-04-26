import { afterEach, describe, expect, it, vi } from "vitest";

import { useBriefStore } from "@/store/useBriefStore";
import { briefSectionIds, type GroundedData } from "@/types/brief";
import { demoBrief } from "@/tests/fixtures";

async function runPipelineWithMocks(niche: string) {
  const store = useBriefStore.getState();
  store.resetBriefDraft();
  store.setNicheContext({ niche });

  const reddit = (await fetch("/api/research/reddit", {
    method: "POST",
    body: JSON.stringify({ niche }),
  }).then((r) => r.json())) as GroundedData["reddit"];

  const appstore = (await fetch("/api/research/appstore", {
    method: "POST",
    body: JSON.stringify({ niche }),
  }).then((r) => r.json())) as GroundedData["appstore"];

  const web = (await fetch("/api/research/web", {
    method: "POST",
    body: JSON.stringify({ niche }),
  }).then((r) => r.json())) as GroundedData["web"];

  const groundedData: GroundedData = { reddit, appstore, web };
  store.setGroundedData(groundedData);

  const synthResponse = await fetch("/api/synthesize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ niche, groundedData }),
  });

  const text = await synthResponse.text();
  const lines = text.split("\n").filter(Boolean);
  for (const line of lines) {
    const parsed = JSON.parse(line) as {
      section: (typeof briefSectionIds)[number];
      data: unknown;
    };
    store.setSectionData(parsed.section, parsed.data as never);
  }
}

describe("pipeline integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("populates all seven sections from mocked pipeline", async () => {
    const linePayload = briefSectionIds
      .map((id) =>
        JSON.stringify({ section: id, data: demoBrief.sections[id] }),
      )
      .join("\n");

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/research/reddit")) {
        return new Response(JSON.stringify(demoBrief.groundedData.reddit), {
          status: 200,
        });
      }
      if (url.includes("/api/research/appstore")) {
        return new Response(JSON.stringify(demoBrief.groundedData.appstore), {
          status: 200,
        });
      }
      if (url.includes("/api/research/web")) {
        return new Response(JSON.stringify(demoBrief.groundedData.web), {
          status: 200,
        });
      }
      if (url.includes("/api/synthesize")) {
        return new Response(`${linePayload}\n`, { status: 200 });
      }
      return new Response("{}", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    await runPipelineWithMocks("competitive Rubik's cube solvers");

    const finalSections = useBriefStore.getState().briefDraft.sections;
    const allPresent = briefSectionIds.every((id) =>
      Boolean(finalSections[id]),
    );
    expect(allPresent).toBe(true);
  });
});
