import { motion } from "framer-motion";

type HomeViewProps = {
  shouldReduceMotion: boolean;
  composerInput: string;
  parsedSubreddit: string;
  parsedFounderContext: string;
  nicheValidationError: string | null;
  globalError: string | null;
  examplePills: readonly string[];
  onComposerInputChange: (value: string) => void;
  onSubmit: () => void;
  onSelectExample: (pill: string) => void;
  isSubmitDisabled: boolean;
};

function attachmentLabel(value: string): string {
  return value.length > 24 ? `${value.slice(0, 21)}...` : value;
}

export function HomeView({
  shouldReduceMotion,
  composerInput,
  parsedSubreddit,
  parsedFounderContext,
  nicheValidationError,
  globalError,
  examplePills,
  onComposerInputChange,
  onSubmit,
  onSelectExample,
  isSubmitDisabled,
}: HomeViewProps) {
  return (
    <motion.section
      key="home"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col justify-center py-4 sm:py-6"
    >
      <div className="mx-auto w-full max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-(--color-text-tertiary)">
          Hello, founder.
        </p>
        <h1 className="mt-4 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Find overlooked software opportunities in active communities.
        </h1>
        <p className="text-sm text-(--color-text-secondary) sm:text-base">
          One prompt. We will parse the niche, subreddit, and context for you.
        </p>
      </div>

      <div className="mx-auto mt-6 w-full max-w-215">
        <div className="relative rounded-[30px] border border-(--color-border) bg-[rgba(255,255,255,0.02)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-5">
          <textarea
            value={composerInput}
            onChange={(e) => onComposerInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Describe a community you understand..."
            className="min-h-25 w-full resize-none overflow-y-auto border-0 bg-transparent px-1 py-1 pr-16 text-[16px] leading-7 text-foreground placeholder:text-(--color-text-tertiary) outline-none sm:text-[17px] scrollbar-none"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
            {parsedSubreddit ? (
              <span className="inline-flex items-center rounded-full border border-(--color-accent) bg-(--color-accent-muted) px-3 py-1 text-xs font-medium text-(--color-accent-strong)">
                r/{attachmentLabel(parsedSubreddit)}
              </span>
            ) : null}
            {parsedFounderContext ? (
              <span className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface-1) px-3 py-1 text-xs text-(--color-text-secondary)">
                Founder context attached
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            aria-label="Generate brief"
            className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-(--color-accent) text-lg font-semibold text-black shadow-lg transition-all hover:-translate-y-0.5 hover:bg-(--color-accent-strong) disabled:pointer-events-none disabled:opacity-40"
          >
            ↑
          </button>
        </div>

        {nicheValidationError ? (
          <p className="mt-3 px-2 text-sm text-(--color-signal-low)">
            {nicheValidationError}
          </p>
        ) : null}

        {globalError ? (
          <div className="mt-4 rounded-2xl border border-(--color-signal-low) bg-[rgba(235,87,87,0.08)] px-4 py-3 text-sm text-(--color-signal-low)">
            {globalError}
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-5 pt-5 grid w-full max-w-215 gap-3 sm:grid-cols-3">
        {examplePills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => onSelectExample(pill)}
            className="group rounded-2xl border border-(--color-border) bg-[rgba(255,255,255,0.015)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-(--color-text-secondary) hover:bg-[rgba(255,255,255,0.03)]"
          >
            <div className="mt-2 text-sm leading-relaxed text-foreground">
              {pill}
            </div>
          </button>
        ))}
      </div>
    </motion.section>
  );
}
