# Better-Auth Base Integration Design

## Scope

Implement the first Phase 2 task: a working Better-Auth server configuration for
email/password authentication in the Next.js App Router. This includes the database
models and API route required by Better-Auth, but excludes registration UI, login UI,
logout controls, and dashboard route protection because those are separate tasks in
`TASK.md`.

## Decisions

- Use Better-Auth's native Prisma schema rather than custom password storage.
- Extend the existing domain `User` model instead of creating a second auth user.
- Store credential passwords only in `Account.password`.
- Remove the unused `User.passwordHash` field.
- Map Better-Auth's user image field to the existing `User.avatarUrl` field.
- Store sessions in PostgreSQL through the Better-Auth Prisma adapter.
- Keep rate limiting in Better-Auth's default storage for this base integration; do
  not add a rate-limit table.
- Use the existing `/api/auth/[...all]` route required by the project architecture.

## Data Model

`PRD.md` section 10 remains the source of truth and must be updated before
`prisma/schema.prisma`.

The existing `User` model changes as follows:

- Add `emailVerified Boolean @default(false)`.
- Keep `avatarUrl String?` and map Better-Auth's `image` field to it in auth config.
- Remove `passwordHash`.
- Add `sessions Session[]` and `accounts Account[]` relations.

Add Better-Auth's required models:

- `Session`: unique token, expiry, request metadata, timestamps, and cascading user
  relation.
- `Account`: provider/account identifiers, optional credential password and OAuth
  token fields, timestamps, and cascading user relation.
- `Verification`: identifier, value, expiry, and timestamps.

All new tables follow the project's snake_case table mapping convention. Foreign-key
lookup fields and Better-Auth lookup fields receive the required indexes and unique
constraints.

The Phase 0 class diagram must be updated to show the new auth models and relations.

## Server Architecture

### Prisma Client

`lib/db.ts` exports a singleton Prisma client to avoid creating a new connection pool
during Next.js development reloads. The project uses Prisma 7, so PostgreSQL access
uses the official PostgreSQL driver adapter and the generated client at the configured
output path.

### Better-Auth Configuration

`lib/auth.ts` exports one `auth` instance configured with:

- Prisma adapter using the PostgreSQL provider.
- Email/password authentication enabled.
- `user.fields.image` mapped to `avatarUrl`.
- Secret and base URL read from Better-Auth environment variables.
- No social providers or plugins in this task.

### Route Handler

`app/api/auth/[...all]/route.ts` adapts the `auth` instance with
`toNextJsHandler()` and exports `GET` and `POST`.

## Request Flow

1. A client sends an auth request to `/api/auth/*`.
2. The Next.js catch-all route forwards the request to Better-Auth.
3. Better-Auth validates the request and uses the Prisma adapter.
4. Prisma reads or writes `User`, `Account`, `Session`, or `Verification` records in
   PostgreSQL.
5. Better-Auth returns the response and manages the session cookie.

Registration and login pages will call these endpoints in later Phase 2 tasks.

## Environment

Document these variables without committing values:

- `DATABASE_URL`: PostgreSQL connection string.
- `BETTER_AUTH_SECRET`: random secret used by Better-Auth.
- `BETTER_AUTH_URL`: canonical application URL, locally
  `http://localhost:3000` and the production Vercel URL in production.

The existing `AUTH_SECRET` documentation will be replaced by
`BETTER_AUTH_SECRET` to match Better-Auth's supported convention.

## Migration Sequence

1. Update the ERD summary and Prisma code block in `PRD.md`.
2. Apply the same model changes to `prisma/schema.prisma`.
3. Update the Phase 0 class diagram.
4. Generate a named Prisma migration for the auth schema.
5. Generate Prisma Client explicitly.
6. Add the database singleton, Better-Auth config, and route handler.

The migration removes only the unused nullable `passwordHash` column and adds auth
tables/fields. The current database contains no shipped authentication data, so no
password migration or compatibility path is required.

## Error Handling and Security

- Secrets remain server-only and are never exposed through `NEXT_PUBLIC_*` variables.
- Better-Auth owns password hashing, session token generation, cookie behavior, and
  auth response handling.
- The application does not duplicate credential validation or password storage.
- Missing required environment variables must fail configuration clearly rather than
  silently using committed fallback secrets.
- Production uses its canonical HTTPS URL; local development uses localhost.

## Verification

- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Start the app and request a Better-Auth endpoint to confirm the route is mounted and
  does not fail because of missing tables or adapter configuration.

After verification, mark only `Integrate Better-Auth base config` complete in
`TASK.md` and append the result to `CHANGELOG.md`.
