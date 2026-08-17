"use client";

import { type FormEvent, useRef, useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WorkspaceResponse = {
  data?: { slug: string };
  error?: string;
};

const inputClassName =
  "h-12 rounded-lg border-[#CBD5E1] bg-white px-4 text-base text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:border-[#004BB0] focus-visible:ring-[#004BB0]/20";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("Give your workspace a name with at least 2 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = (await response.json()) as WorkspaceResponse;

      if (!response.ok || !result.data) {
        setErrorMessage(result.error ?? "We could not create your workspace.");
        return;
      }

      router.push(`/${result.data.slug}/boards`);
    } catch {
      setErrorMessage("We could not create your workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="flex size-12 items-center justify-center rounded-lg bg-[#E8F0FB] text-[#004BB0]">
        <Building2 aria-hidden="true" className="size-5" />
      </div>

      <div className="space-y-2">
        <Label className="text-[#0F172A]" htmlFor="workspace-name">
          Workspace name
        </Label>
        <Input
          autoComplete="organization"
          autoFocus
          className={inputClassName}
          id="workspace-name"
          maxLength={80}
          name="name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Studio"
          value={name}
        />
        <p className="text-xs leading-5 text-[#64748B]">
          You can invite teammates and manage access after this step.
        </p>
      </div>

      {errorMessage ? (
        <p
          aria-live="assertive"
          className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
          ref={errorRef}
          role="alert"
          tabIndex={-1}
        >
          {errorMessage}
        </p>
      ) : null}

      <Button
        className="h-11 w-full rounded-lg bg-[#004BB0] text-sm text-white hover:bg-[#033476]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating workspace..." : "Create workspace"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  );
}
