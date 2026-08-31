// Sends messages from the "MusicianSearch Team" system account (seeded in
// prisma/seed.ts) — used by moderation actions to tell a reporter or a
// reported user what happened, without exposing either side's identity to
// the other. Bypasses canMessage/hasProfile since it's a server-only path,
// not something a user triggers directly.
import { prisma } from "@/lib/prisma";

export const SYSTEM_USER_EMAIL = "system@musiciansearch.internal";

let cachedSystemUserId: string | null = null;

async function getSystemUserId(): Promise<string> {
  if (cachedSystemUserId) return cachedSystemUserId;
  const systemUser = await prisma.user.findUniqueOrThrow({
    where: { email: SYSTEM_USER_EMAIL },
    select: { id: true },
  });
  cachedSystemUserId = systemUser.id;
  return systemUser.id;
}

export async function sendSystemMessage(toUserId: string, body: string): Promise<void> {
  const systemUserId = await getSystemUserId();

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: systemUserId } } },
        { participants: { some: { userId: toUserId } } },
      ],
    },
    select: { id: true },
  });

  const conversationId =
    existing?.id ??
    (
      await prisma.conversation.create({
        data: { participants: { create: [{ userId: systemUserId }, { userId: toUserId }] } },
      })
    ).id;

  await prisma.message.create({
    data: { conversationId, senderId: systemUserId, body },
  });
}
