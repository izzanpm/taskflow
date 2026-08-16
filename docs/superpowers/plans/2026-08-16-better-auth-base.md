# Better-Auth Base Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Add a working Better-Auth email/password backend using the existing Prisma
`User`, PostgreSQL-backed sessions, and a Next.js App Router handler.

**Architecture:** Extend the existing domain `User` with Better-Auth fields and attach
native `Account`, `Session`, and `Verification` models. A singleton Prisma 7 client
uses the PostgreSQL driver adapter; `lib/auth.ts` configures Better-Auth and the
catch-all route exposes it at `/api/auth/*`.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Better-Auth 1.6, Prisma 7.9,
PostgreSQL 16, `@prisma/adapter-pg`, `pg`.

## Global Constraints

- `PRD.md` section 10 is the data-model source of truth and changes before
  `prisma/schema.prisma`.
- Use Better-Auth's native credential storage; never store passwords in `User`.
- Keep `User.avatarUrl` and map Better-Auth's `image` field to it.
- Keep secrets server-only and never commit a populated `.env` file.
- Do not add registration/login UI, logout controls, middleware, social providers, or
  plugins in this plan.
- Do not run `git add`, `git commit`, or `git push`; repository rules reserve those
  actions for the user.

## File Map

- Modify `TASK.md`: add and complete the auth-schema prerequisite before the existing
  base-config task; resolve the Prisma 7 open question.
- Modify `PRD.md`: update the ERD, Prisma 7 generator, `User`, auth models, and design
  notes.
- Modify `docs/phase-0-diagrams.md`: add auth classes and relationships.
- Modify `prisma/schema.prisma`: mirror the approved PRD schema.
- Create through Prisma CLI
  `prisma/migrations/*_add_better_auth/migration.sql`: add auth storage and
  remove unused `passwordHash`.
- Modify `package.json` and `package-lock.json`: install Better-Auth and the Prisma 7
  PostgreSQL adapter dependencies.
- Create `lib/db.ts`: singleton Prisma 7 client.
- Create `lib/auth.ts`: Better-Auth server configuration.
- Create `app/api/auth/[...all]/route.ts`: Next.js auth route handler.
- Modify `.gitignore`: permit a tracked `.env.example`.
- Create `.env.example`: document required environment variable names without secrets.
- Modify `README.md`: document Better-Auth environment setup.
- Modify `CHANGELOG.md`: record schema and base-auth integration.

---

### Task 1: Align Planning Docs and Task Tracker

**Files:**

- Modify: `TASK.md`
- Modify: `PRD.md`
- Modify: `docs/phase-0-diagrams.md`

**Interfaces:**

- Consumes: approved design in
  `docs/superpowers/specs/2026-08-16-better-auth-base-design.md`
- Produces: authoritative auth schema for `prisma/schema.prisma`

- [ ] **Step 1: Add the missing schema prerequisite to Phase 2**

Insert this item immediately before `Integrate Better-Auth base config`:

```markdown
- [ ] Add Better-Auth `Account`, `Session`, and `Verification` models and migration
```

Keep both Phase 2 items unchecked until their respective verification steps pass.

- [ ] **Step 2: Update the PRD ERD summary**

Replace the `User` summary and add the three auth models:

```text
User
 ├── id, email, emailVerified, name, avatarUrl, createdAt, updatedAt
 └── has many: Account, Session, WorkspaceMember, Comment, Attachment,
     Task (as assignee), Invite (as inviter)

Account
 ├── id, accountId, providerId, userId, password, token fields, createdAt, updatedAt
 └── belongs to: User

Session
 ├── id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt
 └── belongs to: User

Verification
 └── id, identifier, value, expiresAt, createdAt, updatedAt
```

- [ ] **Step 3: Update the PRD Prisma generator and `User` model**

Use the Prisma 7 generator already used by the project:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}
```

Replace the PRD `User` model with:

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  emailVerified Boolean  @default(false)
  name          String
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  accounts      Account[]
  sessions      Session[]
  memberships   WorkspaceMember[]
  invitesSent   Invite[]          @relation("InvitedBy")
  assignedTasks Task[]            @relation("TaskAssignee")
  comments      Comment[]
  attachments   Attachment[]

  @@map("users")
}
```

