import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export const DISCLAIMER_VERSION = "2026-08-30-v1";

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function hasAcceptedCurrentDisclaimer(userId: string) {
  const acceptance = await prisma.disclaimerAcceptance.findFirst({
    where: { userId, disclaimerVersion: DISCLAIMER_VERSION },
  });
  return acceptance !== null;
}
