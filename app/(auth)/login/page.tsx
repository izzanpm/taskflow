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
