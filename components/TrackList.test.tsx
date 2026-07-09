import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackList from "./TrackList";
import type { TrackResult } from "@/app/api/tracks/route";

const TRACKS: TrackResult[] = [
  {
    id: 1,
    number: 1,
    title: "So What",
    durationMs: 561000,
    previewUrl: "https://preview/so-what.m4a",
  },
  {
    id: 2,
    number: 2,
    title: "Freddie Freeloader",
    durationMs: 590000,
    previewUrl: null,
  },
];

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
    Promise.resolve()
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

describe("TrackList", () => {
  it("requests the tracklist with the encoded artist and title", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ tracks: [] }));
    vi.stubGlobal("fetch", fetchMock);

    render(<TrackList artist="Miles Davis" title="Kind of Blue" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("artist=Miles%20Davis");
    expect(url).toContain("title=Kind%20of%20Blue");
  });

  it("renders each track's number, title, and duration once loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ tracks: TRACKS })));

    render(<TrackList artist="Miles Davis" title="Kind of Blue" />);

    expect(await screen.findByText("So What")).toBeInTheDocument();
    expect(screen.getByText("9:21")).toBeInTheDocument();
    expect(screen.getByText("Freddie Freeloader")).toBeInTheDocument();
  });

  it("shows a not-found message when the album has no tracklist", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ tracks: [] })));

    render(<TrackList artist="Obscure" title="Demo" />);

    expect(
      await screen.findByText("No tracklist found for this record.")
    ).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, false)));

    render(<TrackList artist="Miles Davis" title="Kind of Blue" />);

    expect(
      await screen.findByText("Couldn't reach the track catalog.")
    ).toBeInTheDocument();
  });

  it("plays a track's preview on click and swaps the button to pause", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ tracks: TRACKS })));
    const user = userEvent.setup();

    render(<TrackList artist="Miles Davis" title="Kind of Blue" />);
    const playButton = await screen.findByRole("button", { name: "Play So What" });

    await user.click(playButton);

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Pause So What" })
    ).toBeInTheDocument();
  });

  it("pauses a playing track on a second click", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ tracks: TRACKS })));
    const user = userEvent.setup();

    render(<TrackList artist="Miles Davis" title="Kind of Blue" />);
    await user.click(await screen.findByRole("button", { name: "Play So What" }));
    await user.click(await screen.findByRole("button", { name: "Pause So What" }));

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Play So What" })
    ).toBeInTheDocument();
  });

  it("disables tracks with no preview available", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ tracks: TRACKS })));

    render(<TrackList artist="Miles Davis" title="Kind of Blue" />);
    const button = await screen.findByRole("button", {
      name: "Freddie Freeloader, no preview available",
    });

    expect(button).toBeDisabled();
  });
});
