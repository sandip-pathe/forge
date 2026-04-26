import { z } from "zod";

export const pipelineStepIds = [
  "reddit",
  "appstore",
  "web",
  "synthesis",
] as const;
export type PipelineStepId = (typeof pipelineStepIds)[number];

export const stepStatuses = [
  "pending",
  "running",
  "complete",
  "partial",
  "failed",
] as const;
export type StepStatus = (typeof stepStatuses)[number];

export const briefSectionIds = [
  "communityPulse",
  "painPoints",
  "competitiveTeardown",
  "motherInsight",
  "mvpIdea",
  "hypothesisRoadmap",
  "buildSignal",
] as const;
export type BriefSectionId = (typeof briefSectionIds)[number];

export const sectionStatuses = [
  "pending",
  "streaming",
  "complete",
  "failed",
] as const;
export type SectionStatus = (typeof sectionStatuses)[number];

export const sourceStatusSchema = z.enum([
  "success",
  "partial",
  "failed",
  "not_found",
]);
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const providerSchema = z.enum(["serper", "tavily"]);
export type WebProvider = z.infer<typeof providerSchema>;

export const redditPostSchema = z.object({
  title: z.string().min(1),
  score: z.number().int(),
  flair: z.string().nullable().optional(),
});
export type RedditPost = z.infer<typeof redditPostSchema>;

export const redditSignalSchema = z.object({
  status: z.enum(["success", "partial"]),
  subredditName: z.string().min(1),
  subscriberCount: z.number().int().nonnegative(),
  topPosts: z.array(redditPostSchema),
  topFlairs: z.array(z.string()),
  fallbackNote: z.string().optional(),
});
export type RedditSignal = z.infer<typeof redditSignalSchema>;

export const redditNotFoundSchema = z.object({
  status: z.enum(["not_found", "failed"]),
  fallbackNote: z.string().min(1),
});
export type RedditNotFound = z.infer<typeof redditNotFoundSchema>;

export const appResultSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  rating: z.number().nullable(),
  reviewCount: z.number().int().nonnegative().nullable(),
  lastUpdated: z.string().nullable(),
  sellerName: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url().optional(),
});
export type AppResult = z.infer<typeof appResultSchema>;

export const appStoreSignalSchema = z.object({
  status: z.enum(["success", "partial"]),
  results: z.array(appResultSchema).max(5),
  fallbackNote: z.string().optional(),
});
export type AppStoreSignal = z.infer<typeof appStoreSignalSchema>;

export const appStoreNotFoundSchema = z.object({
  status: z.enum(["not_found", "failed"]),
  results: z.array(appResultSchema).length(0),
  fallbackNote: z.string().optional(),
});
export type AppStoreNotFound = z.infer<typeof appStoreNotFoundSchema>;

export const webSignalSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  snippet: z.string().min(1),
  domain: z.string().optional(),
});
export type WebSignal = z.infer<typeof webSignalSchema>;

export const webSignalSuccessSchema = z.object({
  status: z.enum(["success", "partial"]),
  providerUsed: providerSchema,
  fallbackProviderUsed: providerSchema.optional(),
  results: z.array(webSignalSchema).max(10),
  fallbackNote: z.string().optional(),
});
export type WebSignalSuccess = z.infer<typeof webSignalSuccessSchema>;

export const webSignalFailedSchema = z.object({
  status: z.enum(["failed", "not_found"]),
  providersTried: z.array(providerSchema).min(1),
  results: z.array(webSignalSchema).optional(),
  fallbackNote: z.string().optional(),
});
export type WebSignalFailed = z.infer<typeof webSignalFailedSchema>;

export const webSignalEnvelopeSchema = z.union([
  webSignalSuccessSchema,
  webSignalFailedSchema,
]);
export type WebSignalEnvelope = z.infer<typeof webSignalEnvelopeSchema>;

export const groundedDataSchema = z.object({
  reddit: z.union([redditSignalSchema, redditNotFoundSchema]),
  appstore: z.union([appStoreSignalSchema, appStoreNotFoundSchema]),
  web: webSignalEnvelopeSchema,
});
export type GroundedData = z.infer<typeof groundedDataSchema>;

export const communityPulseDataSchema = z.object({
  primaryPlatform: z.string().min(1),
  subscriberCount: z.number().nullable(),
  subscriberLabel: z.string().min(1),
  activityLevel: z.enum(["High", "Medium", "Low"]),
  activityRationale: z.string().min(1),
  topThemes: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  communityCharacter: z.string().min(1),
});
export type CommunityPulseData = z.infer<typeof communityPulseDataSchema>;

export const painPointItemSchema = z.object({
  title: z.string().min(1),
  signalStrength: z.enum(["High", "Medium", "Emerging"]),
  description: z.string().min(1),
  evidence: z.string().min(1),
});
export type PainPointItem = z.infer<typeof painPointItemSchema>;

export const painPointsDataSchema = z.object({
  points: z.tuple([
    painPointItemSchema,
    painPointItemSchema,
    painPointItemSchema,
  ]),
});
export type PainPointsData = z.infer<typeof painPointsDataSchema>;

export const competitorSchema = z.object({
  name: z.string().min(1),
  rating: z.number().nullable(),
  reviewCount: z.number().int().nonnegative().nullable(),
  lastUpdated: z.string().nullable(),
  source: z.enum(["appstore", "web"]),
  weaknessTag: z.enum([
    "Abandoned",
    "Desktop-only",
    "Generic",
    "No community features",
    "Poor UX",
    "Expensive",
  ]),
  whyItFails: z.string().min(1),
});
export type Competitor = z.infer<typeof competitorSchema>;

