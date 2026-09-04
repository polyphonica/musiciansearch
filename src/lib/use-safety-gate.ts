"use client";

import { useRef, useState } from "react";
import { detectContactRisk, type ContactRiskReason } from "@/lib/contact-risk";

/** Gates a message send behind the in-chat safety disclaimer whenever the
 * text looks like it shares contact info or proposes meeting up. */
export function useSafetyGate() {
  const [riskReason, setRiskReason] = useState<ContactRiskReason | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingSendRef = useRef<(() => void | Promise<void>) | null>(null);

  function guardSend(text: string, send: () => void | Promise<void>) {
    const risk = detectContactRisk(text);
    if (risk) {
      setError(null);
      pendingSendRef.current = send;
      setRiskReason(risk);
      return;
    }
    send();
  }

  async function confirmAndSend() {
    setConfirming(true);
    setError(null);
    const res = await fetch("/api/disclaimer/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: "messaging_safety" }),
    });
    setConfirming(false);
    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }
    setRiskReason(null);
    const send = pendingSendRef.current;
    pendingSendRef.current = null;
    if (send) await send();
  }

  function cancel() {
    setRiskReason(null);
    setError(null);
    pendingSendRef.current = null;
  }

  return { riskReason, confirming, error, guardSend, confirmAndSend, cancel };
}
