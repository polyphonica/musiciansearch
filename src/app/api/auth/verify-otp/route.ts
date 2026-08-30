import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { twilioClient, TWILIO_VERIFY_SERVICE_SID } from "@/lib/twilio";
import { isValidOtpCode, isValidPhone } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone;
  const code = body?.code;

  if (!isValidPhone(phone) || !isValidOtpCode(code)) {
    return NextResponse.json({ error: "A valid phone number and code are required." }, { status: 400 });
  }

  let check;
  try {
    check = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
  } catch (err) {
    console.error("Twilio Verify check failed:", err);
    return NextResponse.json(
      { error: "Couldn't check that code right now. Please try again shortly." },
      { status: 502 }
    );
  }

  if (check.status !== "approved") {
    return NextResponse.json({ error: "Incorrect or expired code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ error: "No signup found for that phone number." }, { status: 404 });
  }

  await prisma.user.update({
    where: { phone },
    data: { phoneVerifiedAt: new Date() },
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true });
}
