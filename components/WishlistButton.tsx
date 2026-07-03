"use client";

import { useWishlist } from "@/lib/useWishlist";

/** Heart toggle backed by the localStorage wishlist. */
export default function WishlistButton({
  id,
  size = 18,
}: {
  id: string;
  size?: number;
}) {
  const { has, toggle } = useWishlist();
  const active = has(id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className="grid place-items-center rounded-full bg-canvas/90 p-2.5 backdrop-blur transition hover:scale-105"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? "#b34a3a" : "none"}
        stroke={active ? "#b34a3a" : "#141412"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
