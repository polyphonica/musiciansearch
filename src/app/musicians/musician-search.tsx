"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RefItem = { id: string; name: string };
type Result = {
  id: string;
  displayName: string;
  bio: string | null;
  locationLabel: string | null;
  skillLevel: string | null;
  instruments: string[];
  genres: string[];
};

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
];

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MusicianSearch() {
  const [instruments, setInstruments] = useState<RefItem[]>([]);
  const [genres, setGenres] = useState<RefItem[]>([]);
  const [voiceTypes, setVoiceTypes] = useState<RefItem[]>([]);
  const [lookingForOptions, setLookingForOptions] = useState<RefItem[]>([]);

  const [q, setQ] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [genreId, setGenreId] = useState("");
  const [voiceTypeId, setVoiceTypeId] = useState("");
  const [lookingForOptionId, setLookingForOptionId] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const [results, setResults] = useState<Result[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/instruments").then((r) => r.json()),
      fetch("/api/admin/genres").then((r) => r.json()),
      fetch("/api/admin/voice-types").then((r) => r.json()),
      fetch("/api/admin/looking-for").then((r) => r.json()),
    ]).then(([i, g, v, l]) => {
      setInstruments(i.items ?? []);
      setGenres(g.items ?? []);
      setVoiceTypes(v.items ?? []);
      setLookingForOptions(l.items ?? []);
    });
  }, []);

  function runSearch(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (instrumentId) params.set("instrumentId", instrumentId);
    if (genreId) params.set("genreId", genreId);
    if (voiceTypeId) params.set("voiceTypeId", voiceTypeId);
    if (lookingForOptionId) params.set("lookingForOptionId", lookingForOptionId);
    if (skillLevel) params.set("skillLevel", skillLevel);
    params.set("page", String(nextPage));

    fetch(`/api/musicians?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setResults((prev) => (nextPage === 1 ? data.results : [...prev, ...data.results]));
        setHasMore(data.hasMore);
        setTotal(data.total);
        setPage(nextPage);
        setLoading(false);
      });
  }

  useEffect(() => {
    runSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, instrumentId, genreId, voiceTypeId, lookingForOptionId, skillLevel]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or bio…"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SelectField
            label="Instrument"
            value={instrumentId}
            onChange={setInstrumentId}
            options={instruments.map((i) => ({ value: i.id, label: i.name }))}
          />
          <SelectField
            label="Genre"
            value={genreId}
            onChange={setGenreId}
            options={genres.map((g) => ({ value: g.id, label: g.name }))}
          />
          <SelectField
            label="Voice type"
            value={voiceTypeId}
            onChange={setVoiceTypeId}
            options={voiceTypes.map((v) => ({ value: v.id, label: v.name }))}
          />
          <SelectField
            label="Looking for"
            value={lookingForOptionId}
            onChange={setLookingForOptionId}
            options={lookingForOptions.map((l) => ({ value: l.id, label: l.name }))}
          />
          <SelectField
            label="Skill level"
            value={skillLevel}
            onChange={setSkillLevel}
            options={SKILL_LEVELS}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading && page === 1 ? "Searching…" : `${total} musician${total === 1 ? "" : "s"} found`}
      </p>

      <ul className="space-y-3">
        {results.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <Link href={`/musicians/${r.id}`} className="font-medium hover:underline">
              {r.displayName}
            </Link>
            {r.locationLabel && (
              <span className="ml-2 text-sm text-muted-foreground">{r.locationLabel}</span>
            )}
            {r.bio && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.bio}</p>}
            {(r.instruments.length > 0 || r.genres.length > 0) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {[...r.instruments, ...r.genres].join(" · ")}
              </p>
            )}
          </li>
        ))}
        {!loading && results.length === 0 && (
          <li className="text-sm text-muted-foreground">No musicians match those filters yet.</li>
        )}
      </ul>

      {hasMore && (
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            runSearch(page + 1);
          }}
          disabled={loading}
        >
          {loading ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
