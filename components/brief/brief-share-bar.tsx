"use client";

import { useState } from "react";

type BriefShareBarProps = {
  briefId: string;
};

export function BriefShareBar({ briefId }: BriefShareBarProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="print-hidden sticky bottom-4 mt-8 rounded-lg border border-(--color-border) bg-(--color-surface-1)/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-(--color-text-secondary)">
          Brief saved · Share link{" "}
          <span className="font-mono text-(--color-text-tertiary)">
            /{briefId}
          </span>
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-(--color-border-strong) bg-(--color-surface-2) px-3 text-sm text-(--color-text-secondary)"
        >
          {copied ? "Copied" : "Copy URL"}
        </button>
      </div>
    </div>
  );
}
