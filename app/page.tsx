"use client";

import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { HomeView } from "../components/home/home-view";
import { PipelineView } from "../components/home/pipeline-view";
import { createRubikDemoBrief } from "@/lib/demo-brief";
import { useBriefStore } from "@/store/useBriefStore";
import {
  briefSectionIds,
  nicheBriefSchema,
  sectionEnvelopeSchema,
  type BriefSectionId,
  type GroundedData,
} from "@/types/brief";

type ViewMode = "home" | "pipeline" | "brief";

const pipelineSteps = [
  { id: "reddit", label: "Step 1 · Reddit Signals" },
  { id: "appstore", label: "Step 2 · App Store Signals" },
  { id: "web", label: "Step 3 · Web Signals" },
  { id: "synthesis", label: "Step 4 · AI Synthesis" },
] as const;

const examplePills = [
  "competitive Rubik's cube solvers",
  "Indian kirana store owners",
  "DnD dungeon masters",
] as const;

const sectionToSourceRoute: Record<BriefSectionId, string> = {
  communityPulse: "/api/research/reddit",
  painPoints: "/api/research/reddit",
  competitiveTeardown: "/api/research/appstore",
  motherInsight: "/api/research/web",
  mvpIdea: "/api/research/web",
  hypothesisRoadmap: "/api/research/web",
  buildSignal: "/api/research/web",
};

function nicheWordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeSubredditInput(value: string): string {
  return value
    .trim()
    .replace(/^\/?r\//i, "")
    .replace(/\s+/g, "");
}

function parseComposerInput(raw: string): {
  niche: string;
  subredditHint: string;
  founderContext: string;
} {
  const normalized = raw.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return {
      niche: "",
      subredditHint: "",
      founderContext: "",
    };
  }

  const subredditMatch = normalized.match(/\/?r\/([A-Za-z0-9_]+)/i);
  let working = normalized;
  const subredditHint = subredditMatch?.[1] ?? "";

  if (subredditMatch?.[0]) {
    working = working.replace(subredditMatch[0], " ");
  }

  working = working.replace(/\s{2,}/g, " ").trim();

  const founderTriggers = [
    /\bI['’]ve\b/i,
    /\bI have\b/i,
    /\bI am\b/i,
    /\bI['’]m\b/i,
    /\bbeen\b/i,
    /\bworking with\b/i,
    /\bselling to\b/i,
    /\bfrom my experience\b/i,
    /\bcontext:\s*/i,
    /\|/,
    /;/,
    /—/,
  ];

  let niche = working;
  let founderContext = "";

  for (const trigger of founderTriggers) {
    const match = working.match(trigger);
    if (!match || match.index === undefined) {
      continue;
    }

    const precedingText = working.slice(0, match.index).trim();
    if (nicheWordCount(precedingText) < 3) {
      continue;
    }

    niche = precedingText;
    founderContext = working.slice(match.index + match[0].length).trim();
    break;
  }

  return {
    niche: niche.replace(/\s{2,}/g, " ").trim(),
    subredditHint,
    founderContext: founderContext.replace(/^[\s:;|—-]+/, "").trim(),
  };
}

function sectionFailureMessage(
  sectionId: BriefSectionId,
  groundedData?: GroundedData,
): string {
  if (!groundedData) {
    return "Section generation was interrupted. Retry this section.";
  }

  if (sectionId === "communityPulse" || sectionId === "painPoints") {
    if (
      groundedData.reddit.status === "failed" ||
      groundedData.reddit.status === "not_found"
    ) {
      return "Reddit data unavailable - synthesis used web signals only.";
    }
  }

  if (sectionId === "competitiveTeardown") {
    if (
      groundedData.appstore.status === "failed" ||
      groundedData.appstore.status === "not_found"
    ) {
      return "App Store data unavailable - synthesis used web tools only.";
    }
  }

  if (
    groundedData.web.status === "failed" ||
    groundedData.web.status === "not_found"
  ) {
    return "Web data unavailable - synthesis used remaining sources only.";
  }

  return "Synthesis stream interrupted for this section. Retry to continue.";
}

async function postJson<T>(
  url: string,
  payload: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as T;
  if (!response.ok) {
    throw new Error(
      (data as { fallbackNote?: string }).fallbackNote ??
        `Request failed (${response.status})`,
    );
  }

  return data;
}

export default function Home() {
  const shouldReduceMotion = useReducedMotion();

  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [composerInput, setComposerInput] = useState("");
  const [niche, setNiche] = useState("");
  const [subredditHint, setSubredditHint] = useState("");
  const [founderContext, setFounderContext] = useState("");
  const [nicheValidationError, setNicheValidationError] = useState<
    string | null
  >(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const pipeline = useBriefStore((state) => state.pipeline);
  const briefDraft = useBriefStore((state) => state.briefDraft);

  const parsedComposerInput = useMemo(
    () => parseComposerInput(composerInput),
    [composerInput],
  );

  const retrySection = async (sectionId: BriefSectionId) => {
    const store = useBriefStore.getState();
    const currentNiche = store.briefDraft.niche;
    const currentGrounded = store.briefDraft.groundedData;
    if (!currentNiche || !currentGrounded) {
      return;
    }

    store.setSectionStatus(sectionId, "streaming");

    try {
      const sourceRoute = sectionToSourceRoute[sectionId];
      let refreshedGrounded: GroundedData = currentGrounded;

      if (sourceRoute === "/api/research/reddit") {
        const retrySubredditHint =
          currentGrounded.reddit.status === "success" ||
          currentGrounded.reddit.status === "partial"
            ? currentGrounded.reddit.subredditName
            : normalizeSubredditInput(subredditHint);

        const reddit = await postJson<GroundedData["reddit"]>(sourceRoute, {
          niche: currentNiche,
          ...(retrySubredditHint ? { subreddit: retrySubredditHint } : {}),
        });
        refreshedGrounded = { ...currentGrounded, reddit };
      } else if (sourceRoute === "/api/research/appstore") {
        const appstore = await postJson<GroundedData["appstore"]>(sourceRoute, {
          niche: currentNiche,
        });
        refreshedGrounded = { ...currentGrounded, appstore };
      } else {
        const web = await postJson<GroundedData["web"]>(sourceRoute, {
          niche: currentNiche,
        });
        refreshedGrounded = { ...currentGrounded, web };
      }

      store.setGroundedData(refreshedGrounded);

      const response = await fetch("/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche: currentNiche,
          groundedData: refreshedGrounded,
          founderContext: store.briefDraft.founderContext,
          targetSection: sectionId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Section retry synthesis failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedTargetSection = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            const validated = sectionEnvelopeSchema.safeParse(parsed);
            if (!validated.success) continue;
            if (validated.data.section !== sectionId) continue;

            store.setSectionData(validated.data.section, validated.data.data);
            receivedTargetSection = true;
          } catch {
            continue;
          }
        }
      }

      if (!receivedTargetSection) {
        store.setSectionStatus(
          sectionId,
          "failed",
          sectionFailureMessage(sectionId, refreshedGrounded),
        );
      }
    } catch {
      store.setSectionStatus(
        sectionId,
        "failed",
        sectionFailureMessage(
          sectionId,
          useBriefStore.getState().briefDraft.groundedData,
        ),
      );
    }
  };

  const runInstantDemoBrief = async () => {
    const store = useBriefStore.getState();
    const demo = createRubikDemoBrief();

    setGlobalError(null);
    setShareNotice(null);
    setViewMode("brief");

    store.resetBriefDraft();
    store.setNicheContext({
      niche: demo.niche,
      founderContext: demo.founderContext,
    });
    store.setGroundedData(demo.groundedData);
    store.setBriefIdentity({ createdAt: demo.createdAt });

    store.setStepStatus(
      "reddit",
      "complete",
      `r/${demo.groundedData.reddit.status === "success" ? demo.groundedData.reddit.subredditName : "community"}`,
    );
    store.setStepStatus(
      "appstore",
      "complete",
      `${demo.groundedData.appstore.status === "success" ? demo.groundedData.appstore.results.length : 0} apps`,
    );
    store.setStepStatus(
      "web",
      "complete",
      `${demo.groundedData.web.status === "success" ? demo.groundedData.web.providerUsed : "fallback"} web signal`,
    );
    store.setStepStatus("synthesis", "complete", "Demo brief loaded instantly");

    for (const id of briefSectionIds) {
      store.setSectionData(id, demo.sections[id]);
    }

    try {
      const saveResult = await postJson<{ status: string; id: string }>(
        "/api/brief/save",
        {
          ...demo,
          id: undefined,
        },
      );
      if (saveResult.status === "success" && saveResult.id) {
        store.setBriefIdentity({ id: saveResult.id });
        window.history.replaceState({}, "", `/brief/${saveResult.id}`);
      }
    } catch {
      setShareNotice(
        "Brief generated locally. Share link unavailable because KV is not configured.",
      );
    }
  };

  const runPipeline = async (input?: {
    niche: string;
    subredditHint: string;
    founderContext: string;
  }) => {
    const store = useBriefStore.getState();
    const activeNiche = input?.niche ?? niche;
    const activeSubredditHint = input?.subredditHint ?? subredditHint;
    const activeFounderContext = input?.founderContext ?? founderContext;

    setGlobalError(null);
    setShareNotice(null);
    setNicheValidationError(null);
    setViewMode("pipeline");

    const normalizedSubredditHint =
      normalizeSubredditInput(activeSubredditHint);

    store.resetBriefDraft();
    store.setNicheContext({
      niche: activeNiche,
      founderContext: activeFounderContext,
    });
    store.setBriefIdentity({ createdAt: new Date().toISOString() });

    for (const sectionId of briefSectionIds) {
      store.setSectionStatus(sectionId, "pending");
    }

    const redditPromise = (async () => {
      store.setStepStatus("reddit", "running");
      try {
        const result = await postJson<GroundedData["reddit"]>(
          "/api/research/reddit",
          {
            niche: activeNiche,
            ...(normalizedSubredditHint
              ? { subreddit: normalizedSubredditHint }
              : {}),
          },
        );
        const snippet =
          result.status === "success" || result.status === "partial"
            ? `r/${result.subredditName} · ${result.subscriberCount.toLocaleString()} members`
            : result.fallbackNote;
        store.setStepStatus(
          "reddit",
          result.status === "partial" ? "partial" : "complete",
          snippet,
        );
        return result;
      } catch (error) {
        store.setStepStatus("reddit", "failed", "Reddit unavailable");
        return {
          status: "failed",
          fallbackNote:
            error instanceof Error ? error.message : "Reddit failed",
        } as GroundedData["reddit"];
      }
    })();

    const appstorePromise = (async () => {
      store.setStepStatus("appstore", "running");
      try {
        const result = await postJson<GroundedData["appstore"]>(
          "/api/research/appstore",
          { niche: activeNiche },
        );
        const appCount =
          result.status === "success" || result.status === "partial"
            ? result.results.length
            : 0;
        store.setStepStatus(
          "appstore",
          result.status === "partial" ? "partial" : "complete",
          `${appCount} app signals`,
        );
        return result;
      } catch (error) {
        store.setStepStatus("appstore", "failed", "App Store unavailable");
        return {
          status: "failed",
          results: [],
          fallbackNote:
            error instanceof Error ? error.message : "App Store failed",
        } as GroundedData["appstore"];
      }
    })();

    const webPromise = (async () => {
      store.setStepStatus("web", "running");
      try {
        const result = await postJson<GroundedData["web"]>(
          "/api/research/web",
          { niche: activeNiche },
        );
        const snippet =
          "providerUsed" in result
            ? `Provider: ${result.providerUsed}${result.fallbackProviderUsed ? ` -> ${result.fallbackProviderUsed}` : ""}`
            : `Providers failed: ${result.providersTried.join(", ")}`;
        store.setStepStatus(
          "web",
          result.status === "partial" ? "partial" : "complete",
          snippet,
        );
        return result;
      } catch (error) {
        store.setStepStatus("web", "failed", "Web signals unavailable");
        return {
          status: "failed",
          providersTried: ["serper", "tavily"],
          fallbackNote:
            error instanceof Error ? error.message : "Web search failed",
        } as GroundedData["web"];
      }
    })();

    const [reddit, appstore, web] = await Promise.all([
      redditPromise,
      appstorePromise,
      webPromise,
    ]);
    const groundedData: GroundedData = { reddit, appstore, web };

    store.setGroundedData(groundedData);
    store.setStepStatus("synthesis", "running", "Streaming sections...");
    for (const sectionId of briefSectionIds) {
      store.setSectionStatus(sectionId, "streaming");
    }

    try {
      const synthResponse = await fetch("/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche: activeNiche,
          groundedData,
          founderContext: activeFounderContext,
        }),
      });

      if (!synthResponse.ok) {
        let synthesisError = "Synthesis request failed";
        try {
          const payload = (await synthResponse.json()) as {
            fallbackNote?: string;
            error?: string;
            detail?: string;
          };
          synthesisError =
            payload.fallbackNote ??
            payload.detail ??
            payload.error ??
            synthesisError;
        } catch {
          synthesisError = `Synthesis request failed (${synthResponse.status})`;
        }
        throw new Error(synthesisError);
      }

      if (!synthResponse.body) {
        throw new Error("Synthesis stream unavailable");
      }

      const reader = synthResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            const validated = sectionEnvelopeSchema.safeParse(parsed);
            if (!validated.success) continue;
            store.setSectionData(validated.data.section, validated.data.data);
          } catch {
            continue;
          }
        }
      }

      const sections = useBriefStore.getState().briefDraft.sections;
      const allSectionsComplete = briefSectionIds.every((sectionId) =>
        Boolean(sections[sectionId]),
      );

      if (!allSectionsComplete) {
        const latestGrounded = useBriefStore.getState().briefDraft.groundedData;
        for (const sectionId of briefSectionIds) {
          if (!sections[sectionId]) {
            store.setSectionStatus(
              sectionId,
              "failed",
              sectionFailureMessage(sectionId, latestGrounded),
            );
          }
        }
      }

      store.setStepStatus(
        "synthesis",
        allSectionsComplete ? "complete" : "partial",
        allSectionsComplete
          ? "All sections completed"
          : "Partial brief generated",
      );
      setViewMode("brief");

      if (allSectionsComplete) {
        const finalBrief = {
          id: "temp",
          niche: activeNiche,
          createdAt:
            useBriefStore.getState().briefDraft.createdAt ??
            new Date().toISOString(),
          founderContext: activeFounderContext || undefined,
          groundedData,
          sections: {
            communityPulse: sections.communityPulse,
            painPoints: sections.painPoints,
            competitiveTeardown: sections.competitiveTeardown,
            motherInsight: sections.motherInsight,
            mvpIdea: sections.mvpIdea,
            hypothesisRoadmap: sections.hypothesisRoadmap,
            buildSignal: sections.buildSignal,
          },
          generationMetadata: {
            webProviderUsed:
              "providerUsed" in web ? web.providerUsed : undefined,
            webFallbackProviderUsed:
              "fallbackProviderUsed" in web
                ? web.fallbackProviderUsed
                : undefined,
            isDemoBrief: false,
          },
        };

        const validatedBrief = nicheBriefSchema.safeParse(finalBrief);
        if (validatedBrief.success) {
          try {
            const saveResult = await postJson<{ status: string; id: string }>(
              "/api/brief/save",
              {
                ...validatedBrief.data,
                id: undefined,
              },
            );

            if (saveResult.status === "success" && saveResult.id) {
              useBriefStore.getState().setBriefIdentity({ id: saveResult.id });
              window.history.replaceState({}, "", `/brief/${saveResult.id}`);
            }
          } catch {
            setShareNotice(
              "Brief generated locally. Share link unavailable because KV is not configured.",
            );
          }
        }
      }
    } catch (error) {
      const latestGrounded = useBriefStore.getState().briefDraft.groundedData;
      const sections = useBriefStore.getState().briefDraft.sections;
      for (const sectionId of briefSectionIds) {
        if (!sections[sectionId]) {
          store.setSectionStatus(
            sectionId,
            "failed",
            sectionFailureMessage(sectionId, latestGrounded),
          );
        }
      }

      const synthesisErrorMessage =
        error instanceof Error ? error.message : "Pipeline failed";
      store.setStepStatus("synthesis", "failed", synthesisErrorMessage);
      setGlobalError(synthesisErrorMessage);
    }
  };

  const onSubmit = async () => {
    setGlobalError(null);
    const parsed = parseComposerInput(composerInput);

    setNiche(parsed.niche);
    setSubredditHint(parsed.subredditHint);
    setFounderContext(parsed.founderContext);

    if (!parsed.niche.trim()) {
      setNicheValidationError("Describe the opportunity first.");
      return;
    }

    if (nicheWordCount(parsed.niche) < 3 && !parsed.subredditHint) {
      setNicheValidationError(
        "Please enter at least 3 words for a niche, or provide a subreddit.",
      );
      return;
    }

    setNicheValidationError(null);
    await runPipeline(parsed);
  };

  return (
    <div className="flex w-full flex-1 text-foreground items-center mx-auto flex-col">
      <div className=" w-full max-w-5xl flex-1 flex-col px-6 sm:px-10">
        <AnimatePresence mode="wait">
          {viewMode === "home" ? (
            <HomeView
              shouldReduceMotion={Boolean(shouldReduceMotion)}
              composerInput={composerInput}
              parsedSubreddit={parsedComposerInput.subredditHint}
              parsedFounderContext={parsedComposerInput.founderContext}
              nicheValidationError={nicheValidationError}
              globalError={globalError}
              examplePills={examplePills}
              onComposerInputChange={(value) => {
                setComposerInput(value);
                if (nicheValidationError) {
                  setNicheValidationError(null);
                }
              }}
              onSubmit={() => {
                void onSubmit();
              }}
              onSelectExample={(pill) => {
                if (pill === "competitive Rubik's cube solvers") {
                  void runInstantDemoBrief();
                  return;
                }
                setComposerInput(pill);
              }}
              isSubmitDisabled={!composerInput.trim()}
            />
          ) : (
            <PipelineView
              shouldReduceMotion={Boolean(shouldReduceMotion)}
              pipeline={pipeline}
              pipelineSteps={pipelineSteps}
              sections={briefDraft.sections}
              briefId={briefDraft.id}
              shareNotice={shareNotice}
              onRetrySection={(section) => {
                void retrySection(section);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
