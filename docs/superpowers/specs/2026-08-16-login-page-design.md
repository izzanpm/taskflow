# Login Page Design

## Scope

Build the next unchecked Phase 2 task: a public `/login` page with an email and
password form backed by Better-Auth. Password reset remains outside the MVP.

## Interface

- Match the existing register page structure and TaskFlow design system.
- Use a centered, responsive layout with Instrument Serif for the heading and DM Sans
  for body content.
- Include email and password fields, a primary `Sign in` button, and a link to
  `/register` for users without an account.
- Reuse the existing shadcn `Button`, `Input`, and `Label` primitives.

## Behavior

- Submit credentials through `authClient.signIn.email`.
- Require both fields and reject an invalid email address before making a request.
- Disable the submit button and show `Signing in...` while the request is pending.
- Show Better-Auth errors in an accessible inline alert, with a generic fallback for
  unexpected failures.
- On success, remain on `/login` and replace the form with a focusable success status.
  Workspace-aware redirects are deferred until their destination routes exist.

## Files

- Add `app/(auth)/login/page.tsx` for metadata and page composition.
- Add `components/auth/LoginForm.tsx` for form state and Better-Auth interaction.
- Reuse `lib/auth-client.ts` and existing UI primitives without new dependencies.

## Verification

- Run Prettier, ESLint, TypeScript, and the production build.
- Run the local Impeccable detector against the changed UI.
- Smoke-test that `/login` responds with HTTP 200 and contains its heading and action.
- Mark the task complete in `TASK.md` and add an Unreleased entry to `CHANGELOG.md`
  only after all checks pass.
