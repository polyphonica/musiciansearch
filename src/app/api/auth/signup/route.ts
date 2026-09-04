import { NextResponse } from "next/server";
import { isConfiguredAdminPhone } from "@/lib/auth";
import { isMockOtpEnabled, MOCK_OTP_CODE } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { twilioClient, TWILIO_VERIFY_SERVICE_SID } from "@/lib/twilio";
import { isValidEmail, isValidPhone } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email;
  const phone = body?.phone;
  const ageConfirmed = body?.ageConfirmed === true;

  if (!isValidEmail(email) || !isValidPhone(phone)) {
    return NextResponse.json(
      { error: "A valid email and phone number (E.164 format, e.g. +14155551234) are required." },
      { status: 400 }
    );
  }

  if (!ageConfirmed) {
    return NextResponse.json(
      { error: "You must confirm you are 18 or older to continue." },
      { status: 400 }
    );
  }

  const isAdmin = isConfiguredAdminPhone(phone);

  try {
    await prisma.user.upsert({
      where: { phone },
      update: { email, ageConfirmedAt: new Date(), ...(isAdmin ? { isAdmin: true } : {}) },
      create: { email, phone, isAdmin, ageConfirmedAt: new Date() },
    });
  } catch {
    return NextResponse.json(
      { error: "That email is already associated with a different phone number." },
      { status: 409 }
    );
  }

  if (isMockOtpEnabled()) {
    console.warn(`[MOCK] Skipping real SMS for ${phone} — use code ${MOCK_OTP_CODE} on /verify`);
    return NextResponse.json({ ok: true, mock: true });
  }

  try {
    await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
  } catch (err) {
    console.error("Twilio Verify send failed:", err);
    return NextResponse.json(
      { error: "Couldn't send a verification code right now. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
