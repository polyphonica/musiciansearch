import { NextResponse } from "next/server";
import { getCurrentUser, hasAcceptedCurrentDisclaimer } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authenticated: false });

  return NextResponse.json({
    authenticated: true,
    email: user.email,
    phoneVerified: user.phoneVerifiedAt !== null,
    disclaimerAccepted: await hasAcceptedCurrentDisclaimer(user.id),
    identityVerified: user.identityVerifiedAt !== null,
  });
}
