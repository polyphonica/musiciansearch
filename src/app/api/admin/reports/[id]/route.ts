import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSystemMessage } from "@/lib/system-messages";

const VALID_STATUSES = ["open", "reviewed", "actioned"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await prisma.report.findUnique({
    where: { id },
    select: { status: true, reporterId: true, reporterNotifiedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  await prisma.report.update({ where: { id }, data: { status } });

  if (note) {
    await prisma.moderationNote.create({ data: { reportId: id, adminId: admin.id, note } });
  }

  // Send the reporter a one-time, generic acknowledgment the first time
  // their report leaves "open" — never again on later transitions (e.g. a
  // reopen-and-re-review), and never with details about what was found.
  if (existing.status === "open" && status !== "open" && !existing.reporterNotifiedAt) {
    await sendSystemMessage(
      existing.reporterId,
      "Thanks for your report. We've reviewed it and taken appropriate steps. We won't share further details about another user's account."
    );
    await prisma.report.update({ where: { id }, data: { reporterNotifiedAt: new Date() } });
  }

  return NextResponse.json({ ok: true });
}
