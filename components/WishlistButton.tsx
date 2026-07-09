"use client";

import { HeartIcon } from "@phosphor-icons/react";
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
      className={`grid place-items-center rounded-full bg-canvas/90 p-2.5 backdrop-blur transition hover:scale-105 active:scale-95 ${
        active ? "text-accent" : "text-ink"
      }`}
    >
      <HeartIcon size={size} weight={active ? "fill" : "regular"} />
    </button>
  );
}
