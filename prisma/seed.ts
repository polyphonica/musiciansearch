// Seeds the admin-editable reference lists (instruments, genres, voice types)
// with a starting set. Uses createMany with skipDuplicates so it's safe to
// re-run without touching rows an admin has since added, edited, or removed
// via the /admin interface — it only ever adds names that don't exist yet.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const INSTRUMENTS = [
  "Voice",
  "Piano",
  "Guitar",
  "Electric Guitar",
  "Bass Guitar",
  "Violin",
  "Viola",
  "Cello",
  "Double Bass",
  "Flute",
  "Piccolo",
  "Oboe",
  "Cor Anglais",
  "Clarinet",
  "Bassoon",
  "Saxophone",
  "Trumpet",
  "French Horn",
  "Trombone",
  "Tuba",
  "Drums / Percussion",
  "Harp",
  "Organ",
  "Accordion",
  "Banjo",
  "Mandolin",
  "Ukulele",
  "Synthesizer / Keyboard",
  "Bagpipes",
  "Handbells",
  // Early music
  "Recorder",
  "Harpsichord",
  "Chamber Organ",
  "Traverso (Baroque Flute)",
  "Baroque Violin",
  "Viola da Gamba",
  "Lute",
  "Theorbo",
  "Cornetto",
  "Sackbut",
];

const GENRES = [
  "Classical (general)",
  "Medieval",
  "Renaissance",
  "Baroque",
  "Classical era",
  "Romantic",
  "Contemporary / New Music",
  "Opera",
  "Choral",
  "Folk / Traditional",
  "Jazz",
  "Musical Theatre",
  "World",
  "Rock / Pop",
  "Electronic",
];

const VOICE_TYPES = [
  "Soprano",
  "Mezzo-Soprano",
  "Alto / Contralto",
  "Countertenor",
  "Tenor",
  "Baritone",
  "Bass",
];

// "Other" is a special name the profile form matches to reveal a free-text
// field (Profile.lookingForOther) — keep it last, and if renamed via /admin,
// update src/app/profile/profile-form.tsx's OTHER_OPTION_NAME to match.
const LOOKING_FOR_OPTIONS = [
  "Band / ensemble member",
  "Accompanist",
  "Duet / occasional playing partner",
  "Jam partner",
  "Sight-reading group",
  "Other",
];

