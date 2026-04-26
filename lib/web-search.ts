import { URL } from "node:url";

import type { WebProvider, WebSignal } from "@/types/brief";
import { providerSchema, webSignalSchema } from "@/types/brief";

import { fetchWithTimeout } from "@/lib/api";

type ProviderRunResult = {
  ok: boolean;
  results: WebSignal[];
  error?: string;
};

const SERPER_URL = "https://google.serper.dev/search";
const TAVILY_URL = "https://api.tavily.com/search";

function domainOf(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function dedupeByDomain(results: WebSignal[]): WebSignal[] {
  const seen = new Set<string>();
  const out: WebSignal[] = [];

  for (const result of results) {
    const domain = result.domain ?? domainOf(result.url);
    if (!domain) {
      continue;
    }

    if (seen.has(domain)) {
      continue;
    }

    seen.add(domain);
    out.push({ ...result, domain });
  }

  return out;
}

function hashNiche(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickProviderFromNiche(niche: string): WebProvider {
  return hashNiche(niche) % 2 === 0 ? "serper" : "tavily";
}

async function runSerperQuery(
  query: string,
  apiKey: string,
): Promise<WebSignal[]> {
  const response = await fetchWithTimeout(
    SERPER_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: 10 }),
    },
    10000,
  );

  if (!response.ok) {
    throw new Error(`Serper request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
  };

  const mapped = (data.organic ?? [])
    .map((item) => ({
      title: item.title ?? "",
      url: item.link ?? "",
      snippet: item.snippet ?? "",
      domain: item.link ? (domainOf(item.link) ?? undefined) : undefined,
    }))
    .filter((item) => item.title && item.url && item.snippet);

  return mapped
    .map((item) => webSignalSchema.safeParse(item))
    .filter((item) => item.success)
    .map((item) => item.data);
}

async function runTavilyQuery(
  query: string,
  apiKey: string,
): Promise<WebSignal[]> {
  const response = await fetchWithTimeout(
    TAVILY_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 10,
        search_depth: "basic",
      }),
    },
    10000,
  );

  if (!response.ok) {
    throw new Error(`Tavily request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  const mapped = (data.results ?? [])
    .map((item) => ({
      title: item.title ?? "",
      url: item.url ?? "",
      snippet: item.content ?? "",
      domain: item.url ? (domainOf(item.url) ?? undefined) : undefined,
    }))
    .filter((item) => item.title && item.url && item.snippet);

  return mapped
    .map((item) => webSignalSchema.safeParse(item))
    .filter((item) => item.success)
    .map((item) => item.data);
}

async function runProvider(
  provider: WebProvider,
  niche: string,
  queries: [string, string],
): Promise<ProviderRunResult> {
  const key =
    provider === "serper"
      ? process.env.SERPER_API_KEY
      : process.env.TAVILY_API_KEY;

  if (!key) {
    return {
      ok: false,
      results: [],
      error: `${provider.toUpperCase()} API key is missing`,
    };
  }

  try {
    const runQuery = provider === "serper" ? runSerperQuery : runTavilyQuery;
    const [first, second] = await Promise.all([
      runQuery(queries[0], key),
      runQuery(queries[1], key),
    ]);

    const merged = dedupeByDomain([...first, ...second]).slice(0, 10);
    const weak = merged.length < 3;

    return {
      ok: !weak,
      results: merged,
      error: weak ? `${provider} returned weak results` : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      results: [],
      error:
        error instanceof Error ? error.message : `Unknown ${provider} error`,
    };
  }
}

export type WebResearchResponse =
  | {
      status: "success" | "partial";
      providerUsed: WebProvider;
      fallbackProviderUsed?: WebProvider;
      results: WebSignal[];
      fallbackNote?: string;
    }
  | {
      status: "failed";
      providersTried: WebProvider[];
      fallbackNote: string;
      results?: WebSignal[];
    };

export async function runWebResearch(
  niche: string,
): Promise<WebResearchResponse> {
  const parsedProvider = providerSchema.safeParse(pickProviderFromNiche(niche));
  const primaryProvider: WebProvider = parsedProvider.success
    ? parsedProvider.data
    : "serper";
  const secondaryProvider: WebProvider =
    primaryProvider === "serper" ? "tavily" : "serper";

  const queries: [string, string] = [
    `${niche} app tool software`,
    `is there an app for ${niche} forum reddit`,
  ];

  const primary = await runProvider(primaryProvider, niche, queries);
  if (primary.ok) {
    return {
      status: "success",
      providerUsed: primaryProvider,
      results: primary.results,
    };
  }

  const secondary = await runProvider(secondaryProvider, niche, queries);
  if (secondary.ok) {
    return {
      status: "partial",
      providerUsed: primaryProvider,
      fallbackProviderUsed: secondaryProvider,
      results: secondary.results,
      fallbackNote: `Primary provider ${primaryProvider} failed: ${primary.error ?? "unknown error"}`,
    };
  }

  return {
    status: "failed",
    providersTried: [primaryProvider, secondaryProvider],
    fallbackNote: `Both providers failed. ${primaryProvider}: ${primary.error ?? "unknown"}. ${secondaryProvider}: ${secondary.error ?? "unknown"}.`,
  };
}
