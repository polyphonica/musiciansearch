"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = { id: string; name: string };

function TaxonomyRow({
  item,
  onRename,
  onRemove,
}: {
  item: Item;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState(item.name);

  return (
    <li className="flex items-center gap-2">
      <Input
        value={name}
        className="h-7 text-sm"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (trimmed && trimmed !== item.name) onRename(item.id, trimmed);
          else setName(item.name);
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => onRemove(item.id)}>
        Remove
      </Button>
    </li>
  );
}

export function TaxonomyEditor({
  title,
  apiBase,
  note,
}: {
  title: string;
  apiBase: string;
  note?: string;
}) {
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
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <TaxonomyRow key={item.id} item={item} onRename={renameItem} onRemove={removeItem} />
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
