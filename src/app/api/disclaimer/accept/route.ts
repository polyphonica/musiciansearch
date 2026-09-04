import { NextResponse } from "next/server";
import {
  DISCLAIMER_VERSION,
  MESSAGING_SAFETY_DISCLAIMER_CONTEXT,
  SIGNUP_DISCLAIMER_CONTEXT,
  canMessage,
  getCurrentUser,
  hasAcceptedCurrentDisclaimer,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const context =
    body?.context === MESSAGING_SAFETY_DISCLAIMER_CONTEXT
      ? MESSAGING_SAFETY_DISCLAIMER_CONTEXT
      : SIGNUP_DISCLAIMER_CONTEXT;

  if (context === MESSAGING_SAFETY_DISCLAIMER_CONTEXT) {
    if (!user || !canMessage(user)) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    // Not deduped like the signup acceptance below — each row here is proof
    // the user saw the in-chat safety reminder immediately before that one
    // specific risky message, so every trigger gets its own timestamped row.
    await prisma.disclaimerAcceptance.create({
      data: { userId: user.id, disclaimerVersion: DISCLAIMER_VERSION, context },
    });
    return NextResponse.json({ ok: true });
  }

  if (!user || !user.phoneVerifiedAt) {
    return NextResponse.json({ error: "Phone verification required first." }, { status: 401 });
  }

  // Idempotent: the /disclaimer page itself now skips forward for users who
  // already accepted, but guard here too in case this is ever hit directly.
  if (!(await hasAcceptedCurrentDisclaimer(user.id))) {
    await prisma.disclaimerAcceptance.create({
      data: { userId: user.id, disclaimerVersion: DISCLAIMER_VERSION, context },
    });
  }

  return NextResponse.json({ ok: true });
}
