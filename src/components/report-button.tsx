"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  "Fake profile or impersonation",
  "Inappropriate or offensive content",
  "Harassment or unsafe behavior",
  "Spam or scam",
  "Other",
];

export function ReportButton({
  reportedUserId,
  reportedMessageId,
  label = "Report",
}: {
  reportedUserId: string;
  reportedMessageId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-sm text-muted-foreground">Thanks — our team will review this.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
      >
        {label}
      </button>
    );
  }

  async function handleSubmit() {
    setError(null);
    setSending(true);
    const reason = details.trim() ? `${category}: ${details.trim()}` : category;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedUserId, reportedMessageId, reason }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't submit that report. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 text-sm">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-9 w-full rounded-lg border-2 border-input bg-teal/5 px-2.5 text-sm"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <Textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Optional details"
        rows={2}
      />
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={sending}>
          {sending ? "Submitting…" : "Submit report"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={sending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
