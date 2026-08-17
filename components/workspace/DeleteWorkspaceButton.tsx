"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function DeleteWorkspaceButton({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function deleteWorkspace() {
    setErrorMessage("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(result.error ?? "We could not delete this workspace.");
        return;
      }

      router.push("/workspaces");
    } catch {
      setErrorMessage("We could not delete this workspace. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-[#64748B]">
        Deleting this workspace removes its members, boards, and tasks
        permanently.
      </p>
      {errorMessage ? (
        <p
          aria-live="assertive"
          className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      {isConfirming ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            className="h-10 rounded-lg bg-[#991B1B] px-3 text-sm text-white hover:bg-[#7F1D1D]"
            disabled={isDeleting}
            onClick={deleteWorkspace}
            type="button"
          >
            <Trash2 aria-hidden="true" />
            {isDeleting ? "Deleting..." : "Confirm delete"}
          </Button>
          <Button
            className="h-10 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            onClick={() => setIsConfirming(false)}
            type="button"
            variant="ghost"
          >
            Keep workspace
          </Button>
        </div>
      ) : (
        <Button
          className="h-10 rounded-lg border-[#FECACA] text-sm text-[#991B1B] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
          onClick={() => setIsConfirming(true)}
          type="button"
          variant="outline"
        >
          <AlertTriangle aria-hidden="true" />
          Delete workspace
        </Button>
      )}
    </div>
  );
}
