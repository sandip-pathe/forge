import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  AppResult,
  BriefSectionId,
  GroundedData,
  RedditSignal,
  WebSignal,
} from "@/types/brief";

let cachedSystemPrompt: string | null = null;

function extractSystemPrompt(markdown: string): string {
  const marker = "## The System Prompt";
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("System prompt marker not found in synthesize-prompt.md");
  }

  const afterMarker = markdown.slice(markerIndex + marker.length);
  const openFence = afterMarker.indexOf("```\n");
  if (openFence === -1) {
    throw new Error("Opening code fence for system prompt not found");
  }

  const remaining = afterMarker.slice(openFence + 4);
  const closeFence = remaining.indexOf("\n```");
  if (closeFence === -1) {
    throw new Error("Closing code fence for system prompt not found");
  }

  return remaining.slice(0, closeFence).trim();
}

export async function getSynthesisSystemPrompt(): Promise<string> {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  const promptPath = path.join(
    process.cwd(),
    "_workspace",
    "synthesize-prompt.md",
  );
  const markdown = await readFile(promptPath, "utf8");
  cachedSystemPrompt = extractSystemPrompt(markdown);
  return cachedSystemPrompt;
}

export function buildUserPrompt(
  niche: string,
  groundedData: GroundedData,
  founderContext?: string,
  targetSection?: BriefSectionId,
): string {
  const sections: string[] = [];

  sections.push(`NICHE COMMUNITY: ${niche}`);

  if (
    groundedData.reddit.status === "not_found" ||
    groundedData.reddit.status === "failed"
  ) {
    sections.push(
      `REDDIT DATA: Not found. ${groundedData.reddit.fallbackNote}`,
    );
  } else {
    const r = groundedData.reddit as RedditSignal;
    sections.push(
      `REDDIT DATA:\nSubreddit: r/${r.subredditName}\nSubscribers: ${r.subscriberCount.toLocaleString()}\nTop post titles from the past year (with upvote scores):\n${r.topPosts
        .map((p) => `- "${p.title}" (${p.score} upvotes)`)
        .join("\\n")}\nCommon flairs: ${r.topFlairs.join(", ") || "none"}\n`,
    );
  }

  if (
    groundedData.appstore.status === "success" ||
    groundedData.appstore.status === "partial"
  ) {
    const apps = groundedData.appstore.results as AppResult[];
    if (apps.length === 0) {
      sections.push("APP STORE DATA: No relevant apps found for this niche.");
    } else {
      sections.push(
        `APP STORE DATA:\n${apps
          .map(
            (a) =>
              `- ${a.name} | Rating: ${a.rating ?? "N/A"} | Reviews: ${a.reviewCount ?? "N/A"} | Last updated: ${a.lastUpdated ?? "unknown"} | By: ${a.sellerName}`,
          )
          .join("\\n")}\n`,
      );
    }
  } else {
    sections.push("APP STORE DATA: No relevant apps found for this niche.");
  }

  if (!("providerUsed" in groundedData.web)) {
    sections.push(
      `WEB SEARCH DATA: Unavailable. Providers tried: ${groundedData.web.providersTried.join(", ")}. ${groundedData.web.fallbackNote ?? ""}`.trim(),
    );
  } else {
    const providerNote = groundedData.web.fallbackProviderUsed
      ? `Primary provider: ${groundedData.web.providerUsed}; fallback used: ${groundedData.web.fallbackProviderUsed}.`
      : `Provider used: ${groundedData.web.providerUsed}.`;

    const partialNote =
      groundedData.web.status === "partial"
        ? ` Partial result: ${groundedData.web.fallbackNote ?? "limited web coverage."}`
        : "";

    const results = groundedData.web.results as WebSignal[];

    sections.push(
      `WEB SEARCH DATA: ${providerNote}${partialNote}\n${results
        .slice(0, 10)
        .map((r) => `- ${r.title}\\n  ${r.url}\\n  ${r.snippet}`)
        .join("\\n\\n")}\n`,
    );
  }

  if (founderContext && founderContext.trim().length > 0) {
    sections.push(`FOUNDER CONTEXT: ${founderContext.trim()}`);
  } else {
    sections.push("FOUNDER CONTEXT: None provided.");
  }

  sections.push(
    `SOURCE AVAILABILITY SUMMARY: reddit=${groundedData.reddit.status}; appstore=${groundedData.appstore.status}; web=${groundedData.web.status}. When a source is missing or partial, explicitly say so in affected sections. Do not hallucinate replacement data.`,
  );

  if (targetSection) {
    sections.push(
      `OUTPUT MODE: Retry mode. Return ONLY one JSON line envelope for section \"${targetSection}\" and no additional prose.`,
    );
  }

  sections.push(
    targetSection
      ? `Using only the data above, produce section ${targetSection} and nothing else. Remember: no invented numbers, no generic language, no apps or communities that do not appear in this data.`
      : "Using only the data above, produce the seven-section Community Opportunity Brief as specified. Remember: no invented numbers, no generic language, no apps or communities that do not appear in this data.",
  );

  return sections.join("\n\n");
}
