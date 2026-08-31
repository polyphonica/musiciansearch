# MusicianSearch — Technology Stack

Locked in 2026-08-30.

## Frontend
- **Next.js** (React + TypeScript). Next.js is built on top of React, adding routing, server-side rendering, and API routes.

## Styling / Design System
- **Tailwind CSS** — utility-first CSS.
- **shadcn/ui** — accessible, customizable component primitives built on Tailwind + Radix, copied into the codebase (owned, not an opaque dependency).
- **Framer Motion** — animations and micro-interactions.

Chosen deliberately over a more "templated" opinionated UI kit (e.g. Chakra UI, Mantine) because the priority is strong design control and a modern, fun-to-use feel rather than a generic look. Tradeoff: more design effort required to make it look good — Tailwind removes friction but doesn't supply polish by default.

## Hosting
- Self-hosted on the user's existing **Ionos VPS** (already running other apps there) rather than managed platforms like Vercel/Supabase.
- Next.js runs as a Node.js server behind the existing reverse proxy (nginx/Caddy).

## Database
- **PostgreSQL** with the **PostGIS** extension, self-hosted on the same VPS.
- PostGIS provides native geo-radius search for location-based musician search, without a separate search service.
- **ORM: Prisma 7.10.0** (pinned — the `latest` npm tag currently resolves to a Prisma 8 pre-release built around Prisma's own cloud platform, not appropriate for this self-hosted setup). Requires a driver adapter (`@prisma/adapter-pg`) and a `prisma.config.ts` for connection config; see `docs/technical-design.md` Section 1 and `src/lib/prisma.ts`.

## Geolocation for Search

- **No external geocoding API for now** (decided 2026-08-31) — instead, a private postal/ZIP code is resolved against a small, self-hosted `PostalCodeLocation` lookup table seeded with ~120 hand-curated UK outward-code and US ZIP centroids. Avoids a new vendor account entirely for the MVP; see `docs/technical-design.md` for the coverage caveats (UK+US only, approximate, not authoritative) and how it plugs into PostGIS radius search.
- **If broader/international coverage is needed later**: Mapbox is the recommended upgrade (100k free requests/month, no card required, $0.75/1k beyond that) over OpenCage (2.5k/day free) or LocationIQ (5k/day free) — Google Geocoding was ruled out as requiring a billing account even for its free tier, the same friction pattern as Twilio.

## Real-Time Messaging
- **Socket.io** (Node library), run alongside the Next.js app on the VPS.
- Chosen over a hosted realtime SaaS given the self-hosting direction.

## Identity Verification & Billing
- **Stripe Identity** — government-ID + selfie/liveness verification.
- **Stripe Billing** — freemium subscription management.
- Kept as external SaaS regardless of hosting choice: identity verification and payment handling carry compliance/PCI burden not worth taking in-house, whereas the app server and database are ordinary infra the user already operates.

## Rationale Summary

Self-host the app and database on infrastructure the user already knows how to run; keep the two safety/compliance-critical flows (identity verification, billing) on a dedicated vendor (Stripe) rather than building or self-hosting equivalents.

See also: `requirements.md`, `revenue-model.md`.
