import type { CommunityPulseData } from "@/types/brief";

type CommunityPulseProps = {
  data?: CommunityPulseData;
};

function activityTone(level: CommunityPulseData["activityLevel"]): string {
  if (level === "High") return "text-(--color-accent)";
  if (level === "Medium") return "text-(--color-signal-medium)";
  return "text-(--color-text-secondary)";
}

export function CommunityPulse({ data }: CommunityPulseProps) {
  if (!data) {
    return (
      <section className="border-t border-(--color-border) py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
            Community Pulse
          </p>
          <h2 className="text-xl font-medium text-foreground">
            Community Pulse
          </h2>

          <div className="mt-4 flex flex-wrap gap-8">
            <div>
              <div className="skeleton-line h-3 w-20" />
              <div className="skeleton-line mt-2 h-8 w-32" />
              <div className="skeleton-line mt-2 h-3 w-24" />
            </div>
            <div>
              <div className="skeleton-line h-3 w-16" />
              <div className="skeleton-line mt-2 h-8 w-20" />
            </div>
            <div>
              <div className="skeleton-line h-3 w-16" />
              <div className="skeleton-line mt-2 h-8 w-24" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="skeleton-line h-7 w-28 rounded-md" />
            ))}
          </div>

          <div className="skeleton-line mt-4 h-4 w-11/12" />
        </div>
      </section>
    );
  }

  const subscriberValue =
    data.subscriberCount !== null
      ? data.subscriberCount.toLocaleString()
      : "n/a";

  return (
    <section className="border-t border-(--color-border) py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-text-tertiary)">
          Community Pulse
        </p>
        <h2 className="text-xl font-medium text-foreground">Community Pulse</h2>

        <div className="mt-4 flex flex-wrap gap-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-tertiary)">
              Community
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {subscriberValue}
            </p>
            <p className="text-xs text-(--color-text-tertiary)">
              {data.subscriberLabel}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-tertiary)">
              Activity
            </p>
            <p
              className={`mt-1 text-2xl font-semibold ${activityTone(data.activityLevel)}`}
            >
              {data.activityLevel}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-tertiary)">
              Platform
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {data.primaryPlatform}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {data.topThemes.map((theme) => (
            <span
              key={theme}
              className="rounded-full border border-(--color-border) px-3 py-1 text-sm text-(--color-text-secondary)"
            >
              {theme}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-(--color-text-secondary)">
          {data.communityCharacter}
        </p>
      </div>
    </section>
  );
}
