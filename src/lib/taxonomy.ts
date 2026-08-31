import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// Shared CRUD logic for the three admin-editable reference lists (instruments,
// genres, voice types) — structurally identical (id, unique name), so each
// route.ts just wires one of these to its Prisma delegate.
type TaxonomyItem = { id: string; name: string };
type TaxonomyDelegate = {
  findMany: (args: { orderBy: { name: "asc" } }) => Promise<TaxonomyItem[]>;
  create: (args: { data: { name: string } }) => Promise<TaxonomyItem>;
  update: (args: { where: { id: string }; data: { name: string } }) => Promise<TaxonomyItem>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

export async function listTaxonomy(delegate: TaxonomyDelegate) {
  const items = await delegate.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ items });
}

function parseName(body: unknown): string | null {
  const name = (body as { name?: unknown })?.name;
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100 ? trimmed : null;
}

export async function createTaxonomyItem(delegate: TaxonomyDelegate, request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const name = parseName(await request.json().catch(() => null));
  if (!name) {
    return NextResponse.json({ error: "A name (1-100 characters) is required." }, { status: 400 });
  }
  try {
    const item = await delegate.create({ data: { name } });
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "That name already exists." }, { status: 409 });
  }
}

export async function renameTaxonomyItem(delegate: TaxonomyDelegate, id: string, request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const name = parseName(await request.json().catch(() => null));
  if (!name) {
    return NextResponse.json({ error: "A name (1-100 characters) is required." }, { status: 400 });
  }
  try {
    const item = await delegate.update({ where: { id }, data: { name } });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Couldn't rename that item." }, { status: 409 });
  }
}

export async function deleteTaxonomyItem(delegate: TaxonomyDelegate, id: string) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  try {
    await delegate.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Couldn't delete that item." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
