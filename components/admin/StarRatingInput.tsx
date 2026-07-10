"use client";

import { useRef, useState } from "react";
import { StarIcon, XIcon } from "@phosphor-icons/react/dist/ssr";

const STEP = 0.5;
const MAX = 5;
const STARS = [1, 2, 3, 4, 5];
const GAP = 2; // px — must match the gap-0.5 between stars below

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
}

/**
 * Star rating input in half-star steps. Drag (mouse or touch) or click across
 * the stars to scrub the fill; arrow keys nudge by 0.5; Delete clears. The
 * fill width eases between steps so scrubbing feels smooth.
 */
export default function StarRatingInput({
  value,
  onChange,
  size = 26,
}: StarRatingInputProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [preview, setPreview] = useState<number | null>(null);

  const shown = preview ?? value ?? 0;

  function valueFromX(clientX: number): number {
    const track = trackRef.current;
    if (!track || !Number.isFinite(clientX)) return STEP;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return STEP;
    const ratio = (clientX - rect.left) / rect.width;
    const halves = Math.ceil(ratio * MAX * 2);
    return Math.min(MAX, Math.max(STEP, halves * STEP));
  }

  // Fill width in px so a half step lands exactly on half a star glyph,
  // not at a gap-skewed percentage of the row.
  const fillWidth =
    Math.floor(shown) * (size + GAP) + (shown % 1 !== 0 ? size / 2 : 0);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // jsdom has no pointer capture
    }
    trackRef.current?.focus();
    setPreview(valueFromX(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) {
      setPreview(valueFromX(e.clientX));
    } else if (e.pointerType === "mouse") {
      // Hover preview so the fill follows the cursor before committing.
      setPreview(valueFromX(e.clientX));
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setPreview(null);
    onChange(valueFromX(e.clientX));
  }

  function handlePointerCancel() {
    draggingRef.current = false;
    setPreview(null);
  }

  function handlePointerLeave() {
    if (!draggingRef.current) setPreview(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    let next: number | null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(MAX, (value ?? 0) + STEP);
        break;
      case "ArrowLeft":
      case "ArrowDown": {
        const v = (value ?? 0) - STEP;
        next = v < STEP ? null : v;
        break;
      }
      case "Home":
        next = STEP;
        break;
      case "End":
        next = MAX;
        break;
      case "Delete":
      case "Backspace":
        next = null;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(next);
  }

  return (
    <div className="mt-1 flex h-[38px] items-center gap-3">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Rating"
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={value ?? 0}
        aria-valuetext={
          value != null ? `${value} out of 5 stars` : "Not rated"
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        className="relative inline-flex cursor-pointer touch-none select-none rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ink"
      >
        <div className="flex items-center gap-0.5 text-ink opacity-25">
          {STARS.map((n) => (
            <StarIcon key={n} size={size} weight="regular" />
          ))}
        </div>
        <div
          aria-hidden
          data-testid="star-fill"
          className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-100 ease-out motion-reduce:transition-none"
          style={{ width: fillWidth }}
        >
          <div className="flex h-full w-max items-center gap-0.5 text-ink">
            {STARS.map((n) => (
              <StarIcon key={n} size={size} weight="fill" />
            ))}
          </div>
        </div>
      </div>
      <span className="w-8 text-sm tabular-nums text-muted">
        {shown > 0 ? shown.toFixed(1) : "—"}
      </span>
      {value != null && (
        <button
          type="button"
          aria-label="Clear rating"
          onClick={() => onChange(null)}
          className="rounded-full p-1 text-muted transition hover:text-ink"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
}
