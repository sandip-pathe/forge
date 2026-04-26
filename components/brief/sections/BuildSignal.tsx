"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { BuildSignalData } from "@/types/brief";

type BuildSignalProps = {
  data?: BuildSignalData;
};

function verdictTone(verdict: BuildSignalData["verdict"]): string {
  if (verdict === "Green") return "text-(--color-accent)";
  if (verdict === "Yellow") return "text-(--color-signal-medium)";
  return "text-(--color-signal-low)";
}

function pointTone(
  valence: BuildSignalData["dataPoints"][number]["valence"],
): string {
  if (valence === "positive") return "bg-(--color-signal-high)";
  if (valence === "negative") return "bg-(--color-signal-low)";
  return "bg-(--color-text-tertiary)";
}

export function BuildSignal({ data }: BuildSignalProps) {
  const reduceMotion = useReducedMotion();

  if (!data) {
    return (
      <section className="border-t border-(--color-border) py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            Build Signal
          </p>
          <div className="mb-2 flex items-baseline gap-4">
            <div className="skeleton-line h-20 w-12" />
            <div className="w-full">
              <div className="skeleton-line h-8 w-28" />
              <div className="skeleton-line mt-2 h-4 w-3/4" />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="skeleton-line mt-1.25 h-1.5 w-1.5 rounded-full" />
                <div className="skeleton-line h-4 w-11/12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const verdictArrow =
    data.verdict === "Green" ? "↑" : data.verdict === "Yellow" ? "→" : "↓";

  return (
    <section className="border-t border-(--color-border) py-14 sm:py-20">
      <motion.div
        initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.35 }}
        className="mx-auto max-w-3xl"
      >
        <div>
          <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            Build Signal
          </p>

          <div className="mb-2 flex items-baseline gap-4">
            <span
              className={`text-7xl font-bold leading-none tabular-nums sm:text-8xl ${verdictTone(data.verdict)}`}
            >
              {verdictArrow}
            </span>
            <div>
              <p
                className={`text-2xl font-semibold ${verdictTone(data.verdict)}`}
              >
                {data.verdictLabel}
              </p>
              <p className="mt-1 max-w-xl text-[15px] text-(--color-text-secondary)">
                {data.verdictRationale}
              </p>
            </div>
          </div>

          <div className="mt-8 max-w-xl space-y-3">
            {data.dataPoints.map((point, index) => (
              <div
                key={`${point.point}-${index}`}
                className="flex items-start gap-3"
              >
                <span
                  className={`mt-1.25 h-1.5 w-1.5 shrink-0 rounded-full ${pointTone(point.valence)}`}
                />
                <p className="text-[15px] text-(--color-text-secondary)">
                  {point.point}
                </p>
              </div>
            ))}
          </div>

          {data.founderEdge ? (
            <div className="mt-8 max-w-xl border-t border-(--color-border) pt-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-(--color-text-tertiary)">
                Your Edge
              </p>
              <p className="text-[15px] leading-relaxed text-(--color-text-secondary)">
                {data.founderEdge}
              </p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
