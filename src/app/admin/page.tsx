import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { TaxonomyEditor } from "./taxonomy-editor";

export default async function AdminPage() {
  if (!(await requireAdmin())) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Admin: reference lists</h1>
      <p className="text-sm text-muted-foreground">
        These lists power the dropdowns on every musician profile. Renaming
        an item updates it everywhere it&apos;s already selected; removing one
        detaches it from any profiles that had it selected.
      </p>
      <TaxonomyEditor title="Instruments" apiBase="/api/admin/instruments" />
      <TaxonomyEditor title="Voice types" apiBase="/api/admin/voice-types" />
      <TaxonomyEditor title="Genres" apiBase="/api/admin/genres" />
      <TaxonomyEditor
        title="Looking for"
        apiBase="/api/admin/looking-for"
        note={`The item named "Other" is special — selecting it on a profile reveals a free-text box. Rename it and that free-text box stops appearing, unless you update src/app/profile/profile-form.tsx to match.`}
      />
    </div>
  );
}
