import { NextResponse } from "next/server";
import { getCurrentUser, hasAcceptedCurrentDisclaimer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !user.phoneVerifiedAt) {
    return NextResponse.json({ error: "Phone verification required first." }, { status: 401 });
  }
  if (!(await hasAcceptedCurrentDisclaimer(user.id))) {
    return NextResponse.json({ error: "You must accept the safety disclaimer first." }, { status: 401 });
  }
  if (user.identityVerifiedAt) {
    return NextResponse.json({ error: "Identity already verified." }, { status: 400 });
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-identity/return`;

  let verificationSession;
  try {
    verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      options: { document: { require_matching_selfie: true } },
      return_url: returnUrl,
      metadata: { userId: user.id },
    });
  } catch (err) {
    console.error("Stripe Identity session creation failed:", err);
    return NextResponse.json(
      { error: "Couldn't start identity verification right now. Please try again shortly." },
      { status: 502 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeIdentitySessionId: verificationSession.id },
  });

  return NextResponse.json({ url: verificationSession.url });
}
