/**
 * Dev-only bypass for Stripe Identity, gated on NODE_ENV as well as the flag
 * so it can never activate in a production deploy even if the env var leaks in.
 */
export function isMockIdentityEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_IDENTITY_VERIFICATION === "true";
}

/**
 * Dev-only bypass for Twilio Verify (real SMS sending), gated the same way
 * as isMockIdentityEnabled(). When active, signup/verify accept a single
 * fixed code instead of sending/checking a real OTP via Twilio.
 */
export function isMockOtpEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_OTP_VERIFICATION === "true";
}

export const MOCK_OTP_CODE = "123456";
