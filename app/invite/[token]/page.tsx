import Link from "next/link";
import { headers } from "next/headers";

import { InviteAcceptanceForm } from "@/components/workspace/InviteAcceptanceForm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isInviteExpired } from "@/lib/invites";

export const metadata = {
  title: "Workspace invitation | TaskFlow",
  description: "Join a workspace on TaskFlow.",
};

export default async function InvitePage(props: PageProps<"/invite/[token]">) {
  const { token } = await props.params;
  const invite = await db.invite.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      workspace: { select: { name: true, slug: true } },
    },
  });
  const session = await auth.api.getSession({ headers: await headers() });

  const inviteLink = encodeURIComponent(token);

  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-10 text-[#0F172A] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[32rem] items-center">
        <section className="w-full">
          <Link
            className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-[#004BB0] transition-colors hover:text-[#033476] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30"
            href="/login"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[#004BB0]"
            />
            TaskFlow
          </Link>

          <div className="mt-10 border border-[#E2E8F0] bg-white p-6 sm:p-8">
            {!invite ? (
              <InviteState
                body="This invitation link is invalid or no longer available."
                title="Invitation not found."
              />
            ) : invite.acceptedAt ? (
              <InviteState
                body="This invitation has already been accepted."
                title="Invitation complete."
              />
            ) : isInviteExpired(invite.expiresAt) ? (
              <InviteState
                body="Ask a workspace admin to create a new invitation link."
                title="Invitation expired."
              />
            ) : (
              <>
                <p className="text-sm font-semibold text-[#004BB0]">
                  You&apos;re invited
                </p>
                <h1 className="mt-3 font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A]">
                  Join {invite.workspace.name}.
                </h1>
                <p className="mt-4 text-base leading-7 text-[#64748B]">
                  You&apos;ll join as a{" "}
                  {invite.role === "ADMIN" ? "workspace admin" : "member"}.
                </p>

                {session ? (
                  session.user.email.toLowerCase() ===
                  invite.email.toLowerCase() ? (
                    <div className="mt-8">
                      <p className="mb-4 text-sm text-[#64748B]">
                        Signed in as{" "}
                        <strong className="font-semibold text-[#0F172A]">
                          {session.user.email}
                        </strong>
                      </p>
                      <InviteAcceptanceForm
                        token={token}
                        workspaceSlug={invite.workspace.slug}
                      />
                    </div>
                  ) : (
                    <InviteState
                      body={`Sign in with ${invite.email} to accept this invitation.`}
                      title="Wrong account."
                    />
                  )
                ) : (
                  <div className="mt-8 space-y-3">
                    <Link
                      className="flex h-11 items-center justify-center rounded-lg bg-[#004BB0] px-4 text-sm font-medium text-white transition-colors hover:bg-[#033476] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#004BB0]/30"
                      href={`/login?invite=${inviteLink}`}
                    >
                      Sign in to accept
                    </Link>
                    <Link
                      className="flex h-11 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white px-4 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#004BB0]/20"
                      href={`/register?invite=${inviteLink}`}
                    >
                      Create an account
                    </Link>
                    <p className="pt-2 text-center text-xs leading-5 text-[#64748B]">
                      This link was created for {invite.email}.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InviteState({ body, title }: { body: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#991B1B]">Workspace invite</p>
      <h1 className="mt-3 font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A]">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-[#64748B]">{body}</p>
      <Link
        className="mt-8 inline-flex text-sm font-semibold text-[#004BB0] underline-offset-4 hover:underline"
        href="/login"
      >
        Back to sign in
      </Link>
    </div>
  );
}