export const competitiveTeardownDataSchema = z
  .object({
    noAppsFound: z.boolean(),
    noAppsFoundSignal: z.string().nullable(),
    competitors: z.array(competitorSchema).max(3),
  })
  .refine(
    (value) =>
      value.noAppsFound
        ? value.competitors.length === 0 && value.noAppsFoundSignal !== null
        : true,
    {
      message:
        "When noAppsFound is true, competitors must be empty and noAppsFoundSignal must exist.",
    },
  );
export type CompetitiveTeardownData = z.infer<
  typeof competitiveTeardownDataSchema
>;

export const motherInsightDataSchema = z.object({
  insight: z.string().min(1),
});
export type MotherInsightData = z.infer<typeof motherInsightDataSchema>;

export const mvpIdeaDataSchema = z.object({
  productName: z.string().min(1),
  tagline: z.string().min(1),
  coreFeatures: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  platformRecommendation: z.enum(["mobile-first", "web-first", "desktop"]),
  platformRationale: z.string().min(1),
  monetizationModel: z.string().min(1),
  monetizationRationale: z.string().min(1),
});
export type MVPIdeaData = z.infer<typeof mvpIdeaDataSchema>;

export const hypothesisExperimentSchema = z.object({
  id: z.union([z.literal(1), z.literal(2)]),
  assumption: z.string().min(1),
  howToRun: z.string().min(1),
  timeframe: z.string().min(1),
  yesSignal: z.string().min(1),
  noSignal: z.string().min(1),
  yesThreshold: z.number().int().nonnegative().nullable(),
});
export type HypothesisExperiment = z.infer<typeof hypothesisExperimentSchema>;

export const hypothesisRoadmapDataSchema = z.object({
  experiments: z
    .tuple([hypothesisExperimentSchema, hypothesisExperimentSchema])
    .refine(
      (exps) => exps[0].id !== exps[1].id,
      "Experiment ids must be unique",
    ),
});
export type HypothesisRoadmapData = z.infer<typeof hypothesisRoadmapDataSchema>;

export const buildSignalPointSchema = z.object({
  point: z.string().min(1),
  valence: z.enum(["positive", "negative", "neutral"]),
});
export type BuildSignalPoint = z.infer<typeof buildSignalPointSchema>;

export const buildSignalDataSchema = z.object({
  verdict: z.enum(["Green", "Yellow", "Red"]),
  verdictLabel: z.string().min(1),
  verdictRationale: z.string().min(1),
  dataPoints: z.tuple([
    buildSignalPointSchema,
    buildSignalPointSchema,
    buildSignalPointSchema,
  ]),
  founderEdge: z.string().nullable(),
});
export type BuildSignalData = z.infer<typeof buildSignalDataSchema>;

export const briefSectionDataSchemas = {
  communityPulse: communityPulseDataSchema,
  painPoints: painPointsDataSchema,
  competitiveTeardown: competitiveTeardownDataSchema,
  motherInsight: motherInsightDataSchema,
  mvpIdea: mvpIdeaDataSchema,
  hypothesisRoadmap: hypothesisRoadmapDataSchema,
  buildSignal: buildSignalDataSchema,
} as const;

export type BriefSections = {
  communityPulse: CommunityPulseData;
  painPoints: PainPointsData;
  competitiveTeardown: CompetitiveTeardownData;
  motherInsight: MotherInsightData;
  mvpIdea: MVPIdeaData;
  hypothesisRoadmap: HypothesisRoadmapData;
  buildSignal: BuildSignalData;
};

export const generationMetadataSchema = z.object({
  webProviderUsed: providerSchema.optional(),
  webFallbackProviderUsed: providerSchema.optional(),
  isDemoBrief: z.boolean().default(false),
});
export type GenerationMetadata = z.infer<typeof generationMetadataSchema>;

export const nicheBriefSchema = z.object({
  id: z.string().min(1),
  niche: z.string().min(1),
  createdAt: z.string().min(1),
  founderContext: z.string().optional(),
  groundedData: groundedDataSchema,
  sections: z.object(briefSectionDataSchemas),
  generationMetadata: generationMetadataSchema.optional(),
});
export type NicheBrief = z.infer<typeof nicheBriefSchema>;

export const sectionEnvelopeSchema = z.discriminatedUnion("section", [
  z.object({
    section: z.literal("communityPulse"),
    data: communityPulseDataSchema,
  }),
  z.object({ section: z.literal("painPoints"), data: painPointsDataSchema }),
  z.object({
    section: z.literal("competitiveTeardown"),
    data: competitiveTeardownDataSchema,
  }),
  z.object({
    section: z.literal("motherInsight"),
    data: motherInsightDataSchema,
  }),
  z.object({ section: z.literal("mvpIdea"), data: mvpIdeaDataSchema }),
  z.object({
    section: z.literal("hypothesisRoadmap"),
    data: hypothesisRoadmapDataSchema,
  }),
  z.object({ section: z.literal("buildSignal"), data: buildSignalDataSchema }),
]);
export type SectionEnvelope = z.infer<typeof sectionEnvelopeSchema>;

export type PipelineStepState = {
  status: StepStatus;
  snippet?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
};

export type SectionProgressState = {
  status: SectionStatus;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
};

export type PipelineState = {
  steps: Record<PipelineStepId, PipelineStepState>;
  sectionProgress: Record<BriefSectionId, SectionProgressState>;
};

export type SettingsState = {
  theme: "dark" | "light";
};

export type BriefDraft = {
  id?: string;
  niche?: string;
  createdAt?: string;
  founderContext?: string;
  groundedData?: GroundedData;
  sections: Partial<BriefSections>;
  generationMetadata?: GenerationMetadata;
};