- [ ] **Step 4: Add the Better-Auth models to the PRD Prisma block**

Place these models directly after `User`:

```prisma
model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("accounts")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verifications")
}
```

- [ ] **Step 5: Replace the obsolete password design note**

Replace the `passwordHash` note with:

```markdown
- **Better-Auth credentials** — passwords are hashed and stored by Better-Auth in
  `Account.password`; `User` contains identity/profile fields only. Sessions and
  verification records use Better-Auth's native database models.
```

- [ ] **Step 6: Update the class diagram**

Add these Mermaid classes before the existing enum declarations:

```mermaid
class Session {
    +String id
    +String userId
    +String token
    +DateTime expiresAt
    +String ipAddress
    +String userAgent
    +DateTime createdAt
    +DateTime updatedAt
}

class Account {
    +String id
    +String accountId
    +String providerId
    +String userId
    +String password
    +DateTime createdAt
    +DateTime updatedAt
}

class Verification {
    +String id
    +String identifier
    +String value
    +DateTime expiresAt
    +DateTime createdAt
    +DateTime updatedAt
}
```

Add `emailVerified` to the existing `User` class, remove `passwordHash`, and add:

```mermaid
User "1" --> "0..*" Session : sessions
User "1" --> "0..*" Account : accounts
```

- [ ] **Step 7: Resolve the Prisma 7 open question**

Remove the resolved Prisma 7 item from `TASK.md` because PRD §10.2 now uses
`prisma-client` and the datasource URL remains correctly configured in
`prisma.config.ts`.

- [ ] **Step 8: Check documentation consistency**

Run:

```powershell
npx prettier PRD.md TASK.md docs/phase-0-diagrams.md --check
rg "passwordHash" PRD.md docs/phase-0-diagrams.md
git diff --check
```

Expected: Prettier and `git diff --check` exit `0`; `rg` prints no matches and exits
`1`, confirming the obsolete field is gone.

Suggested commit message for the user:

```text
docs(auth): define Better-Auth data model
```

### Task 2: Apply Auth Schema and Migration

**Files:**

- Modify: `prisma/schema.prisma`
- Create through Prisma CLI:
  `prisma/migrations/*_add_better_auth/migration.sql`
- Modify: `TASK.md`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: exact `User`, `Session`, `Account`, and `Verification` definitions from
  updated `PRD.md` §10.2
- Produces: generated `PrismaClient` with `user`, `session`, `account`, and
  `verification` delegates

- [ ] **Step 1: Recheck that removing `passwordHash` cannot lose auth data**

Run:

```powershell
docker compose exec -T db psql -U taskflow -d taskflow_dev -tAc "SELECT COUNT(*) FROM users WHERE \"passwordHash\" IS NOT NULL;"
```

Expected: `0`. If nonzero, stop and design a credential migration instead of dropping
the field.

- [ ] **Step 2: Mirror the approved PRD schema**

In `prisma/schema.prisma`, replace `User` and add `Session`, `Account`, and
`Verification` using the exact Prisma blocks from Task 1. Do not alter workspace,
board, task, comment, invite, or attachment models.

- [ ] **Step 3: Validate and format before migration**

Run:

```powershell
npx prisma format
npx prisma validate
```

Expected: schema formatting succeeds and Prisma reports that the schema is valid.

- [ ] **Step 4: Create and apply the auth migration**

Run:

```powershell
npx prisma migrate dev --name add_better_auth
```

Expected: Prisma creates one `*_add_better_auth/migration.sql` directory and applies
it successfully. Inspect the SQL and confirm it adds `emailVerified`, `accounts`,
`sessions`, and `verifications`, and drops only `users.passwordHash`.

- [ ] **Step 5: Generate Prisma Client explicitly**

Run:

```powershell
npx prisma generate
npx prisma migrate status
```

Expected: generated client appears under `app/generated/prisma`; migration status says
the database schema is up to date.

- [ ] **Step 6: Mark the auth schema prerequisite complete**

Change only this Phase 2 item to `[x]`:

```markdown
- [x] Add Better-Auth `Account`, `Session`, and `Verification` models and migration
```

Append under `CHANGELOG.md` → `Unreleased`:

