export type Genre =
  | "jazz"
  | "rock"
  | "soul"
  | "rnb"
  | "rap"
  | "pop"
  | "electronic"
  | "classical"
  | "other";

export type Condition = "mint" | "vg+" | "vg" | "g";

export interface Record {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: Genre;
  rating: number | null;
  notes: string | null;
  cover_url: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  condition: Condition | null;
  created_at: string;
}

// A record without server-generated fields, used for inserts/updates from the admin form.
export type RecordInput = Omit<Record, "id" | "created_at">;

export const GENRES: Genre[] = [
  "jazz",
  "rock",
  "soul",
  "rnb",
  "rap",
  "pop",
  "electronic",
  "classical",
  "other",
];

// Display labels — needed because some values (rnb) don't capitalize cleanly.
export const GENRE_LABELS: { [K in Genre]: string } = {
  jazz: "Jazz",
  rock: "Rock",
  soul: "Soul",
  rnb: "R&B",
  rap: "Rap",
  pop: "Pop",
  electronic: "Electronic",
  classical: "Classical",
  other: "Other",
};

// Distinct hue per genre for the color dots and chart bars.
export const GENRE_COLORS: { [K in Genre]: string } = {
  jazz: "#2f8f83", // teal/green
  rock: "#d1492f", // red/orange
  soul: "#7a4fa3", // purple
  rnb: "#c2407d", // magenta
  rap: "#d98a1f", // amber
  pop: "#d4759b", // pink
  electronic: "#3a7bd5", // blue
  classical: "#c79a3a", // warm gold
  other: "#8a8378", // gray
};

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "mint", label: "Mint (M)" },
  { value: "vg+", label: "Very Good Plus (VG+)" },
  { value: "vg", label: "Very Good (VG)" },
  { value: "g", label: "Good (G)" },
];

export type SortKey = "recent" | "year" | "rating" | "artist";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "year", label: "Year" },
  { value: "rating", label: "Rating" },
  { value: "artist", label: "Artist" },
];
