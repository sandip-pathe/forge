"use client";

export function BriefExportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hidden inline-flex min-h-11 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface-2) px-3 text-sm text-(--color-text-secondary)"
    >
      Export
    </button>
  );
}
