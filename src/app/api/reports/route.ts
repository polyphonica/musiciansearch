import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const reportedUserId = typeof body?.reportedUserId === "string" ? body.reportedUserId : null;
  const reportedMessageId =
    typeof body?.reportedMessageId === "string" ? body.reportedMessageId : null;
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

  if (!reportedUserId || !reason) {
    return NextResponse.json({ error: "A reason is required." }, { status: 400 });
  }
  if (reportedUserId === user.id) {
    return NextResponse.json({ error: "You can't report yourself." }, { status: 400 });
  }

  const reportedUser = await prisma.user.findUnique({
    where: { id: reportedUserId },
    select: { id: true },
  });
  if (!reportedUser) {
    return NextResponse.json({ error: "That user could not be found." }, { status: 404 });
  }

  if (reportedMessageId) {
    const message = await prisma.message.findUnique({
      where: { id: reportedMessageId },
      select: {
        senderId: true,
        conversation: { select: { participants: { select: { userId: true } } } },
      },
    });
    const isParticipant = message?.conversation.participants.some((p) => p.userId === user.id);
    if (!message || message.senderId !== reportedUserId || !isParticipant) {
      return NextResponse.json({ error: "That message could not be found." }, { status: 404 });
    }
  }

  await prisma.report.create({
    data: { reporterId: user.id, reportedUserId, reportedMessageId, reason },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
