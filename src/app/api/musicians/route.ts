import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { blockedUserIds } from "@/lib/blocks";
import { resolvePostalCode } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { SkillLevel } from "@/generated/prisma/enums";

const PAGE_SIZE = 20;
const SKILL_LEVELS = Object.values(SkillLevel);
const TIMES_OF_DAY = ["morning", "afternoon", "evening"];
const MILES_TO_METERS = 1609.34;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const instrumentId = url.searchParams.get("instrumentId") || undefined;
  const genreId = url.searchParams.get("genreId") || undefined;
  const voiceTypeId = url.searchParams.get("voiceTypeId") || undefined;
  const lookingForOptionId = url.searchParams.get("lookingForOptionId") || undefined;
  const skillLevelParam = url.searchParams.get("skillLevel");
  const skillLevel =
    skillLevelParam && SKILL_LEVELS.includes(skillLevelParam as SkillLevel)
      ? (skillLevelParam as SkillLevel)
      : undefined;
  const q = url.searchParams.get("q")?.trim() || undefined;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const dayOfWeekParam = url.searchParams.get("dayOfWeek");
  const dayOfWeek =
    dayOfWeekParam !== null && /^[0-6]$/.test(dayOfWeekParam) ? Number(dayOfWeekParam) : undefined;
  const timeOfDayParam = url.searchParams.get("timeOfDay");
  const timeOfDay = timeOfDayParam && TIMES_OF_DAY.includes(timeOfDayParam) ? timeOfDayParam : undefined;

  const near = url.searchParams.get("near")?.trim() || undefined;
  const radiusMiles = Math.min(500, Math.max(1, Number(url.searchParams.get("radiusMiles")) || 25));

  const viewer = await getCurrentUser();
  const excludedUserIds = viewer ? await blockedUserIds(viewer.id) : [];

  let nearResolved: boolean | null = null;
  let nearProfileIds: string[] | null = null;
  if (near) {
    const resolved = await resolvePostalCode(near);
    nearResolved = resolved !== null;
    if (resolved) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM profiles
        WHERE location IS NOT NULL
          AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(${resolved.lng}, ${resolved.lat}), 4326)::geography, ${radiusMiles * MILES_TO_METERS})
      `;
      nearProfileIds = rows.map((r) => r.id);
    }
  }

  const where = {
    user: {
      identityVerifiedAt: { not: null },
      status: "active" as const,
      ...(excludedUserIds.length > 0 && { id: { notIn: excludedUserIds } }),
    },
    ...(instrumentId && { instruments: { some: { instrumentId } } }),
    ...(genreId && { genres: { some: { genreId } } }),
    ...(voiceTypeId && { voiceTypes: { some: { voiceTypeId } } }),
    ...(lookingForOptionId && { lookingFor: { some: { lookingForOptionId } } }),
    ...(skillLevel && { skillLevel }),
    ...((dayOfWeek !== undefined || timeOfDay) && {
      availability: {
        some: {
          ...(dayOfWeek !== undefined && { dayOfWeek }),
          ...(timeOfDay && { timeOfDay }),
        },
      },
    }),
    ...(nearProfileIds && { id: { in: nearProfileIds } }),
    ...(q && {
      OR: [
        { displayName: { contains: q, mode: "insensitive" as const } },
        { bio: { contains: q, mode: "insensitive" as const } },
        { locationLabel: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        bio: true,
        locationLabel: true,
        skillLevel: true,
        avatarUrl: true,
        instruments: { select: { instrument: { select: { name: true } } } },
        genres: { select: { genre: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.profile.count({ where }),
  ]);

  const results = profiles.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    bio: p.bio,
    locationLabel: p.locationLabel,
    skillLevel: p.skillLevel,
    avatarUrl: p.avatarUrl,
    instruments: p.instruments.map((i) => i.instrument.name),
    genres: p.genres.map((g) => g.genre.name),
  }));

  return NextResponse.json({
    results,
    page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: page * PAGE_SIZE < total,
    nearResolved,
  });
}
