import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LookingFor, SkillLevel } from "@/generated/prisma/enums";

const SKILL_LEVELS = Object.values(SkillLevel);
const LOOKING_FOR_VALUES = Object.values(LookingFor);
const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];
const TIMES_OF_DAY = ["morning", "afternoon", "evening"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: {
      instruments: { select: { instrumentId: true } },
      genres: { select: { genreId: true } },
      voiceTypes: { select: { voiceTypeId: true } },
      availability: { select: { dayOfWeek: true, timeOfDay: true } },
    },
  });

  return NextResponse.json({ profile });
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!displayName || displayName.length > 100) {
    return NextResponse.json(
      { error: "Display name is required (1-100 characters)." },
      { status: 400 }
    );
  }

  const bio = typeof body.bio === "string" ? body.bio.slice(0, 2000) : null;
  const qualifications =
    typeof body.qualifications === "string" ? body.qualifications.slice(0, 2000) : null;
  const locationLabel =
    typeof body.locationLabel === "string" ? body.locationLabel.slice(0, 200) : null;

  const skillLevel =
    typeof body.skillLevel === "string" && SKILL_LEVELS.includes(body.skillLevel as SkillLevel)
      ? (body.skillLevel as SkillLevel)
      : null;

  const lookingFor = asStringArray(body.lookingFor).filter((v) =>
    LOOKING_FOR_VALUES.includes(v as LookingFor)
  ) as LookingFor[];

  const instrumentIds = asStringArray(body.instrumentIds);
  const genreIds = asStringArray(body.genreIds);
  const voiceTypeIds = asStringArray(body.voiceTypeIds);

  const availability: { dayOfWeek: number; timeOfDay: string }[] = Array.isArray(body.availability)
    ? body.availability.filter(
        (a: unknown): a is { dayOfWeek: number; timeOfDay: string } =>
          typeof a === "object" &&
          a !== null &&
          DAYS_OF_WEEK.includes((a as { dayOfWeek?: unknown }).dayOfWeek as number) &&
          TIMES_OF_DAY.includes((a as { timeOfDay?: unknown }).timeOfDay as string)
      )
    : [];

  let profile;
  try {
    profile = await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, displayName, bio, qualifications, locationLabel, skillLevel, lookingFor },
      update: { displayName, bio, qualifications, locationLabel, skillLevel, lookingFor },
    });

    await tx.profileInstrument.deleteMany({ where: { profileId: profile.id } });
    if (instrumentIds.length > 0) {
      await tx.profileInstrument.createMany({
        data: instrumentIds.map((instrumentId) => ({ profileId: profile.id, instrumentId })),
        skipDuplicates: true,
      });
    }

    await tx.profileGenre.deleteMany({ where: { profileId: profile.id } });
    if (genreIds.length > 0) {
      await tx.profileGenre.createMany({
        data: genreIds.map((genreId) => ({ profileId: profile.id, genreId })),
        skipDuplicates: true,
      });
    }

    await tx.profileVoiceType.deleteMany({ where: { profileId: profile.id } });
    if (voiceTypeIds.length > 0) {
      await tx.profileVoiceType.createMany({
        data: voiceTypeIds.map((voiceTypeId) => ({ profileId: profile.id, voiceTypeId })),
        skipDuplicates: true,
      });
    }

    await tx.availabilitySlot.deleteMany({ where: { profileId: profile.id } });
    if (availability.length > 0) {
      await tx.availabilitySlot.createMany({
        data: availability.map((a) => ({
          profileId: profile.id,
          dayOfWeek: a.dayOfWeek,
          timeOfDay: a.timeOfDay,
        })),
      });
    }

      return profile;
    });
  } catch (err) {
    console.error("Profile save failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your profile — check the selected instruments/genres/voice types are valid." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, profile });
}
