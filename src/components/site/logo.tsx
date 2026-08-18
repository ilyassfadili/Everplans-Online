import Link from "next/link";

import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  /**
   * "on-dark" renders on the fixed `bg-deep` surface (currently only the
   * global Footer) rather than the usual canvas/surface backgrounds.
   * `text-ink` is near-black in this light-only palette, so it would be
   * invisible on `bg-deep` - this tone swaps the wordmark and dot to the
   * white `ink-on-deep` token instead of layering on ad-hoc overrides at
   * every call site.
   */
  tone?: "default" | "on-dark";
}

const toneClass = {
  default: { dot: "bg-accent", word: "text-ink" },
  "on-dark": { dot: "bg-ink-on-deep", word: "text-ink-on-deep" },
} as const;

/**
 * The Everplans wordmark: a small brand-colored mark paired with the
 * Fraunces wordmark, rather than type alone. The mark is a single filled
 * shape with one accent dot - not an illustration, just enough geometry to
 * feel like a considered signature rather than plain text. Swap the
 * markup here for an <Image> if/when a commissioned logo asset exists;
 * every consumer goes through this component, not a hardcoded string.
 */
export function Logo({ className, tone = "default" }: LogoProps) {
  const t = toneClass[tone];
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5",
        "rounded-sm transition-opacity duration-150 ease-standard hover:opacity-80",
        className,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[0.4rem] bg-brand">
        <span className={cn("size-2 rounded-full", t.dot)} />
      </span>
      <span className={cn("font-display text-2xl font-semibold tracking-tight", t.word)}>
        Everplans
      </span>
    </Link>
  );
}
