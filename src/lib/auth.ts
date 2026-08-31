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

/** Messaging (starting or sending) requires identity verification, same as appearing in search. */
export function canMessage(user: { identityVerifiedAt: Date | null } | null): boolean {
  return user !== null && user.identityVerifiedAt !== null;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

/** Phone numbers listed in ADMIN_PHONE_NUMBERS (comma-separated, E.164) are granted admin on signup. */
export function isConfiguredAdminPhone(phone: string): boolean {
  const list = (process.env.ADMIN_PHONE_NUMBERS ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return list.includes(phone);
}
