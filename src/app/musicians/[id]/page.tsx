import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "teal" | "accent" | "primary" }) {
  const toneClasses = {
    teal: "border-teal/30 bg-teal/10 text-teal",
    accent: "border-accent/40 bg-accent/15 text-accent-foreground",
    primary: "border-primary/30 bg-primary/10 text-primary",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${toneClasses}`}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default async function MusicianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Explicit `select` (not `include`) so a sensitive-but-not-yet-added field
  // can never accidentally end up here just by existing on the model —
  // postalCode in particular must never reach this public page.
  const profile = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      bio: true,
      qualifications: true,
      locationLabel: true,
      skillLevel: true,
      lookingForOther: true,
      externalLinks: true,
      user: { select: { identityVerifiedAt: true, status: true } },
      instruments: { include: { instrument: true } },
      genres: { include: { genre: true } },
      voiceTypes: { include: { voiceType: true } },
      lookingFor: { include: { lookingForOption: true } },
      availability: true,
    },
  });

  if (!profile || !profile.user.identityVerifiedAt || profile.user.status !== "active") {
    notFound();
  }

  const availabilityByDay = profile.availability.reduce<Record<number, string[]>>((acc, slot) => {
    (acc[slot.dayOfWeek] ??= []).push(slot.timeOfDay);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <div className="flex items-start gap-5">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
          {initials(profile.displayName)}
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{profile.displayName}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              ✓ Verified
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
            {profile.locationLabel && <span>{profile.locationLabel}</span>}
            {profile.skillLevel && (
              <>
                {profile.locationLabel && <span aria-hidden>·</span>}
                <span className="capitalize">{profile.skillLevel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        {profile.bio && (
          <Section title="Biography">
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground">{profile.bio}</p>
          </Section>
        )}

        {profile.qualifications && (
          <Section title="Qualifications / experience">
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
              {profile.qualifications}
            </p>
          </Section>
        )}

        {profile.instruments.length > 0 && (
          <Section title="Instruments">
            <div className="flex flex-wrap gap-2">
              {profile.instruments.map((i) => (
                <Pill key={i.instrument.name} tone="teal">
                  {i.instrument.name}
                </Pill>
              ))}
            </div>
          </Section>
        )}

        {profile.voiceTypes.length > 0 && (
          <Section title="Voice type">
            <div className="flex flex-wrap gap-2">
              {profile.voiceTypes.map((v) => (
                <Pill key={v.voiceType.name} tone="teal">
                  {v.voiceType.name}
                </Pill>
              ))}
            </div>
          </Section>
        )}

        {profile.genres.length > 0 && (
          <Section title="Genres">
            <div className="flex flex-wrap gap-2">
              {profile.genres.map((g) => (
                <Pill key={g.genre.name} tone="accent">
                  {g.genre.name}
                </Pill>
              ))}
            </div>
          </Section>
        )}

        {(profile.lookingFor.length > 0 || profile.lookingForOther) && (
          <Section title="Looking for">
            <div className="flex flex-wrap gap-2">
              {profile.lookingFor.map((l) => (
                <Pill key={l.lookingForOption.name} tone="primary">
                  {l.lookingForOption.name}
                </Pill>
              ))}
            </div>
            {profile.lookingForOther && (
              <p className="text-base text-foreground">{profile.lookingForOther}</p>
            )}
          </Section>
        )}

        {Object.keys(availabilityByDay).length > 0 && (
          <Section title="Availability">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-base text-foreground sm:grid-cols-3">
              {Object.entries(availabilityByDay).map(([day, times]) => (
                <li key={day}>
                  <span className="font-medium">{DAYS[Number(day)]}</span>{" "}
                  <span className="text-muted-foreground">{times.join(", ")}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {profile.externalLinks.length > 0 && (
          <Section title="Links">
            <div className="flex flex-wrap gap-2">
              {profile.externalLinks.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-sm font-medium text-teal hover:bg-teal/20"
                >
                  {link}
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Contact details are never shown on profiles. In-app messaging is coming soon.
      </p>
    </div>
  );
}
