# MusicianSearch — Base Requirements

## Purpose & Vision

MusicianSearch helps musicians find each other for non-monetary musical collaboration:
- Forming bands or ensembles (matching by instrument, genre, skill level, availability, location)
- Finding accompanists (e.g. for recitals, auditions, rehearsals — unpaid/mutual arrangements)
- Finding people to jam or rehearse with

It is explicitly **not** a marketplace for paid gigs (v1) and explicitly **not** a dating app — every product decision (profile fields, messaging design, disclaimers, verification) should reinforce that distinction.

## Non-Goals (v1)

- No payment processing, escrow, invoicing, or paid-gig marketplace.
- No exposure of personal contact info (phone, email, home address) on profiles or in search results.
- No dating-app mechanics: no swipe/match-score gamification, no "attractiveness"-style ranking signals, no romantic-intent framing anywhere in copy or UX.
- No native mobile app in v1 (web-responsive only).
- No background-check integration in v1 (may be a future paid add-on; not required now).

## Target Users & Scope

- Individual musicians (any instrument/voice, any skill level from student to professional) and small ensembles/bands looking to add members.
- Geographic and genre scope: launching as a general, all-genre, location-based platform (city/region radius search) rather than a genre-specific niche, since ensemble/accompanist needs span genres. **Open item:** specific launch city/region not yet chosen.

## Core Feature Requirements

### Profiles
- Display name (not necessarily legal name), biography (free text), qualifications/experience (free text, e.g. grade exams/diplomas/degrees — deliberately unstructured for v1 rather than a filterable field), general location (city/region-level only, never precise address), skill level, "looking for" type(s), availability (day-of-week × time-of-day, general only — no exact calendar), audio/video sample links, external portfolio links.
- **Instruments and voice are separate taxonomies, not one list**, since voice *type* (soprano/alto/tenor/bass etc.) matters for ensemble formation in a way arbitrary instrument choice doesn't. A profile selects one or more instruments (including "Voice" as one of them) from an admin-editable list, plus — only relevant when "Voice" is selected — one or more voice types from a separate admin-editable list. A musician can be multi-instrumental and/or a singer; all multi-select.
- **Genres are a flat, multi-select tag list**, not a hierarchy — eras like "Baroque" and "Early Music" genuinely overlap, so a strict tree would misrepresent how musicians self-describe. List is admin-editable (see Admin section below).
- **No personal contact details (phone, email, address) ever shown on a profile or in search results.** All contact happens through in-app messaging. This is structurally enforced, not just a UI choice: contact info lives only on the `User` table, never on `Profile`, so a public-profile view that only ever serializes `Profile` fields cannot leak it.
- A visible "Verified" badge tied to identity verification, so users can trust who they're talking to without seeing personal info.
- Availability **is** shown publicly (decided 2026-08-31) — it's core to matching ("looking for a Sunday afternoon quartet") and reveals only a general weekly pattern, not an exact schedule or real-time location.

### Admin: Editable Reference Lists
- Instruments, genres, voice types, **and "looking for" options** are all **admin-editable at runtime**, not hardcoded — added, renamed, or removed via an admin interface rather than requiring a code change/deploy. A small `isAdmin` flag on `User` gates this; there's no broader roles/permissions system since only this one need exists so far.
- These lists are seeded with a starting set (see `tech-stack.md`) but are expected to be refined by the operator over time, particularly the genre and early-music-specific instrument lists.
- **"Looking for" was originally a fixed 3-option list (band member/accompanist/jam partner) and was changed to admin-editable after the operator found it too limited in practice** — real amateur use cases like "someone to occasionally play duets with at a similar standard" didn't fit "jam partner," which reads as informal improvisation rather than a classical/early-music duet partner. The list now includes an admin-editable set of options plus a fixed **"Other" option that reveals a free-text field** for anything not covered by the list.

### Search & Discovery
- Filter/search by instrument, genre, skill level, location radius, availability (e.g. weekends, evenings), and "looking for" type (band member, accompanist, jam partner).
- Location-radius (geo) search is a core requirement — implemented via PostGIS, resolving a private postal/ZIP code (never shown publicly) to approximate coordinates rather than requiring a precise address. See `tech-stack.md` for the current UK/US-only MVP approach and its coverage limits.
- Full-text/fuzzy search across bio and instrument/genre tags for flexible discovery.
- Free tier: basic filtering, capped number of results or profile views per period. Paid tier: advanced filters, unlimited browsing, visibility boost in others' search results. **Not yet enforced** — deferred until Stripe Billing is actually wired up.

### In-App Communication
- All communication happens through an in-app messaging system. Personal contact info is never auto-revealed; exchanging it to meet is a deliberate action users take themselves inside a conversation — the platform never auto-suggests or embeds contact-info fields in chat.
- Free tier: limited number of new conversations/messages per period. Paid tier: unlimited messaging.
- Report/block functionality on every profile and conversation, with a moderation queue for review.

### Trust, Safety & Disclaimers
- Mandatory, unavoidable disclaimer at signup (and re-surfaced before a user shares contact info or agrees to meet someone) stating that meeting people from the internet carries inherent risk, that the platform verifies identity but cannot guarantee behavior or safety, and recommending standard precautions (meet in public places, tell someone your plans, etc.). Logged as a timestamped acceptance for liability/audit purposes. **Final legal wording requires an actual lawyer** — this doc drafts intent only.
- Report/block, plus an admin moderation flow for handling reports (suspend/ban accounts, review flagged messages/profiles).
- Terms of Service / Community Guidelines explicitly banning misuse of the platform for anything beyond musical collaboration.

## Identity Verification

- On signup: phone number verification (OTP) **plus** government-ID + selfie/liveness verification through a third-party identity-verification provider (Stripe Identity — see `tech-stack.md`).
- The platform does **not** store raw ID documents — relies on the verification vendor's pass/fail response, keeping KYC-style PII off the app's own servers.
- Verified status is shown publicly as a badge, never the underlying ID/document data.
- Unverified accounts have materially reduced access (can complete a profile but cannot message or appear in search until verified).
- **Minimum age is 18** (decided 2026-09-04) — enforced two ways: a self-attestation checkbox at signup (immediate legal cover, not itself proof), and a hard check of the date of birth Stripe Identity extracts from the government ID during verification. A document showing an applicant under 18 is rejected outright (`identityVerifiedAt` is never set) with no retry path — this is a bright-line determination, not something routed through admin moderation.

## Open Items to Resolve Before Further Technical Design

- Geographic launch scope (single city/region vs. national).
- Specific free-tier limits and paid-tier price point (see `revenue-model.md`).
- Legal review of disclaimer/liability/ToS language.

See also: `tech-stack.md`, `revenue-model.md`.
