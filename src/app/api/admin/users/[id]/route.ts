import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSystemMessage } from "@/lib/system-messages";

const VALID_STATUSES = ["active", "suspended", "banned"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "You can't change your own account status." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status;
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  const reportId = typeof body?.reportId === "string" ? body.reportId : null;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if ((status === "suspended" || status === "banned") && !reason) {
    return NextResponse.json(
      { error: "A reason is required when suspending or banning an account." },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({ where: { id }, data: { status } });
  } catch {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (reportId && reason) {
    await prisma.moderationNote.create({
      data: { reportId, adminId: admin.id, note: `Account ${status}. Reason: ${reason}` },
    });
  }

  if (status === "suspended" || status === "banned") {
    await sendSystemMessage(
      id,
      `Your account has been ${status} following a review of a report against you. Reason: ${reason}`
    );
  } else {
    await sendSystemMessage(id, "Your account has been reactivated. Welcome back.");
  }

  return NextResponse.json({ ok: true });
}
