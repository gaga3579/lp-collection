import { GENRE_COLORS, GENRE_LABELS, type Genre } from "@/lib/types";

/** Small color dot keyed to a genre. */
export default function GenreDot({
  genre,
  size = 9,
}: {
  genre: Genre;
  size?: number;
}) {
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: GENRE_COLORS[genre] ?? GENRE_COLORS.other,
      }}
      title={GENRE_LABELS[genre] ?? genre}
    />
  );
}
