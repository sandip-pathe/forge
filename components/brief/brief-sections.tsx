import type { ReactNode } from "react";

import type {
  BriefSectionId,
  BriefSections,
  SectionProgressState,
} from "@/types/brief";

import { BuildSignal } from "@/components/brief/sections/BuildSignal";
import { CommunityPulse } from "@/components/brief/sections/CommunityPulse";
import { CompetitiveTeardown } from "@/components/brief/sections/CompetitiveTeardown";
import { HypothesisRoadmap } from "@/components/brief/sections/HypothesisRoadmap";
import { MotherInsight } from "@/components/brief/sections/MotherInsight";
import { MVPIdea } from "@/components/brief/sections/MVPIdea";
import { PainPoints } from "@/components/brief/sections/PainPoints";

type SectionProps = {
  sections: Partial<BriefSections>;
  sectionProgress?: Record<BriefSectionId, SectionProgressState>;
  sectionErrors?: Partial<Record<BriefSectionId, string>>;
  onRetrySection?: (section: BriefSectionId) => void;
};

function SectionErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-(--color-border-strong) bg-(--color-surface-2) p-4">
      <p className="text-sm text-(--color-text-secondary)">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md border border-(--color-border) px-3 text-sm text-(--color-text-secondary)"
        >
          Retry section
        </button>
      ) : null}
    </div>
  );
}

function sectionWrap(
  id: BriefSectionId,
  content: ReactNode,
  sectionProgress?: Record<BriefSectionId, SectionProgressState>,
  sectionErrors?: Partial<Record<BriefSectionId, string>>,
  onRetrySection?: (section: BriefSectionId) => void,
): ReactNode {
  const progress = sectionProgress?.[id];
  const hasError = progress?.status === "failed";
  if (!hasError) {
    return content;
  }

  const errorMessage =
    sectionErrors?.[id] ??
    progress?.error ??
    "Data unavailable for this section. Retry to continue.";

  return (
    <>
      {content}
      <SectionErrorCard
        message={errorMessage}
        onRetry={onRetrySection ? () => onRetrySection(id) : undefined}
      />
    </>
  );
}

function showData(
  section: BriefSectionId,
  sections: Partial<BriefSections>,
  sectionProgress?: Record<BriefSectionId, SectionProgressState>,
): boolean {
  if (sections[section]) return true;
  if (!sectionProgress) return false;
  return sectionProgress[section].status === "complete";
}

export function BriefSectionsRenderer({
  sections,
  sectionProgress,
  sectionErrors,
  onRetrySection,
}: SectionProps) {
  return (
    <div>
      {sectionWrap(
        "communityPulse",
        <CommunityPulse
          data={
            showData("communityPulse", sections, sectionProgress)
              ? sections.communityPulse
              : undefined
          }
        />,
        sectionProgress,
        sectionErrors,
        onRetrySection,
      )}

      {sectionWrap(
        "painPoints",
        <PainPoints
          data={
            showData("painPoints", sections, sectionProgress)
              ? sections.painPoints
              : undefined
          }
        />,
        sectionProgress,
        sectionErrors,
        onRetrySection,
      )}

      {sectionWrap(
        "competitiveTeardown",
        <CompetitiveTeardown
          data={
            showData("competitiveTeardown", sections, sectionProgress)
              ? sections.competitiveTeardown
              : undefined
          }
        />,
        sectionProgress,
        sectionErrors,
        onRetrySection,
      )}

      {sectionWrap(
        "motherInsight",
        <MotherInsight
          data={
            showData("motherInsight", sections, sectionProgress)
              ? sections.motherInsight
              : undefined
          }
        />,
        sectionProgress,
        sectionErrors,
        onRetrySection,
      )}

      {sectionWrap(
        "mvpIdea",
        <MVPIdea
          data={
            showData("mvpIdea", sections, sectionProgress)
              ? sections.mvpIdea
              : undefined
          }
        />,
        sectionProgress,
        sectionErrors,
        onRetrySection,
      )}

      {sectionWrap(
        "hypothesisRoadmap",
        <HypothesisRoadmap
          data={
            showData("hypothesisRoadmap", sections, sectionProgress)
              ? sections.hypothesisRoadmap
              : undefined
          }
        />,
        sectionProgress,
        sectionErrors,
        onRetrySection,
      )}

      {sectionWrap(
        "buildSignal",
        <BuildSignal
          data={
            showData("buildSignal", sections, sectionProgress)
              ? sections.buildSignal
              : undefined
          }
        />,
        sectionProgress,
        sectionErrors,
        onRetrySection,
      )}
    </div>
  );
}
