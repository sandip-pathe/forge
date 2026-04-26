import type { HypothesisRoadmapData } from "@/types/brief";

type HypothesisRoadmapProps = {
  data?: HypothesisRoadmapData;
};

export function HypothesisRoadmap({ data }: HypothesisRoadmapProps) {
  if (!data) {
    return (
      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            Hypothesis Roadmap
          </p>
          <h2 className="text-xl font-medium text-foreground">
            Hypothesis Roadmap
          </h2>
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            {[0, 1].map((item) => (
              <article
                key={item}
                className="border-t border-(--color-border) pt-4"
              >
                <div className="skeleton-line h-4 w-1/3" />
                <div className="skeleton-line mt-3 h-4 w-4/5" />
                <div className="skeleton-line mt-2 h-4 w-full" />
                <div className="skeleton-line mt-2 h-4 w-11/12" />
                <div className="skeleton-line mt-2 h-4 w-10/12" />
              </article>
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
          Hypothesis Roadmap
        </p>
        <h2 className="text-xl font-medium text-foreground">
          Hypothesis Roadmap
        </h2>

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          {data.experiments.map((experiment, index) => (
            <article
              key={experiment.id}
              className="border-t border-(--color-border) pt-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
                Experiment {index + 1}
              </p>

              <dl className="mt-3 space-y-4 text-[15px]">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
                    Assumption
                  </dt>
                  <dd className="mt-1 text-(--color-text-secondary)">
                    {experiment.assumption}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
                    How to run it
                  </dt>
                  <dd className="mt-1 text-(--color-text-secondary)">
                    {experiment.howToRun}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
                    Yes signal
                  </dt>
                  <dd className="mt-1 text-(--color-text-secondary)">
                    {experiment.yesSignal}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
                    No signal
                  </dt>
                  <dd className="mt-1 text-(--color-text-secondary)">
                    {experiment.noSignal}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
