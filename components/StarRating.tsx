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
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={value ? `${value} out of 5 stars` : "Not rated"}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={n <= rating ? "#1a1a1a" : "none"}
          stroke="#1a1a1a"
          strokeWidth="1.5"
          className={n <= rating ? "opacity-100" : "opacity-25"}
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
        </svg>
      ))}
    </div>
  );
}
