"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function VerifyIdentityForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/identity/start", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Verify your identity</h1>
        <p className="text-sm text-muted-foreground">
          Last step: we use Stripe Identity to confirm you&apos;re a real
          person with a matching government ID and a quick selfie. This
          keeps MusicianSearch safe for everyone. Your ID documents are
          handled by Stripe and are never stored on our servers.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleStart} disabled={loading} className="w-full">
          {loading ? "Starting…" : "Start identity verification"}
        </Button>
      </motion.div>
    </div>
  );
}
