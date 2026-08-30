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
- Display name (not necessarily legal name), instrument(s)/voice, genres, skill level/experience, general location (city/region-level only, never precise address), availability, bio, audio/video samples (optional), links to external portfolios.
- **No personal contact details (phone, email, address) ever shown on a profile or in search results.** All contact happens through in-app messaging.
- A visible "Verified" badge tied to identity verification, so users can trust who they're talking to without seeing personal info.

### Search & Discovery
- Filter/search by instrument, genre, skill level, location radius, availability (e.g. weekends, evenings), and "looking for" type (band member, accompanist, jam partner).
- Location-radius (geo) search is a core requirement — needs geospatial query support (PostGIS) rather than naive city-string matching.
- Full-text/fuzzy search across bio and instrument/genre tags for flexible discovery.
- Free tier: basic filtering, capped number of results or profile views per period. Paid tier: advanced filters, unlimited browsing, visibility boost in others' search results.

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

## Open Items to Resolve Before Further Technical Design

- Geographic launch scope (single city/region vs. national).
- Specific free-tier limits and paid-tier price point (see `revenue-model.md`).
- Legal review of disclaimer/liability/ToS language.

See also: `tech-stack.md`, `revenue-model.md`.
