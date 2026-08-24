interface TravelFlourishProps {
  className?: string;
}

/**
 * A single, understated line-art travel route - original inline SVG (a
 * dashed path with a small departure/arrival mark at each end), not a stock
 * photo, stock icon, or emoji. Colored via `currentColor`, so wherever it's
 * placed always resolves to a real Everplans token rather than a hardcoded
 * hex. The Travel Planner's equivalent of `@/components/wedding/wedding-flourish`
 * - same "one quiet accent per screen" restraint, not a repeating motif.
 */
export function TravelFlourish({ className }: TravelFlourishProps) {
  return (
    <svg viewBox="0 0 140 100" fill="none" aria-hidden="true" className={className}>
      <path
        d="M8 78 C 34 62 46 40 62 30 C 82 18 104 22 132 8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray="1 8"
      />
      <circle cx="8" cy="78" r="3.5" fill="currentColor" fillOpacity="0.5" />
      <circle cx="132" cy="8" r="3.5" fill="currentColor" fillOpacity="0.5" />
      <path
        d="M62 30 L 70 24 L 66 34 L 60 36 Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}
