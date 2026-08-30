# MusicianSearch

A web app for musicians to find bandmates, accompanists, and jam partners — see `docs/requirements.md`, `docs/tech-stack.md`, and `docs/technical-design.md` for the full product and technical design.

## Stack

Next.js (App Router) + Tailwind CSS + shadcn/ui + Framer Motion, Prisma (PostgreSQL + PostGIS via `@prisma/adapter-pg`), Socket.io, Stripe (Identity + Billing), Twilio Verify. Self-hosted on a VPS behind nginx — see `deploy/nginx.conf.example` and `docker-compose.yml`.

## Local Development

```bash
cp .env.example .env   # fill in real values as you wire up each service
npm install             # also runs `prisma generate` via postinstall
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

A local Postgres with PostGIS is required for anything that touches the database — either run one directly, or bring up just the `db` service from `docker-compose.yml` (`docker compose up db`) and point `DATABASE_URL` at `localhost`.

## Database

Schema lives in `prisma/schema.prisma`. Prisma 7 generates the client into `src/generated/prisma` (gitignored, regenerated via `prisma generate`/`postinstall`) and requires a driver adapter — see `src/lib/prisma.ts`. Connection config is in `prisma.config.ts`, not the schema file.

Once a local/dev database is reachable:

```bash
npx prisma migrate dev --name init
```

## Production Deployment

```bash
docker compose up -d --build
```

Then point nginx at the `app` container per `deploy/nginx.conf.example`. Secrets (Stripe keys, Twilio credentials, DB password) go in a `.env` file on the VPS, not committed to git.
