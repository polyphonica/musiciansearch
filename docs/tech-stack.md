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
