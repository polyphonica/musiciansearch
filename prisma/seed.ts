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
  console.log(
    `Seeded ${INSTRUMENTS.length} instruments, ${GENRES.length} genres, ${VOICE_TYPES.length} voice types (existing rows left untouched).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
