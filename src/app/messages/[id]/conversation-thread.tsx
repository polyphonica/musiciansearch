"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportButton } from "@/components/report-button";
import { BlockButton } from "@/components/block-button";
import { SafetyConfirmDialog } from "@/components/safety-confirm-dialog";
import { useSafetyGate } from "@/lib/use-safety-gate";

type Message = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  isMine: boolean;
};

const POLL_INTERVAL_MS = 4000;

export function ConversationThread({ conversationId }: { conversationId: string }) {
  const [otherName, setOtherName] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [canReply, setCanReply] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const safetyGate = useSafetyGate();

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch(`/api/conversations/${conversationId}/messages`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setOtherName(data.otherUserDisplayName ?? null);
          setOtherUserId(data.otherUserId ?? null);
          setBlockedByMe(data.blockedByMe ?? false);
          setCanReply(data.canReply ?? true);
          setMessages(data.messages ?? []);
          setLoading(false);
        });
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function doSend() {
    setError(null);
    setSending(true);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't send that message. Please try again.");
      return;
    }
    const data = await res.json();
    setMessages((prev) => [...prev, data.message]);
    setText("");
  }

  function sendMessage() {
    if (!text.trim()) return;
    safetyGate.guardSend(text, doSend);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {otherName ?? "This musician's account is no longer available"}
        </h1>
        {otherUserId && (
          <BlockButton
            userId={otherUserId}
            initiallyBlocked={blockedByMe}
            onBlockedChange={(blocked) => setCanReply(!blocked)}
          />
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.isMine ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-base ${
                m.isMine
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card text-foreground"
              }`}
            >
              <p className="whitespace-pre-line">{m.body}</p>
              <p
                className={`mt-1 text-xs ${
                  m.isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
            {!m.isMine && (
              <div className="mt-1">
                <ReportButton reportedUserId={m.senderId} reportedMessageId={m.id} label="Report" />
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No messages yet — say hello to start the conversation.
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      {canReply ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="mt-4 flex items-end gap-2"
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            rows={2}
            className="flex-1"
            disabled={!!safetyGate.riskReason}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button type="submit" disabled={sending || !text.trim() || !!safetyGate.riskReason}>
            Send
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {blockedByMe
            ? "You've blocked this person — unblock them to send messages."
            : "You can no longer send messages in this conversation."}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
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
