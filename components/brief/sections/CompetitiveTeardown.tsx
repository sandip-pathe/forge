import type { CompetitiveTeardownData } from "@/types/brief";

type CompetitiveTeardownProps = {
  data?: CompetitiveTeardownData;
};

function ratingText(value: number | null): string {
  if (value === null) return "n/a";
  return `${value.toFixed(1)}★`;
}

export function CompetitiveTeardown({ data }: CompetitiveTeardownProps) {
  if (!data) {
    return (
      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            Competitive Teardown
          </p>
          <h2 className="text-xl font-medium text-foreground">
            Competitive Teardown
          </h2>

          <div className="mt-4 divide-y divide-(--color-border)">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="flex items-start justify-between gap-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="skeleton-line h-5 w-2/3" />
                  <div className="skeleton-line mt-2 h-4 w-full" />
                </div>
                <div className="shrink-0">
                  <div className="skeleton-line h-6 w-14" />
                  <div className="skeleton-line mt-2 h-3 w-16" />
                  <div className="skeleton-line mt-1 h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (data.noAppsFound) {
    return (
      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            Competitive Teardown
          </p>
          <h2 className="text-xl font-medium text-foreground">
            Competitive Teardown
          </h2>
          <div className="mt-4">
            <p className="text-base font-medium text-foreground">
              No dedicated apps found in this niche
            </p>
            <p className="mt-2 text-[15px] text-(--color-text-secondary)">
              {data.noAppsFoundSignal ?? "This is a signal, not a gap."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-(--color-border) py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
          Competitive Teardown
        </p>
        <h2 className="text-xl font-medium text-foreground">
          Competitive Teardown
        </h2>

        <div className="mt-4 divide-y divide-(--color-border)">
          {data.competitors.map((competitor) => (
            <div
              key={competitor.name}
              className="flex items-start justify-between gap-6 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-foreground">
                  {competitor.name}
                </p>
                <p className="mt-0.5 text-[15px] text-(--color-text-secondary)">
                  {competitor.whyItFails}
                </p>
              </div>

              <div className="shrink-0 text-right">
                {competitor.rating !== null ? (
                  <p className="text-xl font-semibold tabular-nums text-foreground">
                    {ratingText(competitor.rating)}
                  </p>
                ) : null}
                <p
                  className={`mt-0.5 text-xs font-semibold uppercase tracking-widest ${
                    competitor.weaknessTag === "Abandoned"
                      ? "text-(--color-signal-low)"
                      : "text-(--color-text-tertiary)"
                  }`}
                >
                  {competitor.weaknessTag}
                </p>
                {competitor.lastUpdated ? (
                  <p className="mt-0.5 text-xs text-(--color-text-tertiary)">
                    {competitor.lastUpdated}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
