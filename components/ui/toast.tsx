"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastVariant = "error" | "success";

type ToastProps = {
  message: string;
  onDismiss: () => void;
  variant?: ToastVariant;
};

export function Toast({ message, onDismiss, variant = "error" }: ToastProps) {
  if (!message) return null;

  const isError = variant === "error";

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "fixed inset-x-4 bottom-4 z-[60] flex items-start gap-3 border bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.14)] sm:left-auto sm:w-[min(24rem,calc(100vw-2rem))]",
        isError ? "border-[#FECACA]" : "border-[#A7F3D0]",
      )}
      role={isError ? "alert" : "status"}
    >
      {isError ? (
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-[#B91C1C]"
        />
      ) : (
        <CircleCheck
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-[#047857]"
        />
      )}
      <p
        className={cn(
          "min-w-0 flex-1 text-sm leading-5",
          isError ? "text-[#991B1B]" : "text-[#065F46]",
        )}
      >
        {message}
      </p>
      <Button
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 size-7 shrink-0 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
        onClick={onDismiss}
        size="icon-sm"
        title="Dismiss notification"
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

export type { ToastVariant };
