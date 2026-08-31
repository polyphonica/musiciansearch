import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const validStatus = status === "open" || status === "reviewed" || status === "actioned" ? status : undefined;

  const reports = await prisma.report.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
      reportedUser: {
        select: { id: true, email: true, status: true, profile: { select: { displayName: true } } },
      },
    },
  });

  const messageIds = reports.map((r) => r.reportedMessageId).filter((id): id is string => id !== null);
  const messages = messageIds.length
    ? await prisma.message.findMany({ where: { id: { in: messageIds } }, select: { id: true, body: true } })
    : [];
  const messageById = new Map(messages.map((m) => [m.id, m.body]));

  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reporter: { id: r.reporter.id, name: r.reporter.profile?.displayName ?? r.reporter.email },
      reportedUser: {
        id: r.reportedUser.id,
        name: r.reportedUser.profile?.displayName ?? r.reportedUser.email,
        status: r.reportedUser.status,
      },
      reportedMessageBody: r.reportedMessageId ? (messageById.get(r.reportedMessageId) ?? null) : null,
    })),
  });
}
