interface WeddingFlourishProps {
  className?: string;
}

/**
 * A single, understated botanical line-art sprig - original inline SVG, not
 * a stock photo, a stock icon, or an emoji flower (the brief explicitly
 * rules those out: "avoid... cheap-looking gradients... cartoonish wedding
 * illustrations"). Colored via `currentColor`, so wherever it's placed
 * always resolves to a real Everplans token (`text-brand`, `text-line`, ...)
 * rather than a hardcoded hex - never a fourth color on top of the locked
 * three-color system.
 *
 * Meant to appear once per screen, as one quiet accent - not a repeating
 * decorative motif. "Editorial restraint," not "wedding graphics everywhere."
 */
export function WeddingFlourish({ className }: WeddingFlourishProps) {
  return (
    <svg viewBox="0 0 100 140" fill="none" aria-hidden="true" className={className}>
      <path d="M50 134 C 48 109 54 89 48 64 C 44 44 52 24 50 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path
        d="M48 107 C 35 101 28 87 30 77 C 40 81 48 91 48 107 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M50 99 C 63 93 70 79 68 69 C 58 73 50 83 50 99 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M46 69 C 33 63 26 49 28 39 C 38 43 46 53 46 69 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M50 61 C 63 55 70 41 68 31 C 58 35 50 45 50 61 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M48 34 C 40 27 38 17 42 9 C 48 13 50 23 48 34 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}
