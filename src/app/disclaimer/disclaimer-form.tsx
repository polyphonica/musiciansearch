"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function DisclaimerForm() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/disclaimer/accept", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    router.push("/verify-identity");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg space-y-6"
      >
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Before you continue: a note on safety
        </h1>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            MusicianSearch verifies the identity of everyone on the platform,
            but meeting someone you connected with online — for a rehearsal,
            a session, or anything else — always carries some risk, just as
            it would meeting anyone new.
          </p>
          <p>We strongly recommend that you:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Meet in a public place for the first time.</li>
            <li>Tell a friend or family member where you&apos;re going and who you&apos;re meeting.</li>
            <li>Trust your instincts — you can always end a conversation or cancel a meeting.</li>
          </ul>
          <p>
            MusicianSearch verifies identity documents but cannot guarantee
            the behavior of any user. You are responsible for your own safety
            when arranging and attending meetings made through this platform.
          </p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          I have read and understand this, and I accept the risks of meeting
          people I connect with through MusicianSearch.
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleAccept} disabled={!accepted || loading} className="w-full">
          {loading ? "Saving…" : "Continue"}
        </Button>
      </motion.div>
    </div>
  );
}
