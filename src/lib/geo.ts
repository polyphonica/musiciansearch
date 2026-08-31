import { prisma } from "@/lib/prisma";

// MVP postal-code-district-level location resolution — see
// docs/technical-design.md for what's seeded and its coverage limits.
// Not full geocoding: resolves to a UK outward-code or US-ZIP centroid,
// not a precise address. That's intentional (privacy), but coverage is
// currently a hand-curated starter set of major UK/US areas only.

type NormalizedPostalCode = { country: "GB" | "US"; code: string };

const US_ZIP_RE = /^\d{5}(-\d{4})?$/;
// UK outward code: 1-2 letters, 1-2 digits, optional trailing letter (e.g. SW1A, M1, EC1A)
const UK_OUTWARD_RE = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export function normalizePostalCode(raw: string): NormalizedPostalCode | null {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;

  if (US_ZIP_RE.test(trimmed)) {
    return { country: "US", code: trimmed.slice(0, 5) };
  }

  // UK postcodes are "outward inward" (e.g. "SW1A 1AA"); we only look up by
  // outward code. Accept either the full postcode or just the outward part.
  const outward = trimmed.split(/\s+/)[0];
  if (UK_OUTWARD_RE.test(outward)) {
    return { country: "GB", code: outward };
  }

  return null;
}

export async function resolvePostalCode(raw: string): Promise<{ lat: number; lng: number } | null> {
  const normalized = normalizePostalCode(raw);
  if (!normalized) return null;

  const match = await prisma.postalCodeLocation.findUnique({
    where: { country_code: { country: normalized.country, code: normalized.code } },
  });
  return match ? { lat: match.lat, lng: match.lng } : null;
}
