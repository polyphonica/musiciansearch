import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.displayName}</h1>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Verified
          </span>
        </div>
        {profile.locationLabel && (
          <p className="text-sm text-muted-foreground">{profile.locationLabel}</p>
        )}
      </div>

      {profile.bio && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Biography</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{profile.bio}</p>
        </section>
      )}

      {profile.qualifications && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Qualifications / experience</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {profile.qualifications}
          </p>
        </section>
      )}

      {profile.skillLevel && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Skill level</h2>
          <p className="text-sm text-muted-foreground capitalize">{profile.skillLevel}</p>
        </section>
      )}

      {profile.instruments.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Instruments / voice</h2>
          <p className="text-sm text-muted-foreground">
            {profile.instruments.map((i) => i.instrument.name).join(", ")}
          </p>
        </section>
      )}

      {profile.voiceTypes.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Voice type</h2>
          <p className="text-sm text-muted-foreground">
            {profile.voiceTypes.map((v) => v.voiceType.name).join(", ")}
          </p>
        </section>
      )}

      {profile.genres.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Genres</h2>
          <p className="text-sm text-muted-foreground">
            {profile.genres.map((g) => g.genre.name).join(", ")}
          </p>
        </section>
      )}

      {(profile.lookingFor.length > 0 || profile.lookingForOther) && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Looking for</h2>
          <p className="text-sm text-muted-foreground">
            {profile.lookingFor.map((l) => l.lookingForOption.name).join(", ")}
          </p>
          {profile.lookingForOther && (
            <p className="text-sm text-muted-foreground">{profile.lookingForOther}</p>
          )}
        </section>
      )}

      {Object.keys(availabilityByDay).length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Availability</h2>
          <ul className="text-sm text-muted-foreground">
            {Object.entries(availabilityByDay).map(([day, times]) => (
              <li key={day}>
                {DAYS[Number(day)]}: {times.join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.externalLinks.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-medium">Links</h2>
          <ul className="text-sm">
            {profile.externalLinks.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Contact details are never shown on profiles. In-app messaging is coming soon.
      </p>
    </div>
  );
}
