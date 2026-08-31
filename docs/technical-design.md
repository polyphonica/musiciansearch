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

## Phase 3 Progress: Signup / OTP / Disclaimer / Stripe Identity Flow (2026-08-30)

Built the full account-creation flow end to end:
- `/signup` → `POST /api/auth/signup`: collects email + phone, upserts a `User` row, sends a Twilio Verify SMS code.
- `/verify` → `POST /api/auth/verify-otp`: checks the code via Twilio Verify, sets `phoneVerifiedAt`, and creates a session (see below).
- `/disclaimer` → `POST /api/disclaimer/accept`: shows the safety disclaimer from `requirements.md` and records acceptance in `DisclaimerAcceptance`, gated on phone verification.
- `/verify-identity` → `POST /api/identity/start`: creates a Stripe Identity `VerificationSession` (document + selfie), gated on phone verification and disclaimer acceptance, then redirects to Stripe's hosted verification page (`session.url`).
- `/verify-identity/return`: landing page after the Stripe-hosted flow; actual confirmation happens asynchronously via webhook.
- `POST /api/webhooks/stripe`: verifies the Stripe signature and sets `identityVerifiedAt` on `identity.verification_session.verified`.
- `GET /api/auth/me`: returns the current session's verification/disclaimer status for client-side gating.

**Session handling (simplification from the original plan):** rather than building both a phone-OTP flow and a separate magic-link email login, phone OTP now serves as both signup verification and the ongoing login mechanism — one fewer moving part for the MVP. Sessions are a simple HMAC-signed httpOnly cookie (`src/lib/session.ts`, `SESSION_SECRET`), not a JWT library or database-backed session table; revisit if session revocation/multi-device management becomes a real requirement.

**Implementation gotcha:** `new Stripe(process.env.STRIPE_SECRET_KEY)` and `twilio(sid, token)` both throw immediately if their credentials are empty/invalid — which happens during `next build`'s route-collection step (before any request is ever made), not just at runtime. Both `src/lib/stripe.ts` and `src/lib/twilio.ts` now lazily construct their client behind a `Proxy` so the build succeeds with empty `.env` credentials; the real client is only created on first actual use inside a request handler.

