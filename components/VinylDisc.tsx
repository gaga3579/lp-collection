/**
 * The signature element: a grooved disc, labeled in the record's genre
 * color, peeking out from behind the sleeve.
 */
export default function VinylDisc({
  genreColor,
  out = false,
}: {
  genreColor: string;
  /** Record-detail pose: rests half out, no hover motion. */
  out?: boolean;
}) {
  return (
    <div aria-hidden className={`vinyl-disc ${out ? "vinyl-disc-out" : ""}`}>
      <span className="vinyl-label" style={{ backgroundColor: genreColor }} />
    </div>
  );
}
