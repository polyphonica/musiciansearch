import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { userId: blockedId } = await params;
  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId } });

  return NextResponse.json({ ok: true });
}
