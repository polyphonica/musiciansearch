const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: + followed by 8-15 digits
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value);
}

export function isValidPhone(value: unknown): value is string {
  return typeof value === "string" && PHONE_RE.test(value);
}

export function isValidOtpCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{4,10}$/.test(value);
}
