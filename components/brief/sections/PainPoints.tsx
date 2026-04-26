import type { PainPointsData, PainPointItem } from "@/types/brief";

type PainPointsProps = {
  data?: PainPointsData;
};

function signalTone(signal: PainPointItem["signalStrength"]): string {
  if (signal === "High") return "bg-(--color-signal-high)";
  if (signal === "Medium") return "bg-(--color-signal-medium)";
  return "bg-(--color-text-tertiary)";
}

export function PainPoints({ data }: PainPointsProps) {
  if (!data) {
    return (
      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            Pain Points
          </p>
          <h2 className="text-xl font-medium text-foreground">Pain Points</h2>

          <div className="mt-4 space-y-8">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-5">
                <div className="skeleton-line mt-1.5 h-2 w-2 rounded-full" />
                <div className="w-full">
                  <div className="skeleton-line h-5 w-2/3" />
                  <div className="skeleton-line mt-2 h-4 w-full" />
                  <div className="skeleton-line mt-2 h-4 w-4/5" />
                  <div className="skeleton-line mt-3 h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-(--color-border) py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
          Pain Points
        </p>
        <h2 className="text-xl font-medium text-foreground">Pain Points</h2>

        <div className="mt-4 space-y-8">
          {data.points.map((point, index) => (
            <div key={`${point.title}-${index}`} className="flex gap-5">
              <div
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${signalTone(point.signalStrength)}`}
              />
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-medium text-foreground">
                    {point.title}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-tertiary)">
                    {point.signalStrength}
                  </span>
                </div>
                <p className="mt-1 text-[15px] leading-relaxed text-(--color-text-secondary)">
                  {point.description}
                </p>
                <p className="mt-2 text-xs italic text-(--color-text-tertiary)">
                  &ldquo;{point.evidence}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
