import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "Profile settings | TaskFlow",
  description: "Update your TaskFlow profile.",
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
          <Link
            className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-[#004BB0] transition-colors hover:text-[#033476] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30"
            href="/settings/profile"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[#004BB0]"
            />
            TaskFlow
          </Link>
          <LogoutButton />
        </header>

        <section className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#004BB0]">Account</p>
            <h1 className="mt-3 font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A] sm:text-5xl">
              Your profile.
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-7 text-[#64748B]">
              Keep your identity current so teammates know who is moving work
              forward.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-start">
            <aside className="border border-[#E2E8F0] bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] uppercase">
                Signed-in account
              </p>
              <p className="mt-4 break-words text-sm font-semibold text-[#0F172A]">
                {user.email}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Your email stays private and is used for authentication.
              </p>
            </aside>

            <section className="border border-[#E2E8F0] bg-white p-5 sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  Profile details
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  Update the details your workspace will show to teammates.
                </p>
              </div>
              <ProfileForm
                email={user.email}
                initialAvatarUrl={user.avatarUrl}
                initialName={user.name}
              />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
