"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type InviteAcceptanceFormProps = {
  token: string;
};

export function InviteAcceptanceForm({ token }: InviteAcceptanceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function acceptInvite() {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(result.error ?? "We could not accept this invite.");
        return;
      }

      router.push("/workspaces");
    } catch {
      setErrorMessage("We could not accept this invite. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p
          aria-live="assertive"
          className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      <Button
        className="h-11 w-full rounded-lg bg-[#004BB0] text-sm text-white hover:bg-[#033476]"
        disabled={isSubmitting}
        onClick={acceptInvite}
        type="button"
      >
        {isSubmitting ? "Joining workspace..." : "Accept invitation"}
        {isSubmitting ? (
          <Check aria-hidden="true" />
        ) : (
          <ArrowRight aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
