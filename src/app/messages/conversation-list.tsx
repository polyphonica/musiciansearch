"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  id: string;
  otherUserDisplayName: string | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
};

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (conversations.length === 0) {
    return (
      <p className="text-base text-muted-foreground">
        No conversations yet. Start one from a musician&apos;s profile.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {c.otherUserDisplayName ?? "Account no longer available"}
              </p>
              {c.lastMessage && (
                <p className="truncate text-sm text-muted-foreground">{c.lastMessage.body}</p>
              )}
            </div>
            {c.unreadCount > 0 && (
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {c.unreadCount}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