**Not yet tested against real Twilio/Stripe accounts** — this machine has no Twilio or Stripe credentials configured. The full request path was verified up to (and including) the external API call: input validation, Prisma upserts, and error handling all confirmed working via curl against the dev server; the pages render and build/lint pass. Once real `TWILIO_ACCOUNT_SID`/`AUTH_TOKEN`/`VERIFY_SERVICE_SID` and `STRIPE_SECRET_KEY`/`WEBHOOK_SECRET` are added to `.env`, the OTP send/check and the Stripe-hosted verification redirect need a real browser click-through to confirm end to end (the webhook also needs either the Stripe CLI's `stripe listen --forward-to` for local testing, or a deployed endpoint).

## Dev-only mock for Stripe Identity (2026-08-30)

Rather than requiring real Stripe keys before building anything downstream of identity verification, `POST /api/identity/start` can bypass the real Stripe call entirely via `MOCK_IDENTITY_VERIFICATION=true` in `.env`:
- `src/lib/config.ts`'s `isMockIdentityEnabled()` gates on **both** the env flag **and** `NODE_ENV !== "production"` — `next build`/`next start` force `NODE_ENV=production` regardless of the flag, so this cannot activate in a production deploy even if the flag leaks into a prod `.env` by mistake.
- When active, `/api/identity/start` skips Stripe, stores a `mock_...`-prefixed fake session id, and returns `/verify-identity/mock` instead of a real Stripe hosted URL.
- `/verify-identity/mock` (a clearly-labeled, dashed-border, dev-only page) and `POST /api/identity/mock-complete` simulate the hosted verification + webhook: the latter checks the mock flag again server-side and 404s if it's off, so the route is inert outside development regardless of what a client requests.
- Verified end-to-end (2026-08-30): a phone-verified test user, driven via a manually-signed session cookie over curl (no real Twilio/Stripe credentials involved), went disclaimer → mock start → mock page (200) → mock-complete → `identityVerifiedAt` set. Confirmed the mock page and mock-complete both 404 when the flag is off.
- **To go live with real Stripe Identity later:** set `MOCK_IDENTITY_VERIFICATION=false` (or remove it) and configure `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` — no other code changes needed, since `/api/identity/start` already falls through to the real Stripe path when the mock is off.

## Dev-only mock for Twilio OTP (2026-08-30)

Twilio requires upgrading off the free trial (adding a payment method) before provisioning a Verify service under its "Identity & Security" product category, on this account at least. Rather than requiring that upgrade before continuing, the same mock pattern used for Stripe Identity was applied to phone OTP:
- `MOCK_OTP_VERIFICATION=true` in `.env`, gated by `isMockOtpEnabled()` in `src/lib/config.ts` — same double gate (env flag **and** `NODE_ENV !== "production"`) as the identity mock, for the same reason: cannot activate in a production build/deploy even if the flag leaks into a prod `.env`.
- When active, `POST /api/auth/signup` skips the real Twilio `verifications.create` call and just logs the fixed test code to the server console; `POST /api/auth/verify-otp` skips the real Twilio `verificationChecks.create` call and compares directly against that fixed code (`MOCK_OTP_CODE = "123456"` in `src/lib/config.ts`) instead.
- `/verify` shows a clearly-labeled dev-only banner with the code when the mock is active (checked server-side in `src/app/verify/page.tsx`, passed into the client form).
- Verified end-to-end (2026-08-30) via real API calls (no manual DB rows needed this time, unlike the identity mock test): signup → verify-otp with `123456` → disclaimer accept → identity mock start → identity mock-complete, all the way to `{"phoneVerified":true,"disclaimerAccepted":true,"identityVerified":true}`. Also confirmed an incorrect code (`000000`) is correctly rejected even in mock mode.
- **To go live with real Twilio later:** set `MOCK_OTP_VERIFICATION=false` (or remove it), upgrade the Twilio account off trial, and configure `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_VERIFY_SERVICE_SID` — no other code changes needed.

Both `.env` credentials that ARE configured now: `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` (from the user's real Twilio account). `TWILIO_VERIFY_SERVICE_SID` is still blank — a Verify Service couldn't be provisioned without upgrading off trial, which is deferred per the mock above.

## Phase 3 Progress: Profile Creation + Admin-Editable Reference Lists (2026-08-31)

**Schema changes** (migration `20260831084428_add_admin_qualifications_voice_types`, applied after a `prisma migrate reset` needed to fix a real gap — see below):
- `User.isAdmin` (boolean, default false) — the only role distinction in the system so far.
- `Profile.qualifications` (free text, separate from `bio`) — bio is general "about me," qualifications is credentials/experience (ABRSM grades, diplomas, degrees). Deliberately free text, not structured, since it's a trust signal rather than a primary search filter.
- `VoiceType` + `ProfileVoiceType` — mirrors the existing `Instrument`/`Genre` reference-table pattern exactly, rather than a hardcoded enum, specifically so it's admin-editable (see below). "Voice" is also just one entry in the `Instrument` list, so vocalists appear in general instrument search too; voice type is a second, separate multi-select shown only when "Voice" is selected.

**Fixed a real migration bug found along the way:** the original `init` migration never contained `CREATE EXTENSION postgis` — PostGIS had only been enabled manually via a one-off `psql` command outside migration history. This meant replaying migrations from scratch (which `prisma migrate dev`'s shadow-database step does every time, and which a fresh production deploy would also do) failed with `type "geography" does not exist`. Fixed by adding `CREATE EXTENSION IF NOT EXISTS postgis;` to the top of the init migration file and running `prisma migrate reset` (local dev DB only, explicitly confirmed with the user first since Prisma's own CLI safety check — and this session's tool permissions — both required it; the user ran the reset command directly since the harness's own classifier blocked running it as an agent action even with consent).

**Admin bootstrap:** `ADMIN_PHONE_NUMBERS` in `.env` (comma-separated E.164 numbers) — checked in `POST /api/auth/signup`; a matching phone gets `isAdmin: true` on signup/upsert. `src/lib/auth.ts`'s `requireAdmin()` gates admin routes/pages.

**Admin CRUD** (`src/lib/taxonomy.ts` — one shared generic implementation, since instruments/genres/voice-types are structurally identical, wired to three thin `route.ts` files each):
- `GET /api/admin/{instruments,genres,voice-types}` — public, no auth required (harmless reference data, and the profile form needs to read these as any logged-in user).
- `POST` (create) / `PATCH .../[id]` (rename) / `DELETE .../[id]` — all require `requireAdmin()`, return 403 otherwise.
- `/admin` page (`notFound()` for non-admins, not just a redirect, to avoid revealing the page exists) with a reusable `<TaxonomyEditor>` client component per list — list, inline-rename-on-blur, add, remove.
- Verified end-to-end via curl with separate admin and non-admin test sessions: admin can create/rename/delete, non-admin gets 403, `/admin` page is 404 for both non-admins and unauthenticated requests.

**Profile creation** (`GET`/`POST /api/profile`, `/profile` page):
- Gated on having a session only (any phone-verified user) — per `requirements.md`, profile creation itself doesn't require full identity verification or disclaimer acceptance, only search-appearance and messaging will (once those are built).
- `POST /api/profile` is a single Prisma `$transaction`: upserts the scalar `Profile` fields, then `deleteMany`+`createMany` on each join table (instruments, genres, voice types) and on `AvailabilitySlot` to sync the full multi-select state in one request, rather than diffing.
- The form fetches its reference lists from the already-public `/api/admin/*` GET endpoints (reusing them rather than duplicating), plus the user's existing profile from `GET /api/profile` to prefill on edit.
- Voice-type checkboxes only render (client-side) when "Voice" is among the selected instruments, matching the requirements-doc design.
- Availability is a 7-day × 3-time-of-day checkbox grid, stored as rows in `AvailabilitySlot`.
- Verified end-to-end via curl: signed up a test user (mock OTP), fetched real instrument/genre/voice-type ids from the seeded lists, POSTed a full profile (multi-instrument incl. Voice, one voice type, one genre, two availability slots), and confirmed `GET /api/profile` round-trips everything correctly. Also confirmed the `/profile` page itself redirects unauthenticated visitors to `/signup` (307) and renders (200) for a logged-in user.

**Implementation note (ESLint):** `eslint-plugin-react-hooks` 7.x's `set-state-in-effect` rule flags calling a named async function (that internally calls `setState`) from inside a `useEffect` body, even fire-and-forget — a stricter check than earlier versions. Fetch-on-mount effects in this codebase use a `.then()` promise chain directly in the effect body instead of an intermediate async function, which the rule accepts (see `src/app/admin/taxonomy-editor.tsx` and `src/app/profile/profile-form.tsx`).

## Phase 3 Progress: "Looking For" Became a 4th Admin-Editable Taxonomy (2026-08-31)

After trying profile creation, the operator found the original fixed `LookingFor` enum (`band_member`/`accompanist`/`jam_partner`) too limited — it had no good option for "an amateur wanting an occasional duet partner of similar standard," which "jam partner" doesn't capture. Given the admin-editable pattern already built for instruments/genres/voice-types, the fix was to convert `LookingFor` from a hardcoded enum to the same pattern rather than just adding one more hardcoded value:

- **Removed** the `LookingFor` enum and `Profile.lookingFor LookingFor[]` column.
- **Added** `LookingForOption`/`ProfileLookingFor` (reference table + join table, identical shape to Instrument/Genre/VoiceType), plus `Profile.lookingForOther` (free text).
- **`GET`/`POST`/`PATCH`/`DELETE /api/admin/looking-for[/[id]]`** — reuses the same `src/lib/taxonomy.ts` generic CRUD as the other three lists; `/admin` now has a 4th `<TaxonomyEditor>` section.
- **Seeded list** (`prisma/seed.ts`): Band/ensemble member, Accompanist, Duet/occasional playing partner (the specific gap that prompted this), Jam partner, Sight-reading group, **Other**.
- **"Other" convention:** one seeded row is literally named "Other" — the profile form matches on that exact name (`OTHER_OPTION_NAME` in `src/app/profile/profile-form.tsx`) to conditionally reveal a free-text textarea bound to `Profile.lookingForOther`. This is the same name-matching convention already used for "Voice" triggering the voice-type section — fragile in the sense that renaming "Other" via `/admin` silently breaks the free-text reveal (the admin page shows a note about this), but consistent with the existing pattern rather than introducing a new `isSpecial` flag for a single case.
- Verified end-to-end via curl: seeded list fetched correctly, a profile saved with "Duet / occasional playing partner" + "Other" (with free text) round-trips correctly through `GET /api/profile`, and non-admin write access to the new endpoint correctly 403s.

## Phase 3 Progress: Public Profile View + Search (2026-08-31)

- **`GET /api/musicians`** — public (no auth required), filters by `instrumentId`/`genreId`/`voiceTypeId`/`lookingForOptionId`/`skillLevel`/free-text `q` (name/bio, case-insensitive), paginated (20/page). Only returns profiles whose `User.identityVerifiedAt` is set and `status = active` — enforced in the `where` clause, not just hidden client-side, so an unverified profile cannot appear in results no matter how it's queried.
- **`/musicians`** page — client-side filtered browsing (reuses the same `/api/admin/*` reference-list endpoints the profile form uses), re-fetches on every filter change, "Load more" pagination.
- **`/musicians/[id]`** — public detail page (server component, direct Prisma query), same verified+active gate as the listing (`notFound()` otherwise, so a guessed/shared link to an unverified profile 404s rather than leaking it). Shows every public profile field from `requirements.md` (bio, qualifications, skill level, instruments, voice types, genres, looking-for + "Other" free text, availability, external links) plus a "Verified" badge. No contact info rendered — there's none to render, since `Profile` never stores it.
- **No location-radius filtering yet** — `locationLabel` is shown as plain text in results, but there's no real geocoding behind it (see the open item below), so search can't filter by distance yet, only by the structured tag fields.
- **No free/paid tier enforcement on search** (e.g. capped results or advanced filters per `revenue-model.md`) — deferred until Stripe Billing is actually wired up; building tier gating against a subscription system that doesn't exist yet would be premature.
- Verified end-to-end via curl: a freshly-signed-up, not-yet-identity-verified profile correctly does **not** appear in `/api/musicians` results; after completing the mock disclaimer+identity flow it appears, is correctly included/excluded by instrument filtering, and its detail page renders with the verified badge.

## Test Data: Fake Musicians for Local Search Testing (2026-08-31)

`prisma/seed-test-musicians.ts` (run via `npm run db:seed-test-musicians`) creates ~24 fake, fully-verified musician accounts + profiles with randomized instruments/genres/voice-types/looking-for selections drawn from whatever's actually in the reference tables at the time it runs — so it stays valid even after the lists are edited via `/admin`. Deliberately kept **separate** from `prisma/seed.ts` (the reference-list seed wired into `migrations.seed`), since that one is meant to be safe to run in any environment including production, and fake user accounts must never end up there.

- Refuses to run if `NODE_ENV=production`, same convention as the mock-identity/mock-otp flags.
- Idempotent: deletes everything under the `@test.musiciansearch.invalid` email domain first, then recreates a fresh batch — safe to re-run.
- **Gotcha hit while building it:** unlike `prisma/seed.ts` (which is spawned by the Prisma CLI as a subprocess and inherits `.env` already loaded by `prisma.config.ts`'s own `import "dotenv/config"`), this script is run directly via `tsx` through an npm script, bypassing the Prisma CLI entirely — so it needs its own `import "dotenv/config"` at the top, or `DATABASE_URL` is undefined and `pg` fails with a confusing `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` error that has nothing obviously to do with a missing env var.

## Phase 3 Progress: Radius Search via UK/US Postal Code Lookup (2026-08-31)

Rather than integrating a live geocoding API (Mapbox/OpenCage/LocationIQ were discussed and compared — see below), the user opted for a **no-external-API MVP approach**: a private postal/ZIP code resolved against a small, hand-curated, self-hosted lookup table.

- **`Profile.postalCode`** (new field) — the raw postal/ZIP code the user enters. Private: never included in any public serialization (`/api/musicians`, `/musicians/[id]`) — both of those use explicit `select` lists that simply don't name the field, and the detail page was tightened from `include` to `select` specifically so a sensitive field can't leak just by existing on the model in future.
- **`PostalCodeLocation`** (new reference table: `country`, `code`, `lat`, `lng`, unique on `[country, code]`) — seeded in `prisma/seed.ts` (safe for any environment, like the other reference lists) with **120 hand-curated entries**: UK outward codes (e.g. "SW1A", "OX1") and US 5-digit ZIPs for major cities. **This is explicitly an MVP starter set, not a comprehensive or authoritative dataset** — coordinates are approximate (city/district-level, which is a privacy feature, not a bug) and hand-typed from general knowledge, not verified against an official source. Expanding real coverage later means either importing a proper open dataset (UK Code-Point Open, US Census ZCTA Gazetteer) or switching to a live geocoding API for international coverage.
- **`src/lib/geo.ts`**: `normalizePostalCode()` distinguishes US ZIPs (5 digits) from UK postcodes (extracts the outward code from a full postcode like "OX1 2JD" → "OX1"); `resolvePostalCode()` looks up the normalized code in `PostalCodeLocation`.
- **On profile save** (`POST /api/profile`): resolves `postalCode` to lat/lng before the transaction, then sets `Profile.location` via a raw `UPDATE ... SET location = ST_SetSRID(ST_MakePoint(...), 4326)::geography` inside the same transaction as everything else — Prisma can't write an `Unsupported` column through its normal `data` object. If resolution fails, the profile still saves (per the agreed graceful-degradation behavior) and the response includes `locationResolved: false` so the form can show a note explaining the profile won't appear in distance search yet.
- **On search** (`GET /api/musicians`): new `near` (postal code) + `radiusMiles` (1-500, default 25) params. Resolves `near` the same way, then runs a small raw `ST_DWithin` query to get matching profile IDs, which feed into the existing Prisma `where` clause via `id: { in: [...] }` — the rest of the filtering logic (instrument/genre/etc.) is untouched. If `near` doesn't resolve, the radius filter is silently skipped (all other filters still apply) and `nearResolved: false` is returned so the UI can say so rather than showing a confusingly empty or unfiltered result set with no explanation.
- Verified end-to-end: a profile saved with a full UK postcode ("OX1 2JD") correctly resolved to Oxford's coordinates; searching near Oxford within 10mi found it, near London within 10mi did not (~55mi away), near London within 100mi did, and searching near an unresolvable string ("Neverland") correctly fell back to unfiltered results with `nearResolved: false`.

**Provider comparison for later** (in case international coverage is needed before this gets replaced): Mapbox (100k free requests/month, no card required, $0.75/1k beyond) was the recommendation over OpenCage (2.5k/day free, cheaper at scale) and LocationIQ (5k/day free) — Google was ruled out as requiring a billing account even for its free tier, the same friction pattern hit with Twilio.

## Design Pass: "Concert Program" Theme (2026-08-31)

The app had shipped with shadcn's stock zero-chroma gray theme and default Geist fonts — despite `tech-stack.md` naming Tailwind/shadcn/Framer Motion as the stack back in Phase 2, no actual design work had happened. The user flagged it as "too small, not enough contrast and boring," which was accurate.

- **Fonts:** Fraunces (display, variable SOFT/WONK/opsz axes) + Work Sans (body), via `next/font/google` in `src/app/layout.tsx`. `h1`-`h4` pick up Fraunces automatically via a `globals.css` base-layer rule.
- **Palette:** warm parchment/oxblood/brass "concert program" theme (full light+dark values in `globals.css`), plus a subtle dot-grid background texture.
- **Component scale increased at the primitive level** (`src/components/ui/button.tsx`, `input.tsx`, `textarea.tsx`) rather than per-usage — every button/input across the whole app got bigger from one change each.
- **Motion:** staggered entrance animations (home page hero, search results list) and hover-lift interactions, replacing the single generic fade-in each page had.
- **Real bug found:** `buttonVariants(...)` called directly (not wrapped in `cn()`) on a few `<Link>`s meant Tailwind's own stylesheet order, not className order, decided which of two conflicting classes won — silently making the "outline" button variant's border invisible regardless of what color was set. Fixed by always wrapping standalone `buttonVariants(...)` calls in `cn(...)`; `src/components/ui/button.tsx`'s own `Button` component already did this correctly, so it never showed there.
- See `docs/tech-stack.md` for the original stack decision this design pass finally executed on.

**Revised same day** — the user found this first pass ("concert programme": muted oxblood/brass on parchment) "bland... needs more colour," specifically calling out buttons and dropdowns. Pushed to a more vivid "concert poster" version: primary went from muted oxblood (`#7a2231`) to a saturated crimson (`#e63946`); added a genuinely new **teal** theme token (`--teal`, also reused as the `--input` border color so every text field/select gets a colored border); accent went from muted brass to vivid gold (`#f4a300`); `--secondary` became a teal-tinted pill instead of plain tan. Also discovered and fixed that the two native `<select>` dropdowns (in `musician-search.tsx`, `profile-form.tsx`) had been missed by the earlier component-size pass entirely, since they're raw `<select>` elements, not the shadcn `Input`/`Button` primitives — they needed their own explicit `h-11`/color/focus-ring treatment.

**Revised again same day** — user still disliked the parchment/tan *background* specifically, and found `/musicians/[id]` "decidedly unappealing" with text "too small and muted." Background/card/muted/border tokens moved off the tan family entirely to a clean neutral near-white (`#f7f6f2` bg, `#ffffff` cards) — accents now carry all the color, not the page itself. `/musicians/[id]` rewritten with a colored initials avatar, a prominent gold Verified badge, one card wrapping all sections with divider lines, and colored tag pills for instruments/voice/genres/looking-for (teal/gold/crimson respectively) instead of comma-joined text. Body content switched from `text-muted-foreground` to full-contrast `text-foreground text-base` — muted gray is now reserved only for genuinely secondary text.

## Phase 3 Progress: Navigation + Sign-out (2026-08-31)

Discussed and built persistent navigation, which hadn't existed at all — pages were standalone with no way to get from one to another except typing a URL, and there was no sign-out (a `clearSession()` helper existed in `src/lib/session.ts` but was never called from anywhere).

- **`src/components/nav-bar.tsx`** (client component) + **`src/app/layout.tsx`** (now an async Server Component that calls `getCurrentUser()` and passes `{ isAdmin } | null` down): logo always visible; "Browse musicians" + "Sign in" for anonymous visitors; "Browse musicians" + "My profile" + "Sign out" for logged-in users; "Admin" link additionally for admins. No separate login page/flow — the existing phone-OTP signup route already `upsert`s the user, so a returning user just re-enters their phone and gets a fresh code. The "Sign up" label was renamed to **"Sign in"** (and the `/signup` page copy updated to acknowledge returning users) once this was pointed out, since a literal "Sign up" button reads oddly to someone who already has an account even though the backend handles both cases identically.
- **`POST /api/auth/signout`** — new route, just calls `clearSession()`.
- **Nav is reduced to logo-only during the onboarding funnel** (`/signup`, `/verify`, `/disclaimer`, `/verify-identity` and its sub-pages) — deliberate, to avoid giving people an easy way to wander off mid-flow.
- **Architecture tradeoff, decided explicitly:** the nav needs to know the session server-side to avoid a logged-out flash on load, which means the root layout now does a DB lookup on every request — every page that was previously statically generated (home, signup, `/musicians`, etc.) is now server-rendered on demand instead. Accepted deliberately since this app is self-hosted on a single VPS with no CDN in front (per `tech-stack.md`), so the static-generation benefit wasn't real to begin with.
- **Fixed a knock-on layout bug:** several pages used `min-h-screen` to center their content, which — once nested under the new nav header — caused the total page height to exceed the viewport (header height + a full 100vh below it). Replaced with `flex-1` throughout so pages fill the remaining space below the nav via the flex chain (`body` → `main` → page), rather than an absolute viewport-height value.
- Verified end-to-end via browser: anonymous nav (Browse musicians + Sign in), logo-only nav during signup/verify/disclaimer/verify-identity, full nav after signing in (My profile + Admin, since the test account is an admin), and sign-out correctly clears the session and updates the nav immediately.

## Phase 3 Progress: Messaging (2026-08-31)

Built the full messaging system from `requirements.md`/Section 3 of this doc, with one deliberate scope cut from the original architecture: **no Socket.io real-time push yet**. Standing that up requires converting Next.js to a custom server (needed to attach a WebSocket server), which is a meaningfully larger infra change than the messaging feature itself. Shipped the full DB-backed system with lightweight client-side polling (every 4s while a thread is open) instead, and left real-time as a documented fast-follow — `resolvePostalCode`-style, the REST layer doesn't need to change when Socket.io is added later, only the delivery mechanism.

- **`canMessage(user)`** (`src/lib/auth.ts`) — messaging requires identity verification, same bar as appearing in search. Checked when *starting* a new conversation; continuing an existing one only requires being a participant (a user who later became unverified, if that ever becomes possible, could still reply in threads that already existed — not a real scenario today since there's no "un-verify" action).
- **`POST /api/conversations`** — starts a conversation (by recipient `profileId` + first message), or reuses an existing 1:1 conversation between the same two users if one already exists rather than creating duplicates. Validates the recipient is verified+active (can't message someone search wouldn't surface), and blocks messaging yourself.
- **`GET /api/conversations`** — inbox: each conversation's other-participant name, last message preview, and unread count (via a `groupBy` on unread messages).
- **`GET/POST /api/conversations/[id]/messages`** — thread history (newest 200, oldest-first) + send. `GET` also marks the other person's messages as read as a side effect of viewing the thread — a common, simple pattern, though worth knowing if a future "mark unread" feature is ever wanted.
- **`/messages`** (inbox) and **`/messages/[id]`** (thread, with the composer) pages, plus a `MessageComposer` embedded on `/musicians/[id]` that only renders for a verified, logged-in viewer looking at someone else's profile — anonymous visitors see "Sign in to message", logged-in-but-unverified users see "Complete identity verification to message", matching the access rules from the original nav discussion (anonymous/unverified can search and view, only verified users can message).
- Verified end-to-end via curl (two fully-verified test accounts: start conversation → appears in both inboxes with correct unread count → recipient reads thread → read count clears → recipient replies → sender sees it) and via a real browser session (composer → send → redirect to thread → inbox shows the preview). Also verified the gates: anonymous request → 401, phone-verified-but-not-identity-verified → 403, messaging yourself → 400, a non-participant reading someone else's thread → 404 (not revealing that the conversation exists at all).

## Bug Fix: Returning Verified Users Got Stuck on Re-login (2026-08-31)

Reported by the user: signing in again (an existing, already-verified account) walked through OTP → disclaimer → identity-verification as if it were a first-time signup, and got stuck at `/verify-identity` showing "Start identity verification" with no way forward — clicking it just returned the existing "Identity already verified" error from `/api/identity/start`, going nowhere.

**Root cause:** `/disclaimer` and `/verify-identity` were pure client components with no server-side check of whether the user had already completed that step — every login replayed the entire onboarding funnel regardless of actual account state. Confirmed via the affected account's own data: `identity_verified_at` was genuinely already set, and — a related bug — there were **7 duplicate `disclaimer_acceptances` rows**, because the accept endpoint had no idempotency guard and created a new row every time the page was revisited.

**Fix:** both pages became server components with a redirect cascade, each one checking its own completion condition and skipping forward:
- `/disclaimer`: redirects to `/signup` if not logged in, to `/verify-identity` if `hasAcceptedCurrentDisclaimer()` is already true, otherwise renders the form (moved to `disclaimer-form.tsx`).
- `/verify-identity`: redirects to `/signup` if not logged in, to `/disclaimer` if the disclaimer isn't accepted yet, to `/profile` if `identityVerifiedAt` is already set, otherwise renders the form (moved to `verify-identity-form.tsx`).
- `POST /api/disclaimer/accept` now checks `hasAcceptedCurrentDisclaimer()` before inserting, so it's idempotent — defense in depth for the (now much rarer) case where the endpoint is hit directly.
- Cleaned up the 6 duplicate rows on the affected real account (harmless — identical version records, kept the earliest).

Verified via curl: a fresh account taken through full verification, then a simulated "returning login" (fresh OTP cycle), correctly redirects `/disclaimer` → `/verify-identity` → `/profile` via 307s without ever showing either intermediate form; re-POSTing `/api/disclaimer/accept` for an already-accepted user no longer creates a duplicate row. Confirmed by the user against their own real account as well.

## Bug Fix: Nav Bar Stayed in "Signed Out" State After Signing In (2026-08-31)

Reported by the user: after signing in (an existing, already-verified account), `/profile` loaded correctly (proving the session was genuinely valid), but the nav bar still showed "Sign in" instead of "Sign out" — and since the nav is also where the "Messages" link lives, there was no way to reach the inbox either. Read by the user as "it is signing me out somehow", though the session itself was never actually cleared — this was a stale-display bug, not a real sign-out.

**Root cause:** the nav bar's logged-in/out state comes from the root layout (`src/app/layout.tsx`), which is a shared segment across all routes. Next.js's App Router does not re-fetch a shared layout's server data on an ordinary client-side navigation (`router.push`) — only `router.refresh()` (or a hard reload) invalidates that cache and forces a re-fetch. `handleSignOut` in `nav-bar.tsx` already called `router.refresh()` after clearing the session, which is why sign-*out* correctly updated the nav immediately — but nothing called it at the point of sign-*in* (`POST /api/auth/verify-otp` succeeding, in `src/app/verify/verify-form.tsx`), so the nav kept rendering with whatever `user` state the layout had on its very first mount that session (logged out).

**Fix:** added `router.refresh()` right before the post-verification `router.push("/disclaimer")` in `verify-form.tsx` — the same pattern already used for sign-out, applied symmetrically at the point session state is created. A tab that was already open and stale from before this fix needs one manual page reload to pick it up; new sign-ins going forward update the nav immediately.

## Phase 3 Progress: Report / Moderation Flow (2026-08-31)

Built the reporting + admin review flow from `requirements.md` ("Report/block functionality on every profile and conversation, with a moderation queue for review... suspend/ban accounts"). The `Report` model and `User.status` enum already existed from Phase 2 — no migration needed. Deliberately scoped to **report + review**, not **block** (a user-to-user block feature) — the user asked specifically for report/moderation, block wasn't requested and would be a separate, additive feature later.

- **`POST /api/reports`** — any logged-in user (not necessarily identity-verified — the bar for filing a report is lower than the bar for messaging, since you might want to report a suspicious profile before verifying yourself) can report a user, optionally pinned to a specific message. If a `reportedMessageId` is given, it's verified server-side that the message was actually sent by the reported user in a conversation the reporter is actually part of — prevents fabricating a report against an arbitrary message.
- **Filing a report has no automatic effect** — it only ever creates a queue entry. Real consequences require an admin action, avoiding a mass-reporting abuse vector.
- **`GET/PATCH /api/admin/reports[/[id]]`** — admin-only queue (filterable by status: open/reviewed/actioned), each entry showing the reporter, the reported user's current account status, the reason, and the reported message's content if applicable.
- **`PATCH /api/admin/users/[id]`** — admin-only account status change (active/suspended/banned), with a self-protection check (an admin can't change their own status). Since `/api/musicians` and `/musicians/[id]` already gate on `status === "active"`, suspending/banning here has **immediate, already-wired teeth** — no new enforcement code needed, confirmed by testing (a suspended user disappeared from search results instantly).
- **`ReportButton`** (`src/components/report-button.tsx`) — shared component used both on `/musicians/[id]` (report a whole profile) and inline under each of the other person's messages in `/messages/[id]` (report a specific message). A reason dropdown (5 categories, "Other" included) plus optional free-text details, combined into the single `Report.reason` string field rather than adding new schema for categorization that nothing else uses yet.
- **`/admin/reports`** — the review queue UI, linked from the main `/admin` page.
- Verified end-to-end via curl: filing a report, an admin reviewing it, suspending the account and confirming it immediately vanished from search, reactivating it, reporting a specific message, the admin queue showing that message's content, a non-admin correctly getting 403 on the queue endpoints, and a non-participant correctly getting a 404 (not a revealing error) when trying to fabricate a report against a message from a conversation they were never part of.
- **Incident during testing, self-inflicted and fixed:** while testing the admin queue, a curl test script reused the user's real admin phone number to sign in, which (since signup upserts by phone and always updates the email field) overwrote their real account's email with a test address. Caught immediately and restored via a direct `UPDATE`. Lesson: always use a dedicated test phone number for scripted testing, never a real configured admin number, even briefly.

Not done yet (still ahead in Phase 3):
- Real-time delivery (Socket.io) — currently 4-second polling while a thread is open; see above.
- Message pagination beyond the newest 200 per conversation, and a "typing…" indicator (both explicitly deferred alongside the Socket.io work, since they're naturally the same infra).
- Broader/international geocoding coverage — current approach is UK+US only, MVP-scale, approximate (see above). A live geocoding API remains the natural upgrade path when that's needed, without changing the surrounding architecture (`resolvePostalCode`'s call sites wouldn't need to change, just its implementation).
- Route-level gating middleware beyond what's been added ad hoc (`/profile` and `/admin` now redirect/404 appropriately; other pages like `/verify-identity` still don't redirect unauthenticated visitors).
- Real Twilio Verify Service and real Stripe Identity/Billing keys — both currently mocked (see above). The full flow has only been tested through the mocks, never through a real SMS or a real Stripe-hosted verification page.