```markdown
- Added Better-Auth account, session, and verification storage to the Prisma schema.
```

Suggested commit message for the user:

```text
feat(auth): add Better-Auth database models
```

### Task 3: Add Prisma and Better-Auth Server Integration

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/db.ts`
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...all]/route.ts`
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `README.md`

**Interfaces:**

- Consumes: generated `PrismaClient` from `@/app/generated/prisma/client`
- Produces: `db: PrismaClient`, `auth: ReturnType<typeof betterAuth>`, and Next.js
  route exports `GET` and `POST`

- [ ] **Step 1: Install only the required dependencies**

Run:

```powershell
npm install better-auth@^1.6.23 @prisma/adapter-pg@^7.9.1 pg
npm install --save-dev @types/pg
```

Expected: `package.json` and `package-lock.json` update; no unrelated package is added.

- [ ] **Step 2: Create the Prisma singleton**

Create `lib/db.ts`:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  db: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString });

export const db = globalForPrisma.db ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}
```

- [ ] **Step 3: Create the Better-Auth configuration**

Create `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/lib/db";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

export const auth = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    fields: {
      image: "avatarUrl",
    },
  },
});
```

- [ ] **Step 4: Mount the Next.js route**

Create `app/api/auth/[...all]/route.ts`:

```typescript
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 5: Add a safe environment template**

Add this line immediately after `.env*` in `.gitignore`:

```gitignore
!.env.example
```

Create `.env.example`:

```dotenv
DATABASE_URL="postgresql://taskflow:taskflow_dev_password@localhost:5432/taskflow_dev"
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"

R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
RESEND_API_KEY=""
```

- [ ] **Step 6: Update environment documentation**

In `README.md`, replace `AUTH_SECRET` with these rows:

```markdown
| `BETTER_AUTH_SECRET` | Random secret used to sign/encrypt auth data |
| `BETTER_AUTH_URL` | Canonical app URL, e.g. `http://localhost:3000` |
```

Add this command below the environment copy step:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Explain in one sentence that its output goes into local `.env` as
`BETTER_AUTH_SECRET`, and that production values must be configured in Vercel rather
than committed.

- [ ] **Step 7: Configure local and production environment values**

Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to the ignored local `.env`. In Vercel,
set `BETTER_AUTH_URL` to `https://taskflow-nine-alpha-20.vercel.app` and use a separate
random production secret. Do not reuse the local secret.

- [ ] **Step 8: Run static verification**

Run:

```powershell
npm run format
npx prisma validate
npx prisma generate
npm run lint
npm run typecheck
npm run build
```

Expected: every command exits `0`. If build reports a missing Better-Auth variable,
set it in the process/local `.env`; do not add a source-code fallback.

- [ ] **Step 9: Verify the mounted endpoint**

Start the app:

```powershell
npm run dev
```

In another terminal, run:

```powershell
curl.exe -i http://localhost:3000/api/auth/get-session
```

Expected: HTTP `200`; the unauthenticated response contains no session, and server
logs contain no missing-table, Prisma adapter, or environment errors.

Suggested commit message for the user:

```text
feat(auth): configure Better-Auth server
```

### Task 4: Final Review and Progress Update

**Files:**

- Modify: `TASK.md`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: working `auth` instance and `/api/auth/*` handler from Task 3
- Produces: completed Phase 2 base-config checklist item

- [ ] **Step 1: Run the complete verification set once**

Run:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run build
npx prisma validate
npx prisma migrate status
git diff --check
```

Expected: all commands exit `0`; migration status reports the database is up to date.

- [ ] **Step 2: Review scope**

Confirm the diff contains no register/login pages, logout UI, auth middleware, social
providers, or unrelated refactors.

- [ ] **Step 3: Mark only the base-config item complete**

Update:

```markdown
- [x] Integrate Better-Auth base config (`lib/auth.ts`)
```

Leave all later Phase 2 tasks unchecked.

- [ ] **Step 4: Add the final changelog entry**

Append:

```markdown
- Configured Better-Auth email/password authentication with Prisma-backed sessions
  and the Next.js auth route.
```

Suggested commit message for the user:

```text
docs(task): mark Better-Auth base integration complete
```
