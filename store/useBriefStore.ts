"use client";

import { create } from "zustand";

import {
  briefSectionDataSchemas,
  briefSectionIds,
  type BriefDraft,
  type BriefSectionId,
  type BriefSections,
  type GroundedData,
  pipelineStepIds,
  type PipelineState,
  type PipelineStepId,
  type SectionStatus,
  type SettingsState,
  type StepStatus,
} from "@/types/brief";

const timestamp = () => new Date().toISOString();

const makeInitialPipelineState = (): PipelineState => ({
  steps: {
    reddit: { status: "pending" },
    appstore: { status: "pending" },
    web: { status: "pending" },
    synthesis: { status: "pending" },
  },
  sectionProgress: {
    communityPulse: { status: "pending" },
    painPoints: { status: "pending" },
    competitiveTeardown: { status: "pending" },
    motherInsight: { status: "pending" },
    mvpIdea: { status: "pending" },
    hypothesisRoadmap: { status: "pending" },
    buildSignal: { status: "pending" },
  },
});

const makeInitialBriefDraft = (): BriefDraft => ({
  sections: {},
});

type BriefStore = {
  pipeline: PipelineState;
  briefDraft: BriefDraft;
  settings: SettingsState;
  resetPipeline: () => void;
  setStepStatus: (
    step: PipelineStepId,
    status: StepStatus,
    snippet?: string,
  ) => void;
  setSectionStatus: (
    section: BriefSectionId,
    status: SectionStatus,
    error?: string,
  ) => void;
  setNicheContext: (input: { niche: string; founderContext?: string }) => void;
  setGroundedData: (groundedData: GroundedData) => void;
  setBriefIdentity: (input: { id?: string; createdAt?: string }) => void;
  setSectionData: <T extends BriefSectionId>(
    section: T,
    data: BriefSections[T],
  ) => void;
  resetBriefDraft: () => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
};

export const useBriefStore = create<BriefStore>((set) => ({
  pipeline: makeInitialPipelineState(),
  briefDraft: makeInitialBriefDraft(),
  settings: {
    theme: "dark",
  },
  resetPipeline: () =>
    set(() => ({
      pipeline: makeInitialPipelineState(),
    })),
  setStepStatus: (step, status, snippet) =>
    set((state) => {
      const current = state.pipeline.steps[step];
      return {
        pipeline: {
          ...state.pipeline,
          steps: {
            ...state.pipeline.steps,
            [step]: {
              ...current,
              status,
              snippet: snippet ?? current.snippet,
              startedAt:
                status === "running" && !current.startedAt
                  ? timestamp()
                  : current.startedAt,
              finishedAt:
                status === "complete" ||
                status === "partial" ||
                status === "failed"
                  ? timestamp()
                  : current.finishedAt,
            },
          },
        },
      };
    }),
  setSectionStatus: (section, status, error) =>
    set((state) => {
      const current = state.pipeline.sectionProgress[section];
      return {
        pipeline: {
          ...state.pipeline,
          sectionProgress: {
            ...state.pipeline.sectionProgress,
            [section]: {
              ...current,
              status,
              error,
              startedAt:
                status === "streaming" && !current.startedAt
                  ? timestamp()
                  : current.startedAt,
              finishedAt:
                status === "complete" || status === "failed"
                  ? timestamp()
                  : current.finishedAt,
            },
          },
        },
      };
    }),
  setNicheContext: ({ niche, founderContext }) =>
    set((state) => ({
      briefDraft: {
        ...state.briefDraft,
        niche,
        founderContext,
      },
    })),
  setGroundedData: (groundedData) =>
    set((state) => ({
      briefDraft: {
        ...state.briefDraft,
        groundedData,
      },
    })),
  setBriefIdentity: ({ id, createdAt }) =>
    set((state) => ({
      briefDraft: {
        ...state.briefDraft,
        id: id ?? state.briefDraft.id,
        createdAt: createdAt ?? state.briefDraft.createdAt,
      },
    })),
  setSectionData: (section, data) =>
    set((state) => {
      const schema = briefSectionDataSchemas[section];
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        return state;
      }

      return {
        briefDraft: {
          ...state.briefDraft,
          sections: {
            ...state.briefDraft.sections,
            [section]: parsed.data,
          },
        },
        pipeline: {
          ...state.pipeline,
          sectionProgress: {
            ...state.pipeline.sectionProgress,
            [section]: {
              ...state.pipeline.sectionProgress[section],
              status: "complete",
              finishedAt: timestamp(),
            },
          },
        },
      };
    }),
  resetBriefDraft: () =>
    set(() => ({
      briefDraft: makeInitialBriefDraft(),
      pipeline: makeInitialPipelineState(),
    })),
  setTheme: (theme) =>
    set((state) => ({
      settings: {
        ...state.settings,
        theme,
      },
    })),
  toggleTheme: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        theme: state.settings.theme === "dark" ? "light" : "dark",
      },
    })),
}));

export const getPipelineStepIds = () => [...pipelineStepIds];
export const getBriefSectionIds = () => [...briefSectionIds];
