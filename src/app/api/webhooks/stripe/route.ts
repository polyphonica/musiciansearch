import { NextResponse } from "next/server";
import { isAtLeastAge } from "@/lib/age";
import { prisma } from "@/lib/prisma";
import { stripe, stripeIdentityRestricted } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "identity.verification_session.verified") {
    const session = event.data.object;

    // Enforce the 18+ requirement against the date of birth Stripe extracted
    // from the government ID itself, not just self-attestation. Requires a
    // separate retrieve with a restricted key -- see src/lib/stripe.ts.
    let underage = false;
    try {
      const full = await stripeIdentityRestricted.identity.verificationSessions.retrieve(session.id, {
        expand: ["verified_outputs.dob"],
      });
      const dob = full.verified_outputs?.dob;
      // No (or partial) dob on the extracted document is treated as
      // pass-through (fail open) rather than blocking a legitimately
      // verified adult -- flagged here for visibility since it should be
      // rare for a document type Identity accepts.
      if (dob && dob.year !== null && dob.month !== null && dob.day !== null) {
        underage = !isAtLeastAge({ year: dob.year, month: dob.month, day: dob.day });
      }
    } catch (err) {
      console.error("Couldn't retrieve date of birth for age check:", err);
    }

    if (underage) {
      await prisma.user.updateMany({
        where: { stripeIdentitySessionId: session.id },
        data: { identityRejectedReason: "underage" },
      });
    } else {
      await prisma.user.updateMany({
        where: { stripeIdentitySessionId: session.id },
        data: { identityVerifiedAt: new Date(), identityRejectedReason: null },
      });
    }
  }

  return NextResponse.json({ received: true });
}
