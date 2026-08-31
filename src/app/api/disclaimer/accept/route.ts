import { NextResponse } from "next/server";
import { DISCLAIMER_VERSION, getCurrentUser, hasAcceptedCurrentDisclaimer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.phoneVerifiedAt) {
    return NextResponse.json({ error: "Phone verification required first." }, { status: 401 });
  }

  // Idempotent: the /disclaimer page itself now skips forward for users who
  // already accepted, but guard here too in case this is ever hit directly.
  if (!(await hasAcceptedCurrentDisclaimer(user.id))) {
    await prisma.disclaimerAcceptance.create({
      data: { userId: user.id, disclaimerVersion: DISCLAIMER_VERSION },
    });
  }

  return NextResponse.json({ ok: true });
}
