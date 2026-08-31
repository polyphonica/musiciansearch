"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RefItem = { id: string; name: string };

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
];

const LOOKING_FOR = [
  { value: "band_member", label: "Band / ensemble member" },
  { value: "accompanist", label: "Accompanist" },
  { value: "jam_partner", label: "Jam partner" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMES = ["morning", "afternoon", "evening"] as const;

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function ProfileForm() {
  const [instruments, setInstruments] = useState<RefItem[]>([]);
  const [genres, setGenres] = useState<RefItem[]>([]);
  const [voiceTypes, setVoiceTypes] = useState<RefItem[]>([]);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [lookingFor, setLookingFor] = useState<Set<string>>(new Set());
  const [instrumentIds, setInstrumentIds] = useState<Set<string>>(new Set());
  const [genreIds, setGenreIds] = useState<Set<string>>(new Set());
  const [voiceTypeIds, setVoiceTypeIds] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/instruments").then((r) => r.json()),
      fetch("/api/admin/genres").then((r) => r.json()),
      fetch("/api/admin/voice-types").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]).then(([instrumentsRes, genresRes, voiceTypesRes, profileRes]) => {
      setInstruments(instrumentsRes.items ?? []);
      setGenres(genresRes.items ?? []);
      setVoiceTypes(voiceTypesRes.items ?? []);

      const profile = profileRes.profile;
      if (profile) {
        setDisplayName(profile.displayName ?? "");
        setBio(profile.bio ?? "");
        setQualifications(profile.qualifications ?? "");
        setLocationLabel(profile.locationLabel ?? "");
        setSkillLevel(profile.skillLevel ?? "");
        setLookingFor(new Set(profile.lookingFor ?? []));
        setInstrumentIds(new Set(profile.instruments.map((i: { instrumentId: string }) => i.instrumentId)));
        setGenreIds(new Set(profile.genres.map((g: { genreId: string }) => g.genreId)));
        setVoiceTypeIds(new Set(profile.voiceTypes.map((v: { voiceTypeId: string }) => v.voiceTypeId)));
        setAvailability(
          new Set(
            profile.availability.map((a: { dayOfWeek: number; timeOfDay: string }) => `${a.dayOfWeek}-${a.timeOfDay}`)
          )
        );
      }
      setLoading(false);
    });
  }, []);

  const isSinger = instruments.some((i) => i.name === "Voice" && instrumentIds.has(i.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        bio,
        qualifications,
        locationLabel,
        skillLevel: skillLevel || null,
        lookingFor: Array.from(lookingFor),
        instrumentIds: Array.from(instrumentIds),
        genreIds: Array.from(genreIds),
        voiceTypeIds: isSinger ? Array.from(voiceTypeIds) : [],
        availability: Array.from(availability).map((key) => {
          const [dayOfWeek, timeOfDay] = key.split("-");
          return { dayOfWeek: Number(dayOfWeek), timeOfDay };
        }),
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Not your legal name — however you want to be known"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationLabel">Location</Label>
          <Input
            id="locationLabel"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder="e.g. Brooklyn, NY — city/region only, never an exact address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Biography</Label>
          <Textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other musicians about yourself"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qualifications">Qualifications / experience</Label>
          <Textarea
            id="qualifications"
            rows={3}
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            placeholder="e.g. ABRSM Grade 8, Trinity Diploma, 10 years teaching experience"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skillLevel">Skill level</Label>
          <select
            id="skillLevel"
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value="">Not specified</option>
            {SKILL_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Looking for</legend>
        {LOOKING_FOR.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={lookingFor.has(opt.value)}
              onCheckedChange={() => setLookingFor(toggle(lookingFor, opt.value))}
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Instruments / voice</legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {instruments.map((i) => (
            <label key={i.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={instrumentIds.has(i.id)}
                onCheckedChange={() => setInstrumentIds(toggle(instrumentIds, i.id))}
              />
              {i.name}
            </label>
          ))}
        </div>
      </fieldset>

      {isSinger && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Voice type(s)</legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {voiceTypes.map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={voiceTypeIds.has(v.id)}
                  onCheckedChange={() => setVoiceTypeIds(toggle(voiceTypeIds, v.id))}
                />
                {v.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Genres</legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {genres.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={genreIds.has(g.id)}
                onCheckedChange={() => setGenreIds(toggle(genreIds, g.id))}
              />
              {g.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Availability</legend>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr>
                <th className="w-20" />
                {DAYS.map((d) => (
                  <th key={d} className="px-2 pb-1 font-medium">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMES.map((time) => (
                <tr key={time}>
                  <td className="pr-2 capitalize text-muted-foreground">{time}</td>
                  {DAYS.map((_, dayIndex) => {
                    const key = `${dayIndex}-${time}`;
                    return (
                      <td key={key} className="px-2 py-1 text-center">
                        <Checkbox
                          checked={availability.has(key)}
                          onCheckedChange={() => setAvailability(toggle(availability, key))}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-primary">Profile saved.</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </motion.form>
  );
}
