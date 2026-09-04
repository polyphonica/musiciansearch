import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const blocks = await prisma.block.findMany({
    where: { blockerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { blocked: { select: { id: true, profile: { select: { displayName: true } } } } },
  });

  return NextResponse.json({
    blocks: blocks.map((b) => ({
      userId: b.blockedId,
      displayName: b.blocked.profile?.displayName ?? "Unknown Musician",
      createdAt: b.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const blockedId = typeof body?.userId === "string" ? body.userId : null;
  if (!blockedId) {
    return NextResponse.json({ error: "A user to block is required." }, { status: 400 });
  }
  if (blockedId === user.id) {
    return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "That user doesn't exist." }, { status: 404 });

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
    create: { blockerId: user.id, blockedId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
