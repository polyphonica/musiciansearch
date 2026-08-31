# MusicianSearch — Launch & Cold-Start Strategy

Research notes on how to get MusicianSearch past the classic two-sided-marketplace cold-start problem, without resorting to fake profiles.

## The core problem

Two-sided marketplaces need supply (musician profiles) and demand (people searching/browsing) at the same time, but neither shows up without the other already there. An empty search page doesn't convert visitors, but seeding it with fake profiles is dishonest and directly undercuts MusicianSearch's whole "not sketchy, actually trustworthy" positioning. This is a well-studied problem with an established playbook — it doesn't need to be solved from first principles.

## The established playbook

1. **Concentrate liquidity narrowly, don't spread it thin.** A city with 40 real profiles feels alive; the same 40 profiles spread across a whole country feels empty. Airbnb famously launched one city at a time. Pick ONE city or one specific music scene — ideally one with an existing personal foothold — and treat that as the entire initial market, resisting the urge to "launch everywhere" at once.
2. **Piggyback on an existing dense community rather than starting from zero.** PayPal grew by embedding itself in eBay's existing power-seller community; Reddit seeded early subreddits from communities that already existed elsewhere. For MusicianSearch: local orchestras/choirs/big bands, university or conservatoire music departments, music shops, open-mic nights, and local Facebook/Meetup groups for jam sessions are all pre-existing dense communities to recruit real users from directly.
3. **Concierge MVP for the first handful of matches.** Before any public push, personally hand-match a small number of real musicians who want to jam or need an accompanist — using the app for the record but doing the actual matchmaking by hand (phone/email/DM). This proves the concept and produces genuine early testimonials before strangers ever see the site.
4. **Supply-side first, and curated.** Recruit real, verified profiles in the target area *before* inviting anyone to browse, so a visitor's very first impression is a populated, credible site — not an empty search page.
5. **Never fabricate profiles as if real.** Presenting fake accounts as real users is a well-known anti-pattern (early dating apps got burned by exactly this). If a populated *feel* is wanted before there's real density in a given city, an honest "Launching in [city] soon — join the waitlist" state is the non-deceptive substitute. Any test accounts created during development should be deleted before any real public launch, not shown as if genuine.
6. **Referral loops once there's a seed population.** After the first real signups, prompt each one to invite bandmates/collaborators they already know — this compounds an initial cold-recruited cohort into a real network far faster than continued cold outreach, and the people invited already trust the inviter.
7. **A local launch event.** Partnering with (or just attending) a real jam session, open mic, or "find an accompanist" meetup and getting attendees to sign up on the spot converts an existing live community into a digital cohort with very high fidelity.
8. **Waitlist + geographic drip.** Collect interest broadly via a simple landing page, but only "open" a city once it crosses a density threshold of verified profiles — so no visitor ever lands on a dead search page for their area.
9. **Content/SEO as a slower-burn, non-network-effect-dependent channel.** Long-tail pages like "accompanist for grade 8 viola exam, London" or "jazz drummer wanted, Brighton" can bring in searchers independent of how populated the marketplace already is.

## Recommended starting point for MusicianSearch specifically

- Pick one city or one specific music scene with an existing personal connection — this is the single highest-leverage decision, since it determines whether cold outreach is even tractable.
- Personally recruit an initial real, verified cohort there (a few dozen is plenty to start) through direct outreach into existing music communities — not through advertising.
- Concierge the first few real "I want to jam with X" or "I need an accompanist" requests by hand to guarantee good first experiences.
- Once there's a real seed population, add an "invite your bandmates" referral prompt as an actual product feature — a build task for later, not now.
- Treat any other city as "not yet launched" (waitlist-style) rather than showing an empty search result for it.

## Further reading

- **"The Cold Start Problem" by Andrew Chen** — the standard reference for exactly this problem; coined widely-used framing like "atomic network" (the smallest fully-functioning unit of the network) and "the hard side vs. the easy side" of a marketplace.
- **NfX, "19 Marketplace Tactics to Jumpstart Liquidity"** (nfx.com) — a concrete, marketplace-specific tactics list, including the "concierge MVP" and "single-player mode" ideas referenced above.
- **a16z's marketplace essays** (Andreessen Horowitz) — supply-vs-demand sequencing frameworks for deciding which side of a marketplace to seed first.
- **"Traction" by Gabriel Weinberg & Justin Mares** — the "Bullseye" method for systematically testing and picking a first acquisition channel, useful once the initial seed community is established and the question becomes "what next."
- Worth knowing as a cautionary case study: early ride-share/dating apps that seeded fake accounts to look busier took real reputational damage when it came out — reinforces that avoiding fake profiles is the right call, not overcaution.

## Status

Not an implementation task — no code changes follow from this document. Revisit once a specific launch city/community and timeline are chosen; at that point the "invite your bandmates" referral flow and any waitlist/geographic-gating UI become real build items.
