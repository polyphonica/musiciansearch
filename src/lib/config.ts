/**
 * Dev-only bypass for Stripe Identity, gated on NODE_ENV as well as the flag
 * so it can never activate in a production deploy even if the env var leaks in.
 */
export function isMockIdentityEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_IDENTITY_VERIFICATION === "true";
}
