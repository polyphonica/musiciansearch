"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = { id: string; name: string };

export function TaxonomyEditor({ title, apiBase }: { title: string; apiBase: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(apiBase);
    const data = await res.json().catch(() => ({ items: [] }));
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetch(apiBase)
      .then((res) => res.json())
      .catch(() => ({ items: [] }))
      .then((data) => {
        setItems(data.items ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't add that item.");
      return;
    }
    setNewName("");
    await load();
  }

  async function removeItem(id: string) {
    setError(null);
    const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't remove that item.");
      return;
    }
    await load();
  }

  async function renameItem(id: string, name: string) {
    setError(null);
    const res = await fetch(`${apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't rename that item.");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">{title}</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <Input
                defaultValue={item.name}
                className="h-7 text-sm"
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== item.name) {
                    renameItem(item.id, e.target.value.trim());
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </Button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-muted-foreground">No items yet.</li>
          )}
        </ul>
      )}
      <form onSubmit={addItem} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`Add a new ${title.toLowerCase().replace(/s$/, "")}…`}
          className="h-8 text-sm"
        />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
