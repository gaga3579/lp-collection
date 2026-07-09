import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the wishlist hook so the test controls membership + observes toggle.
const toggle = vi.fn();
let wishlistIds: string[] = [];

vi.mock("@/lib/useWishlist", () => ({
  useWishlist: () => ({
    ids: wishlistIds,
    count: wishlistIds.length,
    toggle,
    has: (id: string) => wishlistIds.includes(id),
  }),
}));

import WishlistButton from "./WishlistButton";

describe("WishlistButton", () => {
  beforeEach(() => {
    toggle.mockClear();
    wishlistIds = [];
  });

  it("renders an inactive 'Add to wishlist' button when the id is not saved", () => {
    render(<WishlistButton id="rec-1" />);
    const btn = screen.getByRole("button", { name: "Add to wishlist" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("renders an active 'Remove from wishlist' button when the id is saved", () => {
    wishlistIds = ["rec-1"];
    render(<WishlistButton id="rec-1" />);
    const btn = screen.getByRole("button", { name: "Remove from wishlist" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("calls toggle with the record id when clicked", async () => {
    const user = userEvent.setup();
    render(<WishlistButton id="rec-42" />);
    await user.click(screen.getByRole("button"));
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveBeenCalledWith("rec-42");
  });

  it("colors the heart with the accent token when active", () => {
    wishlistIds = ["rec-1"];
    render(<WishlistButton id="rec-1" />);
    expect(screen.getByRole("button")).toHaveClass("text-accent");
  });

  it("keeps the heart in ink when inactive", () => {
    render(<WishlistButton id="rec-1" />);
    const btn = screen.getByRole("button");
    expect(btn).not.toHaveClass("text-accent");
    expect(btn).toHaveClass("text-ink");
  });

  it("honours a custom icon size", () => {
    const { container } = render(<WishlistButton id="rec-1" size={30} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("30");
    expect(svg?.getAttribute("height")).toBe("30");
  });
});
