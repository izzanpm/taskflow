# Changelog

## Unreleased

- Added Phase 0 use case, process flow, class, and UI navigation diagrams under
  `docs/`.
- Verified the Next.js App Router and TypeScript foundation with lint, typecheck, and
  production build.
- Configured Tailwind CSS v4 and initialized shadcn/ui with the base-nova preset,
  CSS variables, shared `cn` utility, and Button component.
- Documented shadcn/ui as the standard component layer for UI development.
- Completed ESLint and Prettier setup with flat-config integration and formatting
  scripts.
- Verified the PostgreSQL 16 Docker Compose service, persistent volume, healthcheck,
  and local connection.
- Verified Prisma 7 initialization, configuration, schema validation, and migration
  status against the local PostgreSQL database.
- Verified the initial Prisma data models and first migration are present and applied;
  recorded the Prisma 7 schema representation difference as an open question.
- Added a GitHub Actions CI workflow for dependency installation, lint, and typecheck
  on pull requests and pushes to `main`.
- Verified the deployed skeleton at `https://taskflow-nine-alpha-20.vercel.app`.
- Added Better-Auth account, session, and verification storage to the Prisma schema.
- Configured Better-Auth email/password authentication with Prisma-backed sessions
  and the Next.js auth route.
- Added the English centered register page with Better-Auth sign-up handling, inline
  validation, loading/error/success states, and shadcn input primitives.
- Added the English centered login page with Better-Auth sign-in handling, inline
  validation, and accessible loading, error, and success states.
- Fixed clean CI typechecks by generating Next.js route types before running TypeScript.
- Added a server-side logout action that signs out through Better-Auth and redirects to
  the login page.
- Added a temporary sign-out button to the post-login state for validating logout behavior.
- Added Next.js 16 proxy-based session protection for authenticated dashboard routes.
