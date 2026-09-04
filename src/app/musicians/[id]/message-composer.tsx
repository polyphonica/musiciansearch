"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SafetyConfirmDialog } from "@/components/safety-confirm-dialog";
import { useSafetyGate } from "@/lib/use-safety-gate";

export function MessageComposer({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const safetyGate = useSafetyGate();

  if (!open) {
    return (
      <Button size="lg" onClick={() => setOpen(true)}>
        Send a message
      </Button>
    );
  }

  async function doSend() {
    setError(null);
    setSending(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, message }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't send that message. Please try again.");
      return;
    }
    const data = await res.json();
    router.push(`/messages/${data.conversationId}`);
  }

  function handleSend() {
    if (!message.trim()) return;
    safetyGate.guardSend(message, doSend);
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message…"
        rows={3}
        autoFocus
        disabled={!!safetyGate.riskReason}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSend} disabled={sending || !message.trim() || !!safetyGate.riskReason}>
          {sending ? "Sending…" : "Send"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
          Cancel
        </Button>
      </div>
      {safetyGate.riskReason && (
        <SafetyConfirmDialog
          reason={safetyGate.riskReason}
          confirming={safetyGate.confirming}
          error={safetyGate.error}
          onCancel={safetyGate.cancel}
          onConfirm={safetyGate.confirmAndSend}
        />
      )}
    </div>
  );
}
