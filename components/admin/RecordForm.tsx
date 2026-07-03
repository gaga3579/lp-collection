"use client";

import { useId, useState } from "react";
import {
  CONDITIONS,
  GENRES,
  GENRE_LABELS,
  type Genre,
  type Condition,
  type Record,
  type RecordInput,
} from "@/lib/types";

interface SpotifyResult {
  artist: string;
  title: string;
  year: number | null;
  cover_url: string | null;
}

const EMPTY: RecordInput = {
  artist: "",
  title: "",
  year: null,
  genre: "other",
  rating: null,
  notes: null,
  cover_url: null,
  purchase_price: null,
  purchase_date: null,
  condition: null,
};

function fromRecord(r: Record): RecordInput {
  const { id: _id, created_at: _created, ...rest } = r;
  void _id;
  void _created;
  return rest;
}

export default function RecordForm({
  initial,
  onSubmit,
  onCancel,
  saving,
}: {
  initial?: Record;
  onSubmit: (values: RecordInput) => void;
  onCancel?: () => void;
  saving?: boolean;
}) {
  const [values, setValues] = useState<RecordInput>(
    initial ? fromRecord(initial) : EMPTY
  );
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [results, setResults] = useState<SpotifyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const spotifyId = useId();
  const dateId = useId();
  const notesId = useId();

  function set<K extends keyof RecordInput>(key: K, value: RecordInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function runSpotifySearch() {
    if (!spotifyQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/spotify-search?q=${encodeURIComponent(spotifyQuery)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed.");
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      setSearchError("Could not reach the search service.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function applyResult(r: SpotifyResult) {
    setValues((v) => ({
      ...v,
      artist: r.artist,
      title: r.title,
      year: r.year,
      cover_url: r.cover_url,
    }));
    setResults([]);
    setSpotifyQuery("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-6"
    >
      {/* Spotify search */}
      <div className="rounded-lg border border-line bg-canvas p-4">
        <label
          htmlFor={spotifyId}
          className="text-xs uppercase tracking-wide text-muted"
        >
          Spotify lookup
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={spotifyId}
            value={spotifyQuery}
            onChange={(e) => setSpotifyQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runSpotifySearch();
              }
            }}
            placeholder="e.g. Miles Davis Kind of Blue"
            className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={runSpotifySearch}
            disabled={searching}
            className="rounded-md bg-ink px-4 py-2 text-sm text-card disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        {searchError && (
          <p role="alert" className="mt-2 text-sm text-[#b34a3a]">
            {searchError}
          </p>
        )}
        {results.length > 0 && (
          <ul className="mt-3 max-h-60 space-y-1 overflow-auto">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => applyResult(r)}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-card"
                >
                  {r.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.cover_url}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{r.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {r.artist} · {r.year ?? "—"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Core fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Artist"
          value={values.artist}
          onChange={(v) => set("artist", v)}
          required
        />
        <TextField
          label="Title"
          value={values.title}
          onChange={(v) => set("title", v)}
          required
        />
        <NumberField
          label="Year"
          value={values.year}
          onChange={(v) => set("year", v)}
        />
        <SelectField
          label="Genre"
          value={values.genre}
          options={GENRES.map((g) => ({ value: g, label: GENRE_LABELS[g] }))}
          onChange={(v) => set("genre", v as Genre)}
        />
        <SelectField
          label="Rating"
          value={values.rating != null ? String(values.rating) : ""}
          options={[
            { value: "", label: "Unrated" },
            ...[1, 2, 3, 4, 5].map((n) => ({
              value: String(n),
              label: `${n} ★`,
            })),
          ]}
          onChange={(v) => set("rating", v ? Number(v) : null)}
        />
        <SelectField
          label="Condition"
          value={values.condition ?? ""}
          options={[
            { value: "", label: "—" },
            ...CONDITIONS.map((c) => ({ value: c.value, label: c.label })),
          ]}
          onChange={(v) => set("condition", (v || null) as Condition | null)}
        />
        <NumberField
          label="Purchase price"
          value={values.purchase_price}
          step="0.01"
          onChange={(v) => set("purchase_price", v)}
        />
        <div>
          <label
            htmlFor={dateId}
            className="text-xs uppercase tracking-wide text-muted"
          >
            Purchase date
          </label>
          <input
            id={dateId}
            type="date"
            value={values.purchase_date ?? ""}
            onChange={(e) => set("purchase_date", e.target.value || null)}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
      </div>

      <TextField
        label="Cover URL"
        value={values.cover_url ?? ""}
        onChange={(v) => set("cover_url", v || null)}
      />

      <div>
        <label
          htmlFor={notesId}
          className="text-xs uppercase tracking-wide text-muted"
        >
          Notes
        </label>
        <textarea
          id={notesId}
          value={values.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
          rows={3}
          className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-6 py-2.5 text-sm text-card disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add record"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-6 py-2.5 text-sm transition hover:border-ink"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs uppercase tracking-wide text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs uppercase tracking-wide text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs uppercase tracking-wide text-muted"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm capitalize outline-none focus:border-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
