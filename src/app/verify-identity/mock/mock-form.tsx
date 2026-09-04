"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function MockIdentityForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function complete(approved: boolean, simulateUnderage = false) {
    setLoading(true);
    await fetch("/api/identity/mock-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, simulateUnderage }),
    });
    setLoading(false);
    router.push("/verify-identity/return");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6 rounded-lg border-2 border-dashed border-destructive/50 p-6 text-center"
      >
        <div className="rounded bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-destructive">
          Dev-only mock — not real Stripe Identity
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Simulate identity verification
        </h1>
        <p className="text-sm text-muted-foreground">
          This stands in for Stripe&apos;s hosted verification page while
          real credentials aren&apos;t configured. Pick an outcome to
          continue.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => complete(true)} disabled={loading}>
            Simulate: verification approved
          </Button>
          <Button
            variant="outline"
            onClick={() => complete(true, true)}
            disabled={loading}
          >
            Simulate: approved, but under 18
          </Button>
          <Button
            variant="outline"
            onClick={() => complete(false)}
            disabled={loading}
          >
            Simulate: verification failed
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
