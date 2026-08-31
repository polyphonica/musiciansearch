import { prisma } from "@/lib/prisma";
import { createTaxonomyItem, listTaxonomy } from "@/lib/taxonomy";

export async function GET() {
  return listTaxonomy(prisma.voiceType);
}

export async function POST(request: Request) {
  return createTaxonomyItem(prisma.voiceType, request);
}
