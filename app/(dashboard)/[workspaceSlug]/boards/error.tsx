"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BoardsError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-svh bg-taskflow-canvas px-5 py-6 text-taskflow-ink sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-xl items-center justify-center">
        <section className="w-full border border-taskflow-border bg-taskflow-surface p-6 text-center sm:p-8">
          <AlertTriangle
            aria-hidden="true"
            className="mx-auto size-6 text-[#B45309]"
          />
          <h1 className="mt-4 text-lg font-semibold text-taskflow-ink">
            Boards could not load.
          </h1>
          <p className="mt-2 text-sm leading-6 text-taskflow-muted">
            Check your connection and try again to see the workspace boards.
          </p>
          <Button
            className="mt-6 h-10 rounded-lg bg-taskflow-brand text-sm text-white hover:bg-taskflow-brand-hover focus-visible:border-taskflow-brand focus-visible:ring-taskflow-brand/60"
            onClick={reset}
            type="button"
          >
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        </section>
      </div>
    </main>
  );
}
