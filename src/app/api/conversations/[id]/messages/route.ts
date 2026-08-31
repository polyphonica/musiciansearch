import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return participant !== null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id: conversationId } = await params;
  if (!(await requireParticipant(conversationId, user.id))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const [messages, participants] = await prisma.$transaction([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.conversationParticipant.findMany({
      where: { conversationId },
      include: { user: { select: { id: true, profile: { select: { displayName: true } } } } },
    }),
    prisma.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    }),
  ]);

  const other = participants.find((p) => p.userId !== user.id)?.user;

  return NextResponse.json({
    otherUserDisplayName: other?.profile?.displayName ?? "Unknown musician",
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt,
      isMine: m.senderId === user.id,
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id: conversationId } = await params;
  if (!(await requireParticipant(conversationId, user.id))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
  if (!text) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });

  const message = await prisma.message.create({
    data: { conversationId, senderId: user.id, body: text },
  });

  return NextResponse.json(
    { message: { id: message.id, body: message.body, senderId: message.senderId, createdAt: message.createdAt, isMine: true } },
    { status: 201 }
  );
}
