import { StarIcon } from "@phosphor-icons/react/dist/ssr";

interface StarRatingProps {
  value: number | null;
  size?: number;
  className?: string;
}

/** Read-only 5-star rating display. */
export default function StarRating({
  value,
  size = 14,
  className = "",
}: StarRatingProps) {
  const rating = value ?? 0;
  return (
    <div
      className={`inline-flex items-center gap-0.5 text-ink ${className}`}
      aria-label={value ? `${value} out of 5 stars` : "Not rated"}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rating;
        return (
          <StarIcon
            key={n}
            size={size}
            weight={filled ? "fill" : "regular"}
            data-filled={filled}
            className={filled ? "opacity-100" : "opacity-25"}
          />
        );
      })}
    </div>
  );
}