// MVP starter set only — hand-curated approximate centroids for major UK
// outward codes and US ZIP codes, NOT a comprehensive or authoritative
// dataset. Coordinates are city/district-level approximations (intentional,
// for privacy), not verified against an official source. See
// docs/technical-design.md for coverage caveats and how to extend this.
const POSTAL_CODES: { country: "GB" | "US"; code: string; lat: number; lng: number }[] = [
  // UK — major cities
  { country: "GB", code: "SW1A", lat: 51.501, lng: -0.1416 },
  { country: "GB", code: "SW1", lat: 51.4975, lng: -0.1357 },
  { country: "GB", code: "W1", lat: 51.5142, lng: -0.1494 },
  { country: "GB", code: "N1", lat: 51.5362, lng: -0.1033 },
  { country: "GB", code: "E1", lat: 51.5152, lng: -0.0723 },
  { country: "GB", code: "EC1", lat: 51.5246, lng: -0.1 },
  { country: "GB", code: "WC1", lat: 51.5225, lng: -0.125 },
  { country: "GB", code: "NW1", lat: 51.5305, lng: -0.14 },
  { country: "GB", code: "SE1", lat: 51.5045, lng: -0.0865 },
  { country: "GB", code: "B1", lat: 52.48, lng: -1.9025 },
  { country: "GB", code: "M1", lat: 53.4794, lng: -2.2453 },
  { country: "GB", code: "EH1", lat: 55.9533, lng: -3.1883 },
  { country: "GB", code: "BS1", lat: 51.4536, lng: -2.5975 },
  { country: "GB", code: "LS1", lat: 53.796, lng: -1.5476 },
  { country: "GB", code: "OX1", lat: 51.752, lng: -1.2577 },
  { country: "GB", code: "CB1", lat: 52.198, lng: 0.136 },
  { country: "GB", code: "G1", lat: 55.859, lng: -4.247 },
  { country: "GB", code: "L1", lat: 53.4056, lng: -2.984 },
  { country: "GB", code: "S1", lat: 53.3811, lng: -1.4701 },
  { country: "GB", code: "NE1", lat: 54.9738, lng: -1.6131 },
  { country: "GB", code: "NG1", lat: 52.9531, lng: -1.15 },
  { country: "GB", code: "CF10", lat: 51.4816, lng: -3.1791 },
  { country: "GB", code: "BT1", lat: 54.5973, lng: -5.9301 },
  { country: "GB", code: "YO1", lat: 53.959, lng: -1.0815 },
  { country: "GB", code: "BA1", lat: 51.3813, lng: -2.359 },
  { country: "GB", code: "BN1", lat: 50.8225, lng: -0.1372 },
  { country: "GB", code: "NR1", lat: 52.628, lng: 1.2974 },
  { country: "GB", code: "EX1", lat: 50.7236, lng: -3.5275 },
  { country: "GB", code: "SO14", lat: 50.9025, lng: -1.4046 },
  { country: "GB", code: "PO1", lat: 50.7989, lng: -1.0912 },
  { country: "GB", code: "RG1", lat: 51.456, lng: -0.9781 },
  { country: "GB", code: "LE1", lat: 52.6369, lng: -1.1398 },
  { country: "GB", code: "CV1", lat: 52.4081, lng: -1.5106 },
  { country: "GB", code: "DE1", lat: 52.9225, lng: -1.4746 },
  { country: "GB", code: "PL1", lat: 50.3714, lng: -4.1422 },
  { country: "GB", code: "CT1", lat: 51.2802, lng: 1.0789 },
  { country: "GB", code: "SO23", lat: 51.0632, lng: -1.308 },
  { country: "GB", code: "GL50", lat: 51.8994, lng: -2.0783 },
  { country: "GB", code: "GL1", lat: 51.8642, lng: -2.2381 },
  { country: "GB", code: "WR1", lat: 52.1936, lng: -2.22 },
  { country: "GB", code: "HR1", lat: 52.0567, lng: -2.716 },
  { country: "GB", code: "SY1", lat: 52.7069, lng: -2.7527 },
  { country: "GB", code: "CH1", lat: 53.19, lng: -2.89 },
  { country: "GB", code: "LA1", lat: 54.0466, lng: -2.8007 },
  { country: "GB", code: "DH1", lat: 54.7761, lng: -1.5733 },
  { country: "GB", code: "CA1", lat: 54.8951, lng: -2.9382 },
  { country: "GB", code: "AB10", lat: 57.145, lng: -2.094 },
  { country: "GB", code: "DD1", lat: 56.462, lng: -2.9707 },
  { country: "GB", code: "IV1", lat: 57.4778, lng: -4.2247 },
  { country: "GB", code: "SA1", lat: 51.6214, lng: -3.9436 },
  { country: "GB", code: "LL11", lat: 53.0478, lng: -2.9916 },
  { country: "GB", code: "IP1", lat: 52.0567, lng: 1.1482 },
  { country: "GB", code: "CO1", lat: 51.8959, lng: 0.8919 },
  { country: "GB", code: "CM1", lat: 51.7356, lng: 0.4685 },
  { country: "GB", code: "MK9", lat: 52.0406, lng: -0.7594 },
  { country: "GB", code: "NN1", lat: 52.2405, lng: -0.9027 },
  { country: "GB", code: "LU1", lat: 51.8787, lng: -0.42 },
  { country: "GB", code: "PE1", lat: 52.5695, lng: -0.2405 },
  { country: "GB", code: "LN1", lat: 53.2307, lng: -0.5406 },
  { country: "GB", code: "HU1", lat: 53.744, lng: -0.3325 },
  { country: "GB", code: "TS1", lat: 54.5742, lng: -1.235 },
  { country: "GB", code: "SR1", lat: 54.906, lng: -1.381 },
  { country: "GB", code: "PR1", lat: 53.7632, lng: -2.7031 },
  { country: "GB", code: "FY1", lat: 53.8175, lng: -3.0357 },
  { country: "GB", code: "BL1", lat: 53.5769, lng: -2.4282 },
  { country: "GB", code: "BD1", lat: 53.796, lng: -1.759 },
  { country: "GB", code: "WF1", lat: 53.6833, lng: -1.4977 },
  { country: "GB", code: "HD1", lat: 53.6458, lng: -1.785 },
  { country: "GB", code: "S70", lat: 53.5526, lng: -1.4797 },
  { country: "GB", code: "ST1", lat: 53.0027, lng: -2.1794 },
  { country: "GB", code: "WV1", lat: 52.587, lng: -2.1288 },
  { country: "GB", code: "DY1", lat: 52.5091, lng: -2.085 },
  { country: "GB", code: "WS1", lat: 52.5862, lng: -1.9829 },
  { country: "GB", code: "B91", lat: 52.4123, lng: -1.7789 },
  // Added on request after real-world testing found gaps in the starter list
  { country: "GB", code: "LL36", lat: 52.795, lng: -4.087 }, // Dyffryn Ardudwy / Tal-y-bont, Gwynedd
  { country: "GB", code: "BN41", lat: 50.8384, lng: -0.2058 }, // Portslade-by-Sea
  // US — major cities
  { country: "US", code: "10001", lat: 40.7506, lng: -73.9972 },
  { country: "US", code: "90001", lat: 33.9731, lng: -118.2479 },
  { country: "US", code: "60601", lat: 41.8858, lng: -87.6229 },
  { country: "US", code: "77002", lat: 29.7589, lng: -95.3677 },
  { country: "US", code: "85001", lat: 33.4484, lng: -112.074 },
  { country: "US", code: "19102", lat: 39.955, lng: -75.1652 },
  { country: "US", code: "78205", lat: 29.4246, lng: -98.4877 },
  { country: "US", code: "92101", lat: 32.7157, lng: -117.1611 },
  { country: "US", code: "75201", lat: 32.7876, lng: -96.7996 },
  { country: "US", code: "95110", lat: 37.3382, lng: -121.8863 },
  { country: "US", code: "78701", lat: 30.2711, lng: -97.7437 },
  { country: "US", code: "32202", lat: 30.3322, lng: -81.6557 },
  { country: "US", code: "94102", lat: 37.7793, lng: -122.4193 },
  { country: "US", code: "43215", lat: 39.9622, lng: -83.0007 },
  { country: "US", code: "28202", lat: 35.2271, lng: -80.8431 },
  { country: "US", code: "46204", lat: 39.7684, lng: -86.1581 },
  { country: "US", code: "98101", lat: 47.6101, lng: -122.3344 },
  { country: "US", code: "80202", lat: 39.7508, lng: -104.9963 },
  { country: "US", code: "02108", lat: 42.3588, lng: -71.0707 },
  { country: "US", code: "37201", lat: 36.1667, lng: -86.7833 },
  { country: "US", code: "97201", lat: 45.5122, lng: -122.6587 },
  { country: "US", code: "48226", lat: 42.3314, lng: -83.0458 },
  { country: "US", code: "38103", lat: 35.1495, lng: -90.049 },
  { country: "US", code: "21201", lat: 39.2904, lng: -76.6122 },
  { country: "US", code: "53202", lat: 43.0389, lng: -87.9065 },
  { country: "US", code: "87102", lat: 35.0844, lng: -106.6504 },
  { country: "US", code: "85701", lat: 32.2217, lng: -110.9265 },
  { country: "US", code: "93650", lat: 36.7378, lng: -119.7871 },
  { country: "US", code: "95814", lat: 38.5816, lng: -121.4944 },
  { country: "US", code: "64105", lat: 39.1012, lng: -94.5844 },
  { country: "US", code: "30303", lat: 33.7537, lng: -84.3863 },
  { country: "US", code: "33128", lat: 25.7743, lng: -80.1937 },
  { country: "US", code: "27601", lat: 35.7796, lng: -78.6382 },
  { country: "US", code: "68102", lat: 41.2565, lng: -95.9345 },
  { country: "US", code: "55401", lat: 44.9778, lng: -93.265 },
  { country: "US", code: "44113", lat: 41.4993, lng: -81.6944 },
  { country: "US", code: "74103", lat: 36.154, lng: -95.9928 },
  { country: "US", code: "70112", lat: 29.9511, lng: -90.0715 },
  { country: "US", code: "67202", lat: 37.6872, lng: -97.3301 },
  { country: "US", code: "76010", lat: 32.7357, lng: -97.1081 },
  { country: "US", code: "33602", lat: 27.9506, lng: -82.4572 },
  { country: "US", code: "15222", lat: 40.4406, lng: -79.9959 },
  { country: "US", code: "45202", lat: 39.1031, lng: -84.512 },
  { country: "US", code: "63101", lat: 38.627, lng: -90.1994 },
  { country: "US", code: "32801", lat: 28.5384, lng: -81.3789 },
  { country: "US", code: "89101", lat: 36.1699, lng: -115.1398 },
];

