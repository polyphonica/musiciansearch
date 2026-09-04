import Stripe from "stripe";

let cached: Stripe | null = null;

function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return cached;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});

let cachedIdentityRestricted: Stripe | null = null;

// A separate client authenticated with a *restricted* key carrying only
// Identity's "sensitive" verification-data permission. Stripe requires this
// distinct key (not the general secret key) to expand verified_outputs.dob --
// see docs.stripe.com/identity/access-verification-results. Used only for the
// 18+ age check; never for anything else.
function getStripeIdentityRestricted(): Stripe {
  if (!cachedIdentityRestricted) {
    cachedIdentityRestricted = new Stripe(process.env.STRIPE_IDENTITY_RESTRICTED_KEY!);
  }
  return cachedIdentityRestricted;
}

export const stripeIdentityRestricted = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripeIdentityRestricted(), prop, getStripeIdentityRestricted());
  },
});
