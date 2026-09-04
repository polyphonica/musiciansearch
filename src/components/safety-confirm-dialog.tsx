import { Button } from "@/components/ui/button";
import type { ContactRiskReason } from "@/lib/contact-risk";

const LEAD_IN: Record<ContactRiskReason, string> = {
  contact_info: "It looks like you're about to share contact information.",
  meeting_intent: "It looks like you're planning to meet up.",
};

export function SafetyConfirmDialog({
  reason,
  confirming,
  error,
  onCancel,
  onConfirm,
}: {
  reason: ContactRiskReason;
  confirming: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">A quick safety reminder</h2>
        <p className="text-sm text-muted-foreground">{LEAD_IN[reason]}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Meet in a public place for the first time.</li>
          <li>Tell a friend or family member where you&apos;re going and who you&apos;re meeting.</li>
          <li>
            MusicianSearch verifies identity documents but cannot guarantee behavior — trust your
            instincts.
          </li>
        </ul>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={confirming}>
            Go back
          </Button>
          <Button onClick={onConfirm} disabled={confirming}>
            {confirming ? "Sending…" : "I understand — send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