async function main() {
  await prisma.instrument.createMany({
    data: INSTRUMENTS.map((name) => ({ name })),
    skipDuplicates: true,
  });
  await prisma.genre.createMany({
    data: GENRES.map((name) => ({ name })),
    skipDuplicates: true,
  });
  await prisma.voiceType.createMany({
    data: VOICE_TYPES.map((name) => ({ name })),
    skipDuplicates: true,
  });
  await prisma.lookingForOption.createMany({
    data: LOOKING_FOR_OPTIONS.map((name) => ({ name })),
    skipDuplicates: true,
  });
  await prisma.postalCodeLocation.createMany({
    data: POSTAL_CODES,
    skipDuplicates: true,
  });

  // System account used to send moderation notifications (see
  // src/lib/system-messages.ts). Left unverified/no-profile-fields so it
  // can never appear in search or messaging results as a normal user.
  await prisma.user.upsert({
    where: { email: "system@musiciansearch.internal" },
    update: {},
    create: {
      email: "system@musiciansearch.internal",
      phone: "+10000000000",
      isAdmin: false,
      profile: { create: { displayName: "MusicianSearch Team" } },
    },
  });

  console.log(
    `Seeded ${INSTRUMENTS.length} instruments, ${GENRES.length} genres, ${VOICE_TYPES.length} voice types, ${LOOKING_FOR_OPTIONS.length} looking-for options, ${POSTAL_CODES.length} postal code areas (existing rows left untouched).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
