import { MusicianSearch } from "./musician-search";

export default function MusiciansPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Find musicians</h1>
        <p className="text-sm text-muted-foreground">
          Every musician shown here has completed identity verification.
        </p>
      </div>
      <MusicianSearch />
    </div>
  );
}
