"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Check, ImageIcon, Save, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  initialName: string;
  initialAvatarUrl: string | null;
  email: string;
};

type ProfileResponse = {
  data?: {
    name: string;
    avatarUrl: string | null;
  };
  error?: string;
};

const inputClassName =
  "h-11 rounded-lg border-[#CBD5E1] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:border-[#004BB0] focus-visible:ring-[#004BB0]/20";

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "TF";
}

export function ProfileForm({
  initialName,
  initialAvatarUrl,
  email,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const hasPreview = /^https?:\/\//i.test(avatarUrl.trim());

  useEffect(() => {
    if (successMessage || errorMessage) statusRef.current?.focus();
  }, [errorMessage, successMessage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage("Enter your name before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          avatarUrl: avatarUrl.trim(),
        }),
      });
      const result = (await response.json()) as ProfileResponse;

      if (!response.ok) {
        setErrorMessage(result.error ?? "We could not update your profile.");
        return;
      }

      if (result.data) {
        setName(result.data.name);
        setAvatarUrl(result.data.avatarUrl ?? "");
      }
      setSuccessMessage("Your profile is up to date.");
    } catch {
      setErrorMessage("We could not update your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-6 sm:flex-row sm:items-center">
        <div
          aria-label={hasPreview ? "Profile photo preview" : "Profile initials"}
          className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FB] text-xl font-semibold text-[#004BB0]"
          role="img"
        >
          {hasPreview ? (
            <Image
              alt="Profile preview"
              className="object-cover"
              fill
              sizes="64px"
              src={avatarUrl}
              unoptimized
            />
          ) : (
            <span aria-hidden="true">{getInitials(name)}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">Your identity</p>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            This is how your name and avatar appear across TaskFlow.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[#0F172A]" htmlFor="profile-name">
            Full name
          </Label>
          <Input
            autoComplete="name"
            className={inputClassName}
            id="profile-name"
            maxLength={80}
            name="name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#0F172A]" htmlFor="profile-email">
            Email address
          </Label>
          <Input
            className={`${inputClassName} cursor-not-allowed bg-[#F8FAFC] text-[#64748B]`}
            id="profile-email"
            readOnly
            value={email}
          />
          <p className="text-xs leading-5 text-[#64748B]">
            Your email is managed by your sign-in method.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-[#0F172A]" htmlFor="profile-avatar">
            Avatar URL{" "}
            <span className="font-normal text-[#64748B]">(optional)</span>
          </Label>
          <div className="relative">
            <ImageIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 size-4 text-[#94A3B8]"
            />
            <Input
              autoComplete="url"
              className={`${inputClassName} pl-10`}
              id="profile-avatar"
              name="avatarUrl"
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.jpg"
              type="url"
              value={avatarUrl}
            />
          </div>
          <p className="text-xs leading-5 text-[#64748B]">
            Use a public image URL. Leave it blank to use your initials.
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p
          aria-live="assertive"
          className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
          ref={statusRef}
          role="alert"
          tabIndex={-1}
        >
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-[#10B981]/25 bg-[#ECFDF5] px-3 py-2.5 text-sm leading-5 text-[#047857]"
          ref={statusRef}
          role="status"
          tabIndex={-1}
        >
          <Check aria-hidden="true" className="size-4 shrink-0" />
          {successMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-[#64748B]">
          <UserRound aria-hidden="true" className="size-4" />
          Changes apply to your account immediately.
        </p>
        <Button
          className="h-11 w-full rounded-lg bg-[#004BB0] px-4 text-sm text-white hover:bg-[#033476] sm:w-auto"
          disabled={isSubmitting}
          type="submit"
        >
          <Save aria-hidden="true" />
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
