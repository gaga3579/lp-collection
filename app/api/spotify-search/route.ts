import { NextResponse, type NextRequest } from "next/server";

// Cache the client-credentials token in module scope between requests.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.value;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

interface SpotifyImage {
  url: string;
}
interface SpotifyAlbum {
  name: string;
  release_date: string;
  images: SpotifyImage[];
  artists: { name: string }[];
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { error: "Spotify is not configured on the server." },
      { status: 501 }
    );
  }

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "album");
  url.searchParams.set("limit", "8");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Spotify search failed." },
      { status: res.status }
    );
  }

  const data = (await res.json()) as {
    albums?: { items: SpotifyAlbum[] };
  };

  const results = (data.albums?.items ?? []).map((album) => ({
    artist: album.artists.map((a) => a.name).join(", "),
    title: album.name,
    year: album.release_date
      ? parseInt(album.release_date.slice(0, 4), 10)
      : null,
    cover_url: album.images[0]?.url ?? null,
  }));

  return NextResponse.json({ results });
}
