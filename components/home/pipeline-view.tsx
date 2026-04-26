import { motion } from "framer-motion";

import { BriefSectionsRenderer } from "@/components/brief/brief-sections";
import {
  briefSectionIds,
  type BriefSectionId,
  type BriefSections,
  type PipelineState,
  type PipelineStepId,
} from "@/types/brief";

type PipelineStepConfig = {
  id: PipelineStepId;
  label: string;
};

type PipelineViewProps = {
  shouldReduceMotion: boolean;
  pipeline: PipelineState;
  pipelineSteps: readonly PipelineStepConfig[];
  sections: Partial<BriefSections>;
  onRetrySection: (section: BriefSectionId) => void;
};

function statusSymbol(
  status: PipelineState["steps"][PipelineStepId]["status"],
): string {
  if (status === "complete") return "v";
  if (status === "running") return ">";
  if (status === "failed") return "x";
  if (status === "partial") return "~";
  return ".";
}

function statusClass(
  status: PipelineState["steps"][PipelineStepId]["status"],
): string {
  if (status === "running") return "text-(--color-accent)";
  if (status === "failed") return "text-(--color-signal-low)";
  if (status === "partial") return "text-(--color-signal-medium)";
  if (status === "complete") return "text-foreground";
  return "text-(--color-text-tertiary)";
}

export function PipelineView({
  shouldReduceMotion,
  pipeline,
  pipelineSteps,
  sections,
  onRetrySection,
}: PipelineViewProps) {
  return (
    <motion.section
      key="pipeline"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
      className="flex w-full max-w-3xl mx-auto flex-1 flex-col"
    >
      <motion.div layout className="py-3">
        <div className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface-1)">
          <div className="flex items-center gap-2 border-b border-(--color-border) px-4 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            <span className="ml-3 font-mono text-xs text-(--color-text-tertiary)">
              niche-finder - research pipeline
            </span>
          </div>

          <div className="space-y-2 px-4 py-4 font-mono text-sm">
            {pipelineSteps.map((step) => {
              const status = pipeline.steps[step.id].status;
              const snippet = pipeline.steps[step.id].snippet;

              return (
                <div key={step.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.75 shrink-0 ${status === "running" ? "animate-pulse" : ""} ${statusClass(status)}`}
                    aria-hidden
                  >
                    {statusSymbol(status)}
                  </span>

                  <span className={statusClass(status)}>
                    {step.label}
                    {snippet ? (
                      <motion.span
                        initial={
                          shouldReduceMotion ? false : { opacity: 0, y: 3 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        className="ml-2 text-xs text-(--color-text-tertiary)"
                      >
                        {`- ${snippet}`}
                      </motion.span>
                    ) : null}
                  </span>

                  {status === "complete" ? (
                    <span className="ml-auto text-xs text-(--color-accent)">
                      done
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="mt-8 space-y-4 pb-12">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
        >
          <BriefSectionsRenderer
            sections={sections}
            sectionProgress={pipeline.sectionProgress}
            sectionErrors={Object.fromEntries(
              briefSectionIds.map((id) => [
                id,
                pipeline.sectionProgress[id].error,
              ]),
            )}
            onRetrySection={onRetrySection}
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
