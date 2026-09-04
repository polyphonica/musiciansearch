"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BlockButton({
  userId,
  initiallyBlocked,
  onBlockedChange,
}: {
  userId: string;
  initiallyBlocked: boolean;
  onBlockedChange?: (blocked: boolean) => void;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBlock() {
    setError(null);
    setSending(true);
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't block this person. Please try again.");
      return;
    }
    setBlocked(true);
    setConfirming(false);
    onBlockedChange?.(true);
    router.refresh();
  }

  async function handleUnblock() {
    setError(null);
    setSending(true);
    const res = await fetch(`/api/blocks/${userId}`, { method: "DELETE" });
    setSending(false);
    if (!res.ok) {
      setError("Couldn't unblock this person. Please try again.");
      return;
    }
    setBlocked(false);
    onBlockedChange?.(false);
    router.refresh();
  }

  if (blocked) {
    return (
      <span className="text-sm">
        <button
          type="button"
          onClick={handleUnblock}
          disabled={sending}
          className="text-muted-foreground underline-offset-2 hover:underline"
        >
          {sending ? "Unblocking…" : "Unblock"}
        </button>
        {error && <span className="ml-2 text-destructive">{error}</span>}
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
      >
        Block
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 text-sm">
      <p>
        Block this person? They won&apos;t be able to message you, and neither of you will appear
        in the other&apos;s search results.
      </p>
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" onClick={handleBlock} disabled={sending}>
          {sending ? "Blocking…" : "Block"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={sending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
