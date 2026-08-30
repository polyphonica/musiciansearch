import { NextResponse } from "next/server";
import { DISCLAIMER_VERSION, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.phoneVerifiedAt) {
    return NextResponse.json({ error: "Phone verification required first." }, { status: 401 });
  }

  await prisma.disclaimerAcceptance.create({
    data: { userId: user.id, disclaimerVersion: DISCLAIMER_VERSION },
  });

  return NextResponse.json({ ok: true });
}
