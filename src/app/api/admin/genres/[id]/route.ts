import { prisma } from "@/lib/prisma";
import { deleteTaxonomyItem, renameTaxonomyItem } from "@/lib/taxonomy";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renameTaxonomyItem(prisma.genre, id, request);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteTaxonomyItem(prisma.genre, id);
}
