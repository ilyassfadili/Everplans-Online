import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  /**
   * "on-dark" renders on the fixed `bg-deep` surface (currently the global
   * Footer) rather than the usual canvas/surface backgrounds - the
   * commissioned logo's navy wordmark reads as near-black on the light
   * surfaces `default` targets, so it needs a genuinely different asset
   * (light-colored mark + white wordmark) to stay legible on `bg-deep`.
   *
   * Named for the *surface* each variant targets, not the logo's own colors:
   * `light-mode-logo` is the dark-navy-colored file, used where the surface
   * is light (`default` - header, auth card); `dark-mode-logo` is the
   * white-colored file, used where the surface is dark (`bg-deep` -
   * `on-dark`, the Footer). Doubles as the real dark-theme logo if/when the
   * site gains an actual light/dark mode toggle, not just today's one-off
   * dark footer band.
   */
  tone?: "default" | "on-dark";
}

/*
  Two independent exports, not one recolored programmatically from the
  other - and they don't share an aspect ratio (light-mode-logo is 3:1,
  dark-mode-logo is ~2.67:1, a tighter crop). Each gets its own intrinsic
  width/height so next/image derives the correct ratio instead of
  stretching one file to fit the other's shape.
*/
const toneAsset = {
  default: { src: "/light-mode-logo/logo.png", width: 300, height: 100 },
  "on-dark": { src: "/dark-mode-logo/logo.png", width: 267, height: 100 },
} as const;

/** The Everplans wordmark - the commissioned logo image, sized off its own intrinsic ratio. */
export function Logo({ className, tone = "default" }: LogoProps) {
  const asset = toneAsset[tone];
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center",
        "rounded-sm transition-opacity duration-150 ease-standard hover:opacity-80",
        className,
      )}
    >
      <Image
        src={asset.src}
        alt="Everplans"
        width={asset.width}
        height={asset.height}
        priority
        className="h-9 w-auto"
      />
    </Link>
  );
}
