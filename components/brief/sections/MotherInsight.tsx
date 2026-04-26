import type { MotherInsightData } from "@/types/brief";

type MotherInsightProps = {
  data?: MotherInsightData;
};

export function MotherInsight({ data }: MotherInsightProps) {
  if (!data) {
    return (
      <section className="border-t border-(--color-border) py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            The Mother Insight
          </p>
          <div className="skeleton-line h-12 w-4/5" />
          <div className="skeleton-line mt-3 h-12 w-3/4" />
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-(--color-border) py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
          The Mother Insight
        </p>
        <blockquote>
          <p className="text-3xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {data.insight}
          </p>
        </blockquote>
      </div>
    </section>
  );
}
