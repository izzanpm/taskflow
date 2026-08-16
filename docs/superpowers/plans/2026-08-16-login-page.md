# Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/login` page that signs users in with Better-Auth and displays accessible loading, error, and success states.

**Architecture:** The App Router page owns metadata and visual composition. A focused client component reads native form data, validates it at the browser boundary, calls the existing `authClient.signIn.email`, and remains on `/login` after success because workspace destination routes do not exist yet.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Better-Auth 1.6, Tailwind CSS 4, shadcn/ui

## Global Constraints

- Do not install new dependencies.
- Password reset remains outside the MVP.
- Use the existing `Button`, `Input`, `Label`, and `authClient` implementations.
- Use English UI copy and the existing TaskFlow design tokens.
- Keep the component filename PascalCase and the component below approximately 150 lines.
- Do not run `git add`, `git commit`, or `git push`; only suggest a commit message.

---

### Task 1: Build and verify the login page

**Files:**

- Create: `app/(auth)/login/page.tsx`
- Create: `components/auth/LoginForm.tsx`
- Modify: `TASK.md:48`
- Modify: `CHANGELOG.md` under `## Unreleased`

**Interfaces:**

- Consumes: `authClient.signIn.email({ email: string, password: string })` from `lib/auth-client.ts`
- Consumes: `Button`, `Input`, and `Label` from `components/ui/`
- Produces: public route `/login` and exported component `LoginForm(): JSX.Element`

- [ ] **Step 1: Load the required UI guidance**

Run:

```powershell
node .agents/skills/impeccable/scripts/context.mjs --target "app/(auth)/login/page.tsx"
```

Read the playbook selected by the context command and:

```text
.agents/skills/impeccable/reference/craft-floor.md
```

Expected: guidance for the new auth page is available before editing.

- [ ] **Step 2: Verify the acceptance route is initially missing**

Run the development server in one terminal:

```powershell
npm run dev -- --port 3100
```

Run in another terminal:

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:3100/login
```

Expected: `404`. Stop the development server after the check.

- [ ] **Step 3: Create the login page composition**

Create `app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in | TaskFlow",
  description: "Sign in to your TaskFlow account.",
};

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-[#F9F8F6] px-6 py-10 text-[#0F172A] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[30rem] items-center">
        <section className="w-full">
          <div className="mb-10">
            <p className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-[#004BB0]">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#004BB0]"
              />
              TaskFlow
            </p>
            <h1 className="mt-8 font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A] sm:text-5xl">
              Welcome back.
            </h1>
            <p className="mt-4 max-w-[38ch] text-base leading-7 text-[#64748B]">
              Sign in to keep your team&apos;s work moving forward.
            </p>
          </div>

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Create the minimal Better-Auth login form**

Create `components/auth/LoginForm.tsx`:

```tsx
"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const inputClassName =
  "h-12 rounded-xl border-[#E2E8F0] bg-white px-4 text-base";

export function LoginForm() {
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

      setIsComplete(true);
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
          href="/register"
        >
          Create account
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 5: Format and run focused static verification**

Run:

```powershell
npx prettier "app/(auth)/login/page.tsx" components/auth/LoginForm.tsx --write
npm run lint -- --quiet
npm run typecheck
```

Expected: all commands exit `0` with no lint or TypeScript errors.

- [ ] **Step 6: Run UI detector and production build**

Run:

```powershell
node .agents/skills/impeccable/scripts/detect.mjs --json
npm run build
```

Expected: detector returns `[]`; build succeeds and lists `/login` as a static route.

- [ ] **Step 7: Smoke-test the implemented route**

Run the development server:

```powershell
npm run dev -- --port 3100
```

Then run:

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3100/login" -UseBasicParsing
if ($response.StatusCode -ne 200) { throw "Expected HTTP 200" }
if ($response.Content -notmatch "Welcome back") { throw "Login heading missing" }
if ($response.Content -notmatch "Sign in") { throw "Login action missing" }
```

Expected: command exits `0`. Stop the development server after the check.

- [ ] **Step 8: Record completion only after verification**

Change the Phase 2 item in `TASK.md`:

```markdown
- [x] Build login page + form
```

Append under `## Unreleased` in `CHANGELOG.md`:

```markdown
- Added the English centered login page with Better-Auth sign-in handling, inline
  validation, and accessible loading, error, and success states.
```

- [ ] **Step 9: Run final repository checks**

Run:

```powershell
npm run format:check
npm run lint -- --quiet
npm run typecheck
npm run build
node .agents/skills/impeccable/scripts/detect.mjs --json
git diff --check
```

Expected: every command exits `0`, the detector returns `[]`, and the build lists both
`/login` and `/register`.

Suggested commit message for the user:

```text
feat(auth): add login page and sign-in form
```
