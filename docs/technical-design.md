# MusicianSearch — Technical Design (Phase 2)

Builds on `requirements.md`, `tech-stack.md`, and `revenue-model.md`. Covers the pieces those docs left open: data model, auth/verification flow, messaging architecture, search implementation, and deployment.

## 1. Data Model

Postgres + PostGIS, managed via **Prisma ORM 7.10.0** (pinned deliberately below the `latest`/`next` npm dist-tags, which currently point to a Prisma 8 pre-release tied to Prisma's own cloud "Developer Platform" — a different product direction than a plain self-hosted Postgres setup). Prisma 7 changed its architecture from earlier versions: connection config lives in `prisma.config.ts` (not a `url` field in `schema.prisma`), the client generates into `src/generated/prisma` (gitignored, regenerated via `prisma generate`, wired to `postinstall`), and `PrismaClient` requires an explicit driver adapter (`@prisma/adapter-pg` + `pg`) rather than an implicit connection string. See `src/lib/prisma.ts` for the instantiation pattern.

Core tables:

```
users
  id, email, phone, phone_verified_at, password_hash (or magic-link only, no password),
  identity_verified_at, stripe_identity_session_id,
  subscription_tier ('free' | 'paid'), stripe_customer_id, stripe_subscription_id,
  status ('active' | 'suspended' | 'banned'), created_at

profiles
  id, user_id (fk), display_name, bio,
  location geography(Point, 4326),   -- PostGIS point, city/region precision only
  location_label (e.g. "Brooklyn, NY"),  -- shown publicly; never a precise address
  skill_level ('beginner'|'intermediate'|'advanced'|'professional'),
  looking_for text[] ('band_member'|'accompanist'|'jam_partner'),
  avatar_url, sample_media_urls text[], external_links text[],
  created_at, updated_at

instruments            -- reference table: Guitar, Piano, Voice, Drums, ...
genres                 -- reference table: Jazz, Classical, Rock, ...

profile_instruments (profile_id, instrument_id)
profile_genres (profile_id, genre_id)

availability_slots (profile_id, day_of_week, time_of_day)  -- e.g. Sat/evening

conversations
  id, created_at
conversation_participants (conversation_id, user_id)
messages
  id, conversation_id, sender_id, body, created_at, read_at

reports
  id, reporter_id, reported_user_id, reported_message_id (nullable),
  reason, status ('open'|'reviewed'|'actioned'), created_at

disclaimer_acceptances
  id, user_id, disclaimer_version, accepted_at   -- audit trail for the safety disclaimer
```

Indexes: GIST index on `profiles.location` for geo-radius queries; trigram (`pg_trgm`) index on `profiles.bio`/`display_name` for fuzzy text search; standard indexes on `profile_instruments`/`profile_genres` join columns.

## 2. Auth & Verification Flow

1. **Signup:** email + phone number. Send SMS OTP (via Twilio, or an equivalent SMS API — not yet chosen, low-stakes/reversible pick, default to Twilio unless you'd rather use something else) to verify phone control.
2. **Session:** magic-link email or OTP-based login — no password storage needed, reduces attack surface. (Can add password later if desired.)
3. **Identity verification:** after phone verification, user is prompted to complete a **Stripe Identity** verification session (ID + selfie/liveness). Stripe webhook (`identity.verification_session.verified`) sets `identity_verified_at` on the user record. No raw ID document data is ever stored by the app.
4. **Gating:** until `identity_verified_at` is set, the user can create/edit a profile but cannot appear in search results or send/receive messages. This is enforced server-side on the relevant API routes, not just hidden in the UI.
5. **Disclaimer:** the safety disclaimer (meeting-people-from-the-internet risk) must be accepted (logged to `disclaimer_acceptances`) before verification can proceed, and is re-surfaced the first time a user shares contact info or agrees to meet in a conversation.

## 3. Messaging Architecture

- **Persistence:** all messages stored in Postgres (`messages` table) — this is the source of truth, not just Socket.io in-memory state.
- **Real-time delivery:** Socket.io, one room per `conversation_id`. On connect, a user's client joins rooms for all their active conversations. New messages are written to Postgres first, then broadcast to the room.
- **REST API:** conversation list, conversation history (paginated), and starting a new conversation are plain Next.js API routes; Socket.io is only for live delivery/typing indicators/read receipts, not for fetching history.
- **Enforcement:** free-tier message/conversation caps (per `revenue-model.md`) are checked server-side when a new conversation is created, not client-side.
- **Contact-info sharing:** no special "share contact" UI element — if users want to exchange contact info, they type it in a message like any other; the platform does not auto-detect or facilitate this, keeping it a deliberate user action (per `requirements.md`).

## 4. Search Implementation

- **Geo-radius search:** PostGIS `ST_DWithin` query against `profiles.location`, parameterized by the searching user's location and a radius filter (e.g. 10/25/50 miles).
- **Attribute filters:** instrument, genre, skill level, "looking for" type, availability — standard indexed joins/`WHERE` clauses against the reference and join tables.
- **Fuzzy text search:** Postgres trigram similarity (`pg_trgm`) over bio/display name for free-text search terms, combined with the structured filters above.
- **Free vs. paid tier:** free tier query is capped (e.g. limited result count, basic filters only); paid tier query allows the full filter set and larger/unlimited result pages. A `boosted` flag or `boost_expires_at` column on `profiles` (paid-tier perk) adds a sort-order bump in results — no separate ranking infra needed at this scale.

## 5. Deployment Architecture (Ionos VPS)

- **Docker Compose** on the VPS with two services to start:
  - `app`: Next.js server (also hosts the Socket.io server in the same Node process, since traffic scale doesn't yet justify splitting them out).
  - `db`: `postgis/postgis` Docker image (Postgres + PostGIS bundled).
- **Reverse proxy / TLS:** nginx (existing setup on the VPS, reused for consistency with other apps) — add a new server block proxying to the `app` container's port, with Let's Encrypt/Certbot for TLS if not already automated.
- **Secrets:** Stripe API keys, SMS provider keys, DB credentials via a `.env` file outside version control (or the VPS's existing secrets approach, if any).
- **Backups:** scheduled `pg_dump` of the Postgres volume — needed given this holds identity-verification status and user data (not the ID documents themselves, those stay with Stripe).

## Open Items

- Exact free-tier numeric caps (search results/month, messages/month) — still open per `revenue-model.md`.

## SMS/OTP Provider: Twilio (confirmed)

Twilio Verify API, used for phone-number OTP at signup (see Section 2). Development note: Twilio's free trial (30-day expiry, capped at 25 calls/day, 35 SMS/day, 100 calls+SMS/month via Verify API) can only send codes to phone numbers manually pre-verified in the Twilio console — fine for building/testing with your own number, but a paid Twilio account is required before onboarding any real users outside that verified list. Cost after upgrading is pay-per-verification (a few cents each), no fixed monthly fee.

## Phase 3 Progress: Scaffold Complete

Done (2026-08-30):
- Next.js 16 + TypeScript + Tailwind v4 project scaffolded at the project root, alongside `docs/`.
- shadcn/ui initialized (`components.json`, `src/components/ui/`, `src/lib/utils.ts`).
- Framer Motion, Socket.io (server + client), Stripe SDK, Twilio SDK, Prisma installed.
- `prisma/schema.prisma` written covering all tables in Section 1; `npx prisma generate` verified working.
- `docker-compose.yml` (app + `postgis/postgis` db service, app bound to `127.0.0.1:3000` only) and a multi-stage `Dockerfile` (Next.js `output: "standalone"`).
- `deploy/nginx.conf.example` — reference reverse-proxy config for the existing nginx setup on the Ionos VPS, including the `Upgrade`/`Connection` headers Socket.io's websocket transport needs.
- `.env.example` covering DB, Stripe, Twilio, and app secrets.
- Placeholder home page wired to shadcn/ui + Framer Motion; `npm run build`, `npm run lint`, and `npm run dev` all verified working.

Also done (2026-08-30, continued):
- Git initialized, committed, and pushed to `origin` (https://github.com/polyphonica/musiciansearch.git).
- **Local dev database:** this machine already runs several other Postgres instances (EDB installs for other projects, a Homebrew `postgresql@15`), so a dedicated, isolated instance was set up rather than reusing any of them: Homebrew `postgresql@17` (matches the PostGIS build target) on **port 5544** (5432 was already taken), with PostGIS 3.6 enabled directly in the `musiciansearch` database. Homebrew's `postgis` formula doesn't auto-link its extension files into a same-time-installed `postgresql@17` keg — they were copied manually from `postgis`'s Cellar share/lib dirs into `postgresql@17`'s own share/lib dirs once. `.env`'s `DATABASE_URL` points at this instance for local dev; `docker-compose.yml`'s `db` service (port 5432 internally) is what production/VPS deployment actually uses.
- First migration applied: `npx prisma migrate dev --name init` — all 13 model tables plus PostGIS's `spatial_ref_sys` confirmed present.
- **Node version gotcha:** this machine had a stray Node 21.5.0 at `/usr/local/bin/node` (ahead of Homebrew's bin in PATH in some shell contexts), which crashes Prisma's CLI (`util.styleText` missing). Fixed by `brew install node` (now v26.8.1, at `/opt/homebrew/bin/node`, earlier in PATH). If Prisma CLI commands mysteriously crash again, check `node -v` first.

Not done yet (still ahead in Phase 3):
- No actual signup/auth/verification/search/messaging pages or API routes — only the data model and a placeholder landing page exist so far.
