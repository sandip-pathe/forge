import type { MVPIdeaData } from "@/types/brief";

type MVPIdeaProps = {
  data?: MVPIdeaData;
};

export function MVPIdea({ data }: MVPIdeaProps) {
  if (!data) {
    return (
      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            MVP Idea
          </p>
          <h2 className="text-xl font-medium text-foreground">MVP Idea</h2>
          <div className="mt-4 space-y-3">
            <div className="skeleton-line h-8 w-1/2" />
            <div className="skeleton-line h-4 w-4/5" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="skeleton-line h-4 w-full" />
            ))}
            <div className="skeleton-line h-20 w-full rounded-md" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-(--color-border) py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
          MVP Idea
        </p>
        <h2 className="text-xl font-medium text-foreground">MVP Idea</h2>

        <div className="mt-4">
          <h3 className="text-2xl font-semibold text-foreground">
            {data.productName}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-(--color-text-secondary)">
            {data.tagline}
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] text-(--color-text-secondary)">
            {data.coreFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ol>

          <div className="mt-6 border-t border-(--color-border) pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
              Monetization Hypothesis
            </p>
            <p className="mt-2 text-base font-medium text-foreground">
              {data.monetizationModel}
            </p>
            <p className="mt-1 text-[15px] text-(--color-text-secondary)">
              {data.monetizationRationale}
            </p>
          </div>

          <p className="mt-6 text-[15px] text-(--color-text-secondary)">
            <span className="text-(--color-text-tertiary)">
              Platform recommendation:
            </span>{" "}
            {data.platformRecommendation} - {data.platformRationale}
          </p>
        </div>
      </div>
    </section>
  );
}
