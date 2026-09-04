import { NextResponse } from "next/server";
import { canMessage, getCurrentUser, hasProfile, hasRecentMessagingSafetyAcceptance } from "@/lib/auth";
import { detectContactRisk } from "@/lib/contact-risk";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: {
        include: { user: { select: { id: true, profile: { select: { displayName: true } } } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: user.id },
      readAt: null,
    },
    _count: true,
  });
  const unreadByConversation = new Map(unreadCounts.map((u) => [u.conversationId, u._count]));

  const results = conversations
    .map((c) => {
      const other = c.participants.find((p) => p.userId !== user.id)?.user;
      const lastMessage = c.messages[0] ?? null;
      return {
        id: c.id,
        otherUserDisplayName: other?.profile?.displayName ?? null,
        lastMessage: lastMessage
          ? { body: lastMessage.body, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId }
          : null,
        unreadCount: unreadByConversation.get(c.id) ?? 0,
        updatedAt: lastMessage?.createdAt ?? c.createdAt,
      };
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return NextResponse.json({ conversations: results });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!canMessage(user)) {
    return NextResponse.json(
      { error: "You must complete identity verification before messaging other musicians." },
      { status: 403 }
    );
  }
  if (!(await hasProfile(user.id))) {
    return NextResponse.json(
      { error: "Create your profile before messaging, so people know who they're talking to." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const profileId = typeof body?.profileId === "string" ? body.profileId : null;
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";

  if (!profileId || !message) {
    return NextResponse.json({ error: "A recipient and a message are required." }, { status: 400 });
  }

  if (detectContactRisk(message) && !(await hasRecentMessagingSafetyAcceptance(user!.id))) {
    return NextResponse.json(
      { error: "Safety confirmation required before sending this message.", requiresSafetyConfirmation: true },
      { status: 409 }
    );
  }

  const recipientProfile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { userId: true, user: { select: { identityVerifiedAt: true, status: true } } },
  });

  if (
    !recipientProfile ||
    !recipientProfile.user.identityVerifiedAt ||
    recipientProfile.user.status !== "active"
  ) {
    return NextResponse.json({ error: "That musician can't be messaged right now." }, { status: 404 });
  }

  const recipientId = recipientProfile.userId;
  if (recipientId === user!.id) {
    return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user!.id } } },
        { participants: { some: { userId: recipientId } } },
      ],
    },
    select: { id: true },
  });

  const conversationId = await prisma.$transaction(async (tx) => {
    const conversation =
      existing ??
      (await tx.conversation.create({
        data: {
          participants: {
            create: [{ userId: user!.id }, { userId: recipientId }],
          },
        },
      }));

    await tx.message.create({
      data: { conversationId: conversation.id, senderId: user!.id, body: message },
    });

    return conversation.id;
  });

  return NextResponse.json({ conversationId }, { status: 201 });
}
