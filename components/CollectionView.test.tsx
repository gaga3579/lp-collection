import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Record } from "@/lib/types";

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

vi.mock("@/lib/useWishlist", () => ({
  useWishlist: () => ({ ids: [], count: 2, toggle: vi.fn(), has: () => false }),
}));

import CollectionView from "./CollectionView";

function rec(over: Partial<Record>): Record {
  return {
    id: Math.random().toString(36).slice(2),
    artist: "Artist",
    title: "Title",
    year: 2000,
    genre: "jazz",
    rating: 3,
    notes: null,
    cover_url: null,
    purchase_price: null,
    purchase_date: null,
    condition: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const records: Record[] = [
  rec({
    id: "a",
    artist: "Miles Davis",
    title: "Kind of Blue",
    genre: "jazz",
    year: 1959,
    rating: 5,
    purchase_price: 30000,
    created_at: "2026-01-01T00:00:00.000Z",
  }),
  rec({
    id: "b",
    artist: "The Beatles",
    title: "Abbey Road",
    genre: "rock",
    year: 1969,
    rating: 4,
    purchase_price: 20000,
    created_at: "2026-03-01T00:00:00.000Z",
  }),
  rec({
    id: "c",
    artist: "Aretha Franklin",
    title: "Lady Soul",
    genre: "soul",
    year: 1968,
    rating: 3,
    purchase_price: 10000,
    created_at: "2026-02-01T00:00:00.000Z",
  }),
];

// Title markers in DOM order: the lead album renders as an <h2> hero above
// the <h3> grid cards, so collect both (hero first matches visual order).
function visibleTitles(): string[] {
  return [
    ...screen.queryAllByRole("heading", { level: 2 }),
    ...screen.queryAllByRole("heading", { level: 3 }),
  ].map((h) => h.textContent ?? "");
}

function searchBox() {
  return screen.getByRole("searchbox", { name: "Search artist or title" });
}

describe("CollectionView", () => {
  it("renders every record by default", () => {
    render(<CollectionView records={records} />);
    const titles = visibleTitles();
    expect(titles).toContain("Kind of Blue");
    expect(titles).toContain("Abbey Road");
    expect(titles).toContain("Lady Soul");
  });

  it("filters by genre when a chip is clicked", async () => {
    const user = userEvent.setup();
    render(<CollectionView records={records} />);
    await user.click(screen.getByRole("button", { name: /Rock/ }));
    const titles = visibleTitles();
    expect(titles).toEqual(["Abbey Road"]);
  });

  it("searches across artist and title (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<CollectionView records={records} />);
    const search = searchBox();

    await user.type(search, "aretha");
    expect(visibleTitles()).toEqual(["Lady Soul"]);

    await user.clear(search);
    await user.type(search, "blue");
    expect(visibleTitles()).toEqual(["Kind of Blue"]);
  });

  it("shows an empty-state message when a search matches nothing", async () => {
    const user = userEvent.setup();
    render(<CollectionView records={records} />);
    await user.type(searchBox(), "zzzz");
    expect(screen.getByText("No records match your search.")).toBeInTheDocument();
    expect(visibleTitles()).toEqual([]);
  });

  it("shows the 'no records yet' message when the collection is empty", () => {
    render(<CollectionView records={[]} />);
    expect(
      screen.getByText(/No records yet\. Sign in as the owner/)
    ).toBeInTheDocument();
  });

  it("sorts by recent (newest created_at first) by default", () => {
    render(<CollectionView records={records} />);
    // Newest: Abbey Road (Mar) > Lady Soul (Feb) > Kind of Blue (Jan)
    expect(visibleTitles()).toEqual(["Abbey Road", "Lady Soul", "Kind of Blue"]);
  });

  it("sorts by year descending", async () => {
    const user = userEvent.setup();
    render(<CollectionView records={records} />);
    await user.selectOptions(screen.getByRole("combobox"), "year");
    // 1969 > 1968 > 1959
    expect(visibleTitles()).toEqual(["Abbey Road", "Lady Soul", "Kind of Blue"]);
  });

  it("sorts by rating descending", async () => {
    const user = userEvent.setup();
    render(<CollectionView records={records} />);
    await user.selectOptions(screen.getByRole("combobox"), "rating");
    // 5 > 4 > 3
    expect(visibleTitles()).toEqual(["Kind of Blue", "Abbey Road", "Lady Soul"]);
  });

  it("sorts by artist alphabetically", async () => {
    const user = userEvent.setup();
    render(<CollectionView records={records} />);
    await user.selectOptions(screen.getByRole("combobox"), "artist");
    // Aretha < Miles < The Beatles
    expect(visibleTitles()).toEqual(["Lady Soul", "Kind of Blue", "Abbey Road"]);
  });

  it("combines a genre filter with a search query", async () => {
    const user = userEvent.setup();
    render(<CollectionView records={records} />);
    await user.click(screen.getByRole("button", { name: /Jazz/ }));
    await user.type(searchBox(), "beatles");
    // Beatles is rock, so the jazz filter excludes it -> empty.
    expect(screen.getByText("No records match your search.")).toBeInTheDocument();
  });

  describe("stats band", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("counts up total records and wishlist count once animation settles", () => {
      render(<CollectionView records={records} />);
      act(() => vi.advanceTimersByTime(2000));
      expect(screen.getByText("By the numbers")).toBeInTheDocument();
      // Total records = 3.
      expect(screen.getByText("3")).toBeInTheDocument();
      // Average rating (5+4+3)/3 = 4.0.
      expect(screen.getByText("4.0")).toBeInTheDocument();
      // Total collection value 30000+20000+10000 = ₩ 60,000.
      expect(screen.getByText("₩ 60,000")).toBeInTheDocument();
    });
  });
});
