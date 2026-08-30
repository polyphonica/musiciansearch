import twilio from "twilio";
import type { Twilio } from "twilio";

let cached: Twilio | null = null;

function getClient(): Twilio {
  if (!cached) {
    cached = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return cached;
}

export const twilioClient = new Proxy({} as Twilio, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop, getClient());
  },
});

export const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;
