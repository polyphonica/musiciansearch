// Dev-only utility: populates the database with a batch of fake, clearly-
// fake musician accounts + profiles for exercising search/browse locally.
// NOT wired into `prisma db seed` / migrations.seed — run explicitly with
// `npm run db:seed-test-musicians`. Refuses to run against NODE_ENV=production
// as a safeguard, same convention as the mock-identity/mock-otp flags.
//
// Idempotent: deletes any existing rows under the fake email domain first,
// then recreates a fresh batch, so re-running gives a clean, consistent set.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed test musicians in a production environment.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_EMAIL_DOMAIN = "test.musiciansearch.invalid";
const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "professional"] as const;
const LOCATIONS = [
  "Brooklyn, NY",
  "Oxford, UK",
  "Bristol, UK",
  "Austin, TX",
  "Edinburgh, UK",
  "Manchester, UK",
  "Portland, OR",
  "Cambridge, UK",
  "Leeds, UK",
  "Chicago, IL",
];
const BIOS = [
  "Amateur player looking for others of a similar standard to play with regularly.",
  "Play mostly for fun — happy to try new genres and meet other musicians locally.",
  "Trained musician now playing mainly as a hobby alongside a full-time job.",
  "Returning to music after a long break and looking to build up playing experience again.",
  "Enjoy small-group playing more than solo practice — always keen to hear from others nearby.",
  "Semi-professional, teaches as well as performs, open to occasional collaborations.",
  "Started learning as an adult and would love a patient, similarly-paced playing partner.",
  "Long-standing member of a local ensemble looking to expand the circle of people to play with.",
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FIRST_NAMES = [
  "Alice", "Ben", "Clara", "David", "Elena", "Frank", "Grace", "Henry",
  "Isla", "James", "Kate", "Liam", "Maya", "Noah", "Olive", "Peter",
  "Ruth", "Sam", "Tara", "Umar", "Vera", "Will", "Yuki", "Zoe",
];
const LAST_NAMES = [
  "Adams", "Brooks", "Chen", "Diaz", "Evans", "Fischer", "Gupta", "Harris",
  "Ito", "Jones", "Khan", "Lewis", "Martin", "Nolan", "Ortiz", "Patel",
  "Quinn", "Reid", "Silva", "Turner", "Ueda", "Vance", "Ward", "Yates",
];

async function main() {
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } } });

  const [instruments, genres, voiceTypes, lookingForOptions] = await Promise.all([
    prisma.instrument.findMany(),
    prisma.genre.findMany(),
    prisma.voiceType.findMany(),
    prisma.lookingForOption.findMany(),
  ]);

  if (instruments.length === 0 || genres.length === 0 || lookingForOptions.length === 0) {
    console.error("Reference lists are empty — run `npx prisma db seed` first.");
    process.exit(1);
  }

  const voiceInstrument = instruments.find((i) => i.name === "Voice");

  const count = Math.min(24, FIRST_NAMES.length);
  for (let i = 0; i < count; i++) {
    const displayName = `${FIRST_NAMES[i]} ${pickOne(LAST_NAMES)}`;
    const email = `${displayName.toLowerCase().replace(/\s+/g, ".")}@${TEST_EMAIL_DOMAIN}`;
    const phone = `+15550100${String(i).padStart(2, "0")}`; // 555-0100-0199: reserved for fictional use

    const selectedInstruments = pick(instruments, 1 + Math.floor(Math.random() * 3));
    const isSinger = selectedInstruments.some((i) => i.id === voiceInstrument?.id);
    const selectedVoiceTypes = isSinger && voiceTypes.length > 0 ? pick(voiceTypes, 1) : [];
    const selectedGenres = pick(genres, 1 + Math.floor(Math.random() * 3));
    const selectedLookingFor = pick(lookingForOptions, 1 + Math.floor(Math.random() * 2));

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        phoneVerifiedAt: new Date(),
        identityVerifiedAt: new Date(),
        status: "active",
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName,
        bio: pickOne(BIOS),
        locationLabel: pickOne(LOCATIONS),
        skillLevel: pickOne([...SKILL_LEVELS]),
        instruments: { create: selectedInstruments.map((i) => ({ instrumentId: i.id })) },
        genres: { create: selectedGenres.map((g) => ({ genreId: g.id })) },
        voiceTypes: { create: selectedVoiceTypes.map((v) => ({ voiceTypeId: v.id })) },
        lookingFor: { create: selectedLookingFor.map((l) => ({ lookingForOptionId: l.id })) },
        availability: {
          create: shuffle(
            Array.from({ length: 7 }, (_, day) =>
              ["morning", "afternoon", "evening"].map((time) => ({ dayOfWeek: day, timeOfDay: time }))
            ).flat()
          ).slice(0, 1 + Math.floor(Math.random() * 3)),
        },
      },
    });
  }

  console.log(`Created ${count} test musicians under @${TEST_EMAIL_DOMAIN}.`);
  console.log(`Re-run this script anytime for a fresh batch, or remove them with:`);
  console.log(`  DELETE FROM users WHERE email LIKE '%@${TEST_EMAIL_DOMAIN}';`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
