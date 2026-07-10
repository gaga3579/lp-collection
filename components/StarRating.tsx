import { StarHalfIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";

interface StarRatingProps {
  value: number | null;
  size?: number;
  className?: string;
}

/** Read-only 5-star rating display with half-star support (e.g. 3.5). */
export default function StarRating({
  value,
  size = 14,
  className = "",
}: StarRatingProps) {
  const rating = Number(value ?? 0);
  return (
    <div
      className={`inline-flex items-center gap-0.5 text-ink ${className}`}
      aria-label={value ? `${value} out of 5 stars` : "Not rated"}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rating;
        const half = !filled && n - 0.5 <= rating;
        const Icon = half ? StarHalfIcon : StarIcon;
        return (
          <Icon
            key={n}
            size={size}
            weight={filled || half ? "fill" : "regular"}
            data-filled={filled}
            data-half={half}
            className={filled || half ? "opacity-100" : "opacity-25"}
          />
        );
      })}
    </div>
  );
}
