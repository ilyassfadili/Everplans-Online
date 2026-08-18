import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ContainerSize = "narrow" | "default" | "wide";

const containerSizeClass: Record<ContainerSize, string> = {
  // Prose measure - long-form reading content (article body, About copy).
  narrow: "max-w-[42rem]",
  // Standard page content - the width most sections use.
  default: "max-w-[80rem]",
  // Full-bleed moments - wide media, feature previews.
  wide: "max-w-[96rem]",
};

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  size?: ContainerSize;
  children: ReactNode;
}

/**
 * Centers content and applies the site's consistent horizontal padding and
 * max-width. Every page section reaches for this rather than hand-rolling
 * `mx-auto max-w-* px-*` - that repetition is exactly how horizontal
 * alignment quietly drifts apart across pages built at different times.
 */
export function Container({
  as: Component = "div",
  size = "default",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn("mx-auto w-full px-4 sm:px-8 lg:px-12", containerSizeClass[size], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

type SectionSpacing = "sm" | "default" | "lg";
type SectionBackground = "canvas" | "surface" | "surface-muted" | "brand" | "accent-subtle" | "deep" | "accent";

// Mobile/tablet/desktop steps roughly follow the 32px / 48px / 64-96px
// vertical rhythm requested for a tighter, denser modern-SaaS feel - each
// tier keeps the same relative "sm < default < lg" hierarchy the site
// already relies on, just compacted proportionally.
const sectionSpacingClass: Record<SectionSpacing, string> = {
  sm: "py-6 md:py-10",
  default: "py-8 md:py-12 lg:py-20",
  lg: "py-10 md:py-16 lg:py-24",
};

const sectionBackgroundClass: Record<SectionBackground, string> = {
  canvas: "bg-canvas text-ink",
  surface: "bg-surface text-ink",
  "surface-muted": "bg-surface-muted text-ink",
  brand: "bg-brand text-ink-on-brand",
  "accent-subtle": "bg-accent-subtle text-ink",
  // #001219, invariant across themes - a deliberate full-bleed dark
  // moment (hero, closing statement), not the theme-driven --brand.
  deep: "bg-deep text-ink-on-deep",
  // Full-strength CAF0F8 - reserved for one or two genuinely experimental
  // accent-band moments, never the default section treatment.
  accent: "bg-accent text-ink-on-accent",
};

interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "header" | "footer";
  spacing?: SectionSpacing;
  background?: SectionBackground;
  children: ReactNode;
}

/**
 * A full-width band with consistent vertical rhythm and an optional
 * semantic background. Pages compose `<Section><Container>...` to alternate
 * full-bleed backgrounds while keeping content aligned to the same grid.
 */
export function Section({
  as: Component = "section",
  spacing = "default",
  background = "canvas",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn(sectionSpacingClass[spacing], sectionBackgroundClass[background], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

type StackDirection = "row" | "column";
type StackGap = "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16";

const gapClass: Record<StackGap, string> = {
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "5": "gap-5",
  "6": "gap-6",
  "8": "gap-8",
  "10": "gap-10",
  "12": "gap-12",
  "16": "gap-16",
};

type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
type StackJustify = "start" | "center" | "end" | "between" | "around";

// Tailwind statically scans source text for whole class names - a template
// literal like `items-${align}` is invisible to it and silently generates
// no CSS. Every dynamic variant in this file goes through a lookup map like
// this one instead, so the full class name always appears literally.
const alignClass: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClass: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  children: ReactNode;
}

/** A flex layout primitive for the common case: a row or column with a gap. */
export function Stack({
  as: Component = "div",
  direction = "column",
  gap = "4",
  align,
  justify,
  wrap = false,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <Component
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapClass[gap],
        align && alignClass[align],
        justify && justifyClass[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
