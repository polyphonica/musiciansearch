"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Report = {
  id: string;
  reason: string;
  status: "open" | "reviewed" | "actioned";
  createdAt: string;
  reporter: { id: string; name: string };
  reportedUser: { id: string; name: string; status: "active" | "suspended" | "banned" };
  reportedMessageBody: string | null;
};

const STATUS_TABS = ["open", "reviewed", "actioned", "all"] as const;

export function ReportsList() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("open");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    const query = tab === "all" ? "" : `?status=${tab}`;
    fetch(`/api/admin/reports${query}`)
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function setReportStatus(id: string, status: Report["status"]) {
    setError(null);
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update that report.");
      return;
    }
    load();
  }

  async function setUserStatus(userId: string, status: "active" | "suspended" | "banned") {
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update that account.");
      return;
    }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports here.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="space-y-2 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-medium">{r.reporter.name}</span> reported{" "}
                  <span className="font-medium">{r.reportedUser.name}</span>
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    account: {r.reportedUser.status}
                  </span>
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-base text-foreground">{r.reason}</p>
              {r.reportedMessageBody && (
                <p className="rounded-lg border bg-muted/50 p-2 text-sm text-muted-foreground">
                  Reported message: “{r.reportedMessageBody}”
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {r.status !== "reviewed" && (
                  <Button size="sm" variant="outline" onClick={() => setReportStatus(r.id, "reviewed")}>
                    Mark reviewed
                  </Button>
                )}
                {r.status !== "actioned" && (
                  <Button size="sm" variant="outline" onClick={() => setReportStatus(r.id, "actioned")}>
                    Mark actioned
                  </Button>
                )}
                {r.reportedUser.status === "active" ? (
                  <>
                    <Button size="sm" onClick={() => setUserStatus(r.reportedUser.id, "suspended")}>
                      Suspend account
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive"
                      onClick={() => setUserStatus(r.reportedUser.id, "banned")}
                    >
                      Ban account
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setUserStatus(r.reportedUser.id, "active")}>
                    Reactivate account
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
