import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SkillLevel } from "@/generated/prisma/enums";

const PAGE_SIZE = 20;
const SKILL_LEVELS = Object.values(SkillLevel);

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

  const where = {
    user: { identityVerifiedAt: { not: null }, status: "active" as const },
    ...(instrumentId && { instruments: { some: { instrumentId } } }),
    ...(genreId && { genres: { some: { genreId } } }),
    ...(voiceTypeId && { voiceTypes: { some: { voiceTypeId } } }),
    ...(lookingForOptionId && { lookingFor: { some: { lookingForOptionId } } }),
    ...(skillLevel && { skillLevel }),
    ...(q && {
      OR: [
        { displayName: { contains: q, mode: "insensitive" as const } },
        { bio: { contains: q, mode: "insensitive" as const } },
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
  });
}
