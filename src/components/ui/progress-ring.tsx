interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** A plain SVG progress ring - no charting dependency for one static number. */
export function ProgressRing({ percent, size = 72, strokeWidth = 7, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 -rotate-90 ${className ?? ""}`}
      aria-hidden="true"
    >
      <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-surface-muted" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-brand"
      />
    </svg>
  );
}
