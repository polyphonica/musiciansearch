// Heuristic-only detection of a message that likely shares contact info or
// proposes meeting up in person -- the trigger for re-surfacing the safety
// disclaimer before send (see docs/requirements.md, Trust/Safety section).
// False positives just show an extra confirmation, so this errs broad.

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// 8+ digits in a row (spaces/dashes/dots/parens allowed between them) --
// enough to catch phone numbers while not tripping on grade levels, years, etc.
const PHONE_RE = /(?:\d[\s().-]*){8,}/;

const MEETING_PHRASES = [
  "meet up",
  "meet irl",
  "meet in person",
  "in person",
  "come over",
  "come by",
  "swing by",
  "my address",
  "let's meet",
  "lets meet",
  "meet me at",
  "call me",
  "text me",
  "whatsapp",
  "my number",
];

export type ContactRiskReason = "contact_info" | "meeting_intent";

export function detectContactRisk(text: string): ContactRiskReason | null {
  if (EMAIL_RE.test(text) || PHONE_RE.test(text)) return "contact_info";
  const lower = text.toLowerCase();
  if (MEETING_PHRASES.some((phrase) => lower.includes(phrase))) return "meeting_intent";
  return null;
}
