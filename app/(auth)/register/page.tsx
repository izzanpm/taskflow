import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create your account | TaskFlow",
  description: "Create your TaskFlow account.",
};

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  const invite = searchParams.invite;
  const inviteToken = typeof invite === "string" ? invite : undefined;

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
              Create your account.
            </h1>
            <p className="mt-4 max-w-[38ch] text-base leading-7 text-[#64748B]">
              Start with a clear view of the work your team is moving forward.
            </p>
          </div>

          <RegisterForm inviteToken={inviteToken} />
        </section>
      </div>
    </main>
  );
}
