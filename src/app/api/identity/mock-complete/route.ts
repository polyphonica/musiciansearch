import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isMockIdentityEnabled } from "@/lib/config";
import { prisma } from "@/lib/prisma";

// Dev-only stand-in for the Stripe `identity.verification_session.verified`
// webhook. Gated the same way as /api/identity/start so it's inert unless
// the mock flag is explicitly on in a non-production environment.
export async function POST(request: Request) {
  if (!isMockIdentityEnabled()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user || !user.stripeIdentitySessionId?.startsWith("mock_")) {
    return NextResponse.json({ error: "No mock verification in progress." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const approved = body?.approved === true;

  if (approved) {
    await prisma.user.update({
      where: { id: user.id },
      data: { identityVerifiedAt: new Date() },
    });
    console.warn(`[MOCK] Identity verification marked verified for user ${user.id}`);
  }

  return NextResponse.json({ ok: true, approved });
}
