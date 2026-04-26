import Link from "next/link";
import { headers } from "next/headers";
import { z } from "zod";

import { BriefExportButton } from "@/components/brief/brief-export-button";
import { BriefSectionsRenderer } from "@/components/brief/brief-sections";
import { BriefShareBar } from "@/components/brief/brief-share-bar";
import { nicheBriefSchema } from "@/types/brief";

const briefFetchSchema = z.object({
  status: z.literal("success"),
  brief: nicheBriefSchema,
});

async function getBriefById(id: string) {
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return null;
  }

  const response = await fetch(`${protocol}://${host}/api/brief/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  const validated = briefFetchSchema.safeParse(json);
  if (!validated.success) {
    return null;
  }

  return validated.data.brief;
}

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brief = await getBriefById(id);

  if (!brief) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl text-foreground">
          Brief not found
        </h1>
        <p className="mt-3 text-sm text-(--color-text-secondary)">
          This brief may have expired or the link may be incorrect.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface-1) px-4 text-sm text-(--color-text-secondary)"
        >
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl pb-8">
      <div className="print-hidden sticky top-0 z-20 flex items-center justify-between border-b border-(--color-border) bg-(--color-bg)/95 py-3 backdrop-blur">
        <div>
          <h1 className="font-display text-2xl text-foreground">
            {brief.niche}
          </h1>
          <p className="mt-1 font-mono text-xs text-(--color-text-tertiary)">
            Brief #{brief.id} · {new Date(brief.createdAt).toLocaleString()}
          </p>
        </div>
        <BriefExportButton />
      </div>

      <div className="mt-8 border-t border-(--color-border) pt-8">
        <BriefSectionsRenderer sections={brief.sections} />
      </div>

      <BriefShareBar briefId={brief.id} />
    </section>
  );
}
