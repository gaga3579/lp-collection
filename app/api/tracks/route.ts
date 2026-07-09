import { NextResponse, type NextRequest } from "next/server";

// The iTunes Search API is unauthenticated and free, unlike Spotify's Web
// API (whose track preview_url field was deprecated for new apps in late
// 2024). It still reliably returns 30-second preview clips per track.
const ITUNES_BASE = "https://itunes.apple.com";

interface ItunesCollection {
  wrapperType: "collection";
  collectionId: number;
  artistName: string;
  collectionName: string;
}

interface ItunesTrack {
  wrapperType: "track";
  kind?: string;
  trackId: number;
  trackName: string;
  trackNumber: number;
  discNumber: number;
  trackTimeMillis?: number;
  previewUrl?: string;
}

export interface TrackResult {
  id: number;
  number: number;
  title: string;
  durationMs: number | null;
  previewUrl: string | null;
}

async function findAlbumId(artist: string, title: string): Promise<number | null> {
  const url = new URL(`${ITUNES_BASE}/search`);
  url.searchParams.set("term", `${artist} ${title}`);
  url.searchParams.set("entity", "album");
  url.searchParams.set("limit", "5");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`iTunes album search failed (${res.status})`);

  const data = (await res.json()) as { results?: ItunesCollection[] };
  const items = data.results ?? [];
  if (items.length === 0) return null;

  // Prefer an exact (case-insensitive) artist + album match; fall back to
  // iTunes's own top result, since its relevance ranking is usually good.
  const exact = items.find(
    (item) =>
      item.artistName.toLowerCase() === artist.toLowerCase() &&
      item.collectionName.toLowerCase() === title.toLowerCase()
  );
  return (exact ?? items[0]).collectionId;
}

async function fetchTracks(collectionId: number): Promise<TrackResult[]> {
  const url = new URL(`${ITUNES_BASE}/lookup`);
  url.searchParams.set("id", String(collectionId));
  url.searchParams.set("entity", "song");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`iTunes track lookup failed (${res.status})`);

  const data = (await res.json()) as {
    results?: (ItunesCollection | ItunesTrack)[];
  };
  const tracks = (data.results ?? []).filter(
    (item): item is ItunesTrack =>
      item.wrapperType === "track" && (item as ItunesTrack).kind === "song"
  );

  return tracks
    .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber)
    .map((t) => ({
      id: t.trackId,
      number: t.trackNumber,
      title: t.trackName,
      durationMs: t.trackTimeMillis ?? null,
      previewUrl: t.previewUrl ?? null,
    }));
}

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist")?.trim();
  const title = request.nextUrl.searchParams.get("title")?.trim();
  if (!artist || !title) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const collectionId = await findAlbumId(artist, title);
    if (collectionId == null) {
      return NextResponse.json({ tracks: [] });
    }
    const tracks = await fetchTracks(collectionId);
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the track catalog." },
      { status: 502 }
    );
  }
}
