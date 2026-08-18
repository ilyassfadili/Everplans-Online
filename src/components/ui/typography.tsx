import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/*
  Semantic level (`as`) and visual size (`size`) are separate props on
  purpose. A page must still pick the correct heading tag for its position
  in the outline - `size` only changes how it looks. This is what keeps a
  page from reaching for `<h2>` just because it wants bigger text ("Do not
  use headings merely for visual sizing").

  Fraunces (--font-display) carries display/h1/h2 - the headline moments.
  h3/h4 drop to Inter (--font-sans): they usually sit in denser UI contexts
  (card titles, FAQ questions) next to body copy, where a second display
  face stops reading as premium and starts reading as inconsistent.
*/

type HeadingSize = "display" | "h1" | "h2" | "h3" | "h4";
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const headingSizeClass: Record<HeadingSize, string> = {
  display: "font-display text-display font-medium tracking-tight text-balance",
  h1: "font-display text-h1 font-medium tracking-tight text-balance",
  h2: "font-display text-h2 font-medium tracking-tight text-balance",
  h3: "font-sans text-h3 font-semibold tracking-tight",
  h4: "font-sans text-h4 font-semibold",
};

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The actual heading tag - required so hierarchy is always a conscious choice. */
  as: HeadingTag;
  /** Visual size. Defaults to matching `as`; override to decouple look from level. */
  size?: HeadingSize;
  children: ReactNode;
}

export function Heading({ as: Tag, size, className, children, ...props }: HeadingProps) {
  const resolvedSize = size ?? (headingSizeClass[Tag as HeadingSize] ? (Tag as HeadingSize) : "h3");
  return (
    <Tag className={cn(headingSizeClass[resolvedSize], "text-ink", className)} {...props}>
      {children}
    </Tag>
  );
}

type TextSize = "body-lg" | "body" | "body-sm" | "caption" | "label";
type TextTone =
  | "default"
  | "muted"
  | "faint"
  | "on-brand"
  | "on-accent"
  | "brand"
  | "success"
  | "warning"
  | "error";
type TextTag = "p" | "span" | "div" | "dd" | "dt" | "li" | "figcaption";

const textSizeClass: Record<TextSize, string> = {
  "body-lg": "text-body-lg",
  body: "text-body",
  "body-sm": "text-body-sm",
  caption: "text-caption",
  label: "text-label",
};

const textToneClass: Record<TextTone, string> = {
  default: "text-ink",
  muted: "text-ink-muted",
  faint: "text-ink-faint",
  "on-brand": "text-ink-on-brand",
  "on-accent": "text-ink-on-accent",
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

const textWeightClass = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
} as const;

interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: TextTag;
  size?: TextSize;
  tone?: TextTone;
  weight?: keyof typeof textWeightClass;
  children: ReactNode;
}

export function Text({
  as: Tag = "p",
  size = "body",
  tone = "default",
  weight = "normal",
  className,
  children,
  ...props
}: TextProps) {
  const Component = Tag as ElementType;
  return (
    <Component
      className={cn(textSizeClass[size], textToneClass[tone], textWeightClass[weight], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: "brand" | "accent" | "muted";
  children: ReactNode;
}

const eyebrowToneClass: Record<NonNullable<EyebrowProps["tone"]>, string> = {
  brand: "text-brand",
  accent: "text-ink-muted",
  muted: "text-ink-faint",
};

/**
 * The small uppercase label that precedes a section heading ("PLANNING ·
 * GUIDES"). A restrained, recurring editorial device - not a heading itself,
 * so it renders as a paragraph and must sit immediately before the real
 * heading in markup, never replace one.
 */
export function Eyebrow({ tone = "brand", className, children, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-label font-semibold uppercase tracking-[0.08em]",
        eyebrowToneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
