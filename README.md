# TaskFlow — SaaS Task Manager

A multi-tenant Kanban-style task management app. Built as a portfolio project to
demonstrate a modern fullstack TypeScript stack.

See [`PRD.md`](./PRD.md) for product scope and database schema, [`AGENTS.md`](./AGENTS.md)
for technical architecture, and [`DESIGN.md`](./DESIGN.md) for the visual design
system.

## Tech Stack
Next.js · TypeScript · PostgreSQL · Prisma · Tailwind CSS · Better-Auth ·
Cloudflare R2 · Resend · Docker

## Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm

## Getting Started

### 1. Clone & install
```bash
git clone <repo-url>
cd taskflow
npm install
```

### 2. Environment variables
Copy the example file and fill in the values:
```bash
cp .env.example .env
```

| Variable              | Description                                  |
|------------------------|-----------------------------------------------|
| `DATABASE_URL`         | Postgres connection string                    |
| `AUTH_SECRET`          | Random secret for session signing             |
| `R2_ACCOUNT_ID`        | Cloudflare R2 account ID                      |
| `R2_ACCESS_KEY_ID`     | R2 access key                                 |
| `R2_SECRET_ACCESS_KEY` | R2 secret key                                 |
| `R2_BUCKET_NAME`       | R2 bucket name for attachments                |
| `RESEND_API_KEY`       | Resend API key for transactional email        |

### 3. Start the database (Docker)
```bash
docker compose up -d db
```

### 4. Run migrations
```bash
npx prisma migrate dev
```

### 5. Start the dev server
```bash
npm run dev
```
App runs at `http://localhost:3000`.

## Running the Full Stack via Docker
```bash
docker compose up --build
```

## Scripts
```bash
npm run dev          # start dev server
npm run build         # production build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run test            # unit tests (vitest)
npm run test:e2e        # E2E tests (playwright)
```

## Project Docs
- [`PRD.md`](./PRD.md) — product requirements
- [`DESIGN.md`](./DESIGN.md) — visual design system (colors, typography, components)
- [`TASK.md`](./TASK.md) — task breakdown & progress
- [`AGENTS.md`](./AGENTS.md) — AI agent working rules
- [`CONVENTIONS.md`](./CONVENTIONS.md) — code style guide
- [`CHANGELOG.md`](./CHANGELOG.md) — change history

## License
Personal portfolio project — no license applied yet.
