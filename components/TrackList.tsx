"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { formatDuration } from "@/lib/format";
import type { TrackResult } from "@/app/api/tracks/route";

/**
 * 30-second previews for the record's tracklist, resolved from the iTunes
 * catalog by artist + album title (no API key required). A single <audio>
 * element backs playback so starting one track always stops another.
 */
export default function TrackList({
  artist,
  title,
}: {
  artist: string;
  title: string;
}) {
  const [tracks, setTracks] = useState<TrackResult[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial render state (tracks: null, failed: false) already reads as
    // "loading" — the effect only needs to set state from its async
    // callbacks, never synchronously in the body.
    const controller = new AbortController();

    fetch(
      `/api/tracks?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { tracks: TrackResult[] }) => setTracks(data.tracks))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setFailed(true);
        setTracks([]);
      });

    return () => controller.abort();
  }, [artist, title]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onEnded = () => setPlayingId(null);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  function toggle(track: TrackResult) {
    const audio = audioRef.current;
    if (!audio || !track.previewUrl) return;

    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.src = track.previewUrl;
    audio.play();
    setPlayingId(track.id);
  }

  if (tracks == null) {
    return (
      <div className="mt-9 border-t border-line pt-8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          Preview
        </p>
        <div className="mt-5 space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-4 w-full animate-pulse rounded bg-line"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="mt-9 border-t border-line pt-8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          Preview
        </p>
        <p className="mt-4 text-sm text-muted">
          {failed
            ? "Couldn't reach the track catalog."
            : "No tracklist found for this record."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-9 border-t border-line pt-8">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
        Preview
      </p>
      <ul className="mt-4">
        {tracks.map((track) => {
          const isPlaying = playingId === track.id;
          const disabled = !track.previewUrl;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => toggle(track)}
                disabled={disabled}
                aria-label={
                  disabled
                    ? `${track.title}, no preview available`
                    : isPlaying
                      ? `Pause ${track.title}`
                      : `Play ${track.title}`
                }
                className={`group/track flex w-full items-center gap-4 rounded-md py-2.5 text-left transition ${
                  disabled
                    ? "cursor-default opacity-40"
                    : "hover:bg-card"
                }`}
              >
                <span
                  className={`grid h-7 w-7 flex-none place-items-center rounded-full border transition ${
                    isPlaying
                      ? "border-accent text-accent"
                      : "border-line text-muted group-hover/track:border-ink group-hover/track:text-ink"
                  }`}
                >
                  {isPlaying ? (
                    <PauseIcon size={12} weight="fill" />
                  ) : (
                    <PlayIcon size={12} weight="fill" />
                  )}
                </span>
                <span className="w-5 flex-none text-[13px] tabular-nums text-muted">
                  {track.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px]">
                  {track.title}
                </span>
                {track.durationMs != null && (
                  <span className="flex-none text-[13px] tabular-nums text-muted">
                    {formatDuration(track.durationMs)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
