"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const inputClassName =
  "h-12 rounded-xl border-[#E2E8F0] bg-white px-4 text-base";

export function RegisterForm({ inviteToken }: { inviteToken?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isComplete) {
      successRef.current?.focus();
    }
  }, [isComplete]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const trimmedName = String(formData.get("name") ?? "").trim();
    const trimmedEmail = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm-password") ?? "");
    const emailField = event.currentTarget.elements.namedItem("email");

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage("Complete all fields to create your account.");
      return;
    }

    if (
      !(emailField instanceof HTMLInputElement) ||
      !emailField.validity.valid
    ) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signUp.email({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (error) {
        setErrorMessage(error.message ?? "We could not create your account.");
        return;
      }

      if (inviteToken) {
        router.replace(`/invite/${encodeURIComponent(inviteToken)}`);
        return;
      }

      setIsComplete(true);
    } catch {
      setErrorMessage("We could not create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div
        aria-live="polite"
        className="rounded-xl border border-[#10B981]/30 bg-white p-6 text-[#0F172A]"
        ref={successRef}
        role="status"
        tabIndex={-1}
      >
        <p className="text-sm font-semibold text-[#047857]">Account created.</p>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Your account is ready to continue setting up TaskFlow.
        </p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <RegisterFields />

      {errorMessage ? (
        <p
          aria-live="assertive"
          className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2 text-sm leading-5 text-[#991B1B]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <Button
        className="h-12 w-full rounded-lg bg-[#004BB0] text-base text-white hover:bg-[#033476]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-[#64748B]">
        Already have an account?{" "}
        <Link
          className="font-semibold text-[#004BB0] underline-offset-4 hover:underline"
          href={
            inviteToken
              ? `/login?invite=${encodeURIComponent(inviteToken)}`
              : "/login"
          }
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function RegisterFields() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          autoComplete="name"
          className={inputClassName}
          id="name"
          name="name"
          placeholder="Alex Morgan"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          autoComplete="email"
          className={inputClassName}
          id="email"
          name="email"
          placeholder="alex@company.com"
          required
          type="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          aria-describedby="password-hint"
          autoComplete="new-password"
          className={inputClassName}
          id="password"
          name="password"
          required
          type="password"
        />
        <p className="text-xs leading-5 text-[#64748B]" id="password-hint">
          Use at least 8 characters.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          autoComplete="new-password"
          className={inputClassName}
          id="confirm-password"
          name="confirm-password"
          required
          type="password"
        />
      </div>
    </>
  );
}
