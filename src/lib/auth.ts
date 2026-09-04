import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export const DISCLAIMER_VERSION = "2026-08-30-v1";
export const SIGNUP_DISCLAIMER_CONTEXT = "signup";
export const MESSAGING_SAFETY_DISCLAIMER_CONTEXT = "messaging_safety";

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function hasAcceptedCurrentDisclaimer(userId: string) {
  const acceptance = await prisma.disclaimerAcceptance.findFirst({
    where: { userId, disclaimerVersion: DISCLAIMER_VERSION, context: SIGNUP_DISCLAIMER_CONTEXT },
  });
  return acceptance !== null;
}

const MESSAGING_SAFETY_ACCEPTANCE_WINDOW_MS = 5 * 60 * 1000;

/** Server-side backstop for the in-chat safety re-surface: confirms the
 * client's dialog was actually shown and accepted immediately before this
 * send, rather than trusting the client to have gated it. */
export async function hasRecentMessagingSafetyAcceptance(userId: string) {
  const acceptance = await prisma.disclaimerAcceptance.findFirst({
    where: {
      userId,
      disclaimerVersion: DISCLAIMER_VERSION,
      context: MESSAGING_SAFETY_DISCLAIMER_CONTEXT,
      acceptedAt: { gte: new Date(Date.now() - MESSAGING_SAFETY_ACCEPTANCE_WINDOW_MS) },
    },
  });
  return acceptance !== null;
}

/** Messaging (starting or sending) requires identity verification, same as appearing in search. */
export function canMessage(user: { identityVerifiedAt: Date | null } | null): boolean {
  return user !== null && user.identityVerifiedAt !== null;
}

/** A profile (so a display name exists) is required to *start* a new conversation, so a recipient can always identify who's messaging them. */
export async function hasProfile(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  return profile !== null;
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
