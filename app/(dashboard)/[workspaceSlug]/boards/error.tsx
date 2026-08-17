"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BoardsError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-xl items-center justify-center">
        <section className="w-full border border-[#E2E8F0] bg-white p-6 text-center sm:p-8">
          <AlertTriangle
            aria-hidden="true"
            className="mx-auto size-6 text-[#B45309]"
          />
          <h1 className="mt-4 text-lg font-semibold text-[#0F172A]">
            Boards could not load.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Check your connection and try again to see the workspace boards.
          </p>
          <Button
            className="mt-6 h-10 rounded-lg bg-[#004BB0] text-sm text-white hover:bg-[#033476]"
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
