"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const inputClassName =
  "h-12 rounded-xl border-[#E2E8F0] bg-white px-4 text-base";

export function LoginForm({ inviteToken }: { inviteToken?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isComplete) successRef.current?.focus();
  }, [isComplete]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const emailField = event.currentTarget.elements.namedItem("email");

    if (!email || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    if (
      !(emailField instanceof HTMLInputElement) ||
      !emailField.validity.valid
    ) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({ email, password });

      if (error) {
        setErrorMessage(error.message ?? "We could not sign you in.");
        return;
      }

      if (inviteToken) {
        router.replace(`/invite/${encodeURIComponent(inviteToken)}`);
        return;
      }

      router.replace("/");
    } catch {
      setErrorMessage("We could not sign you in. Please try again.");
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
        <p className="text-sm font-semibold text-[#047857]">Signed in.</p>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Your session is ready. You can continue when your workspace is
          available.
        </p>
        <div className="mt-6 border-t border-[#E2E8F0] pt-4">
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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
          autoComplete="current-password"
          className={inputClassName}
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

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
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-[#64748B]">
        Don&apos;t have an account?{" "}
        <Link
          className="font-semibold text-[#004BB0] underline-offset-4 hover:underline"
          href={
            inviteToken
              ? `/register?invite=${encodeURIComponent(inviteToken)}`
              : "/register"
          }
        >
          Create account
        </Link>
      </p>
    </form>
  );
}
