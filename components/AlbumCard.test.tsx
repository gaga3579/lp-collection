import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Record } from "@/lib/types";

// next/link -> plain anchor so we can assert href.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// WishlistButton pulls in the localStorage-backed hook; stub it out.
vi.mock("@/lib/useWishlist", () => ({
  useWishlist: () => ({
    ids: [],
    count: 0,
    toggle: vi.fn(),
    has: () => false,
  }),
}));

import AlbumCard from "./AlbumCard";

const baseRecord: Record = {
  id: "abc",
  artist: "Miles Davis",
  title: "Kind of Blue",
  year: 1959,
  genre: "jazz",
  rating: 4,
  notes: null,
  cover_url: "https://example.com/cover.jpg",
  purchase_price: 25000,
  purchase_date: "2024-01-01",
  condition: "vg+",
  created_at: "2026-05-31T00:00:00.000Z",
};

function renderCard(overrides: Partial<Record> = {}, featured = false) {
  return render(<AlbumCard record={{ ...baseRecord, ...overrides }} featured={featured} />);
}

describe("AlbumCard", () => {
  it("links to the record detail page", () => {
    renderCard();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/record/abc");
  });

  it("shows artist, title, and genre label", () => {
    renderCard();
    expect(screen.getByText("Miles Davis")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kind of Blue" })).toBeInTheDocument();
    expect(screen.getByText("Jazz")).toBeInTheDocument();
  });

  it("renders the cover image with an alt derived from the title", () => {
    renderCard();
    const img = screen.getByAltText("Kind of Blue cover") as HTMLImageElement;
    expect(img).toHaveAttribute("src", "https://example.com/cover.jpg");
  });

  it("falls back to a music glyph when there is no cover", () => {
    renderCard({ cover_url: null });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("♪")).toBeInTheDocument(); // ♪
  });

  it("shows the year, or an em dash when missing", () => {
    renderCard();
    expect(screen.getByText("1959")).toBeInTheDocument();
    const { container } = renderCard({ year: null });
    expect(within(container).getByText("—")).toBeInTheDocument(); // —
  });

  it("shows the KST-formatted created date in featured (hero) mode", () => {
    renderCard({}, true);
    // 2026-05-31T00:00:00Z -> KST (+9h) -> 2026. 05. 31 09:00.
    // The "등록 " prefix and the date are separate text nodes, so match the
    // date with a substring matcher.
    expect(screen.getByText("2026. 05. 31 09:00", { exact: false })).toBeInTheDocument();
  });

  it("renders the rating as a star control", () => {
    renderCard();
    expect(screen.getByLabelText("4 out of 5 stars")).toBeInTheDocument();
  });

  it("does NOT show the created date in normal (grid) mode", () => {
    renderCard({}, false);
    // The 등록-date line is part of the hero info column only.
    expect(screen.queryByText("2026. 05. 31 09:00", { exact: false })).not.toBeInTheDocument();
  });

  it("renders the hero info column in featured mode", () => {
    renderCard({}, true);
    // Title is promoted to an <h2>, with the eyebrow and the serif
    // "artist, year" line beside the large cover.
    expect(screen.getByRole("heading", { level: 2, name: "Kind of Blue" })).toBeInTheDocument();
    expect(screen.getByText(/Latest addition/)).toBeInTheDocument();
    expect(screen.getByText("Miles Davis, 1959")).toBeInTheDocument();
  });

  it("renders an unknown genre value verbatim", () => {
    // Defensive: GENRE_LABELS lookup falls back to the raw value.
    renderCard({ genre: "krautrock" as Record["genre"] });
    expect(screen.getByText("krautrock")).toBeInTheDocument();
  });
});
