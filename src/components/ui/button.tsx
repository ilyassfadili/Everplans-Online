import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/*
  One component, two render paths: pass `href` and it renders a Next.js
  <Link>; omit it and it renders a real <button>. Same visual system either
  way, so "go somewhere" and "do something" never accidentally look
  different just because of which element they happen to be.
*/

// Exported (not just used internally) so a whole-card link that needs to
// *look* like it contains a button - without nesting a real `<a>`/`<button>`
// inside the card's own outer `<a>` - can render a plain, non-interactive
// element styled identically via `buttonVariants({...})`, instead of a
// second, hand-copied set of button classes that can drift from this one.
export const buttonVariants = cva(
  [
    "group inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-medium transition-[background-color,border-color,color,transform] duration-150 ease-standard",
    "active:scale-[0.98] motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-brand text-ink-on-brand hover:bg-brand-hover active:bg-brand-active",
        secondary:
          "bg-surface-muted text-ink hover:bg-line-subtle border border-line active:bg-line",
        outline:
          "border border-line-strong text-ink bg-transparent hover:bg-surface-muted active:bg-line-subtle",
        /*
          For outline buttons sitting on a dark/brand surface (bg-deep,
          bg-brand) rather than the usual canvas/surface - `line-strong`
          measures nowhere near 3:1 against either dark background, so it
          can't be reused as-is. `ink-on-brand` is #ffffff (and, not
          coincidentally, exactly what `ink-on-deep` also resolves to today
          - see globals.css) so one variant covers both dark surfaces
          without inventing a new token. The local `--focus-ring` override
          matches Footer's own fix for the same problem: the default
          brand-colored ring measures ~2.8:1 against either dark surface,
          short of the 3:1 UI minimum.
        */
        "outline-on-dark":
          "border border-ink-on-brand/30 text-ink-on-brand bg-transparent hover:bg-ink-on-brand/10 active:bg-ink-on-brand/15 [--focus-ring:var(--ink-on-brand)]",
        ghost: "bg-transparent text-ink hover:bg-surface-muted active:bg-line-subtle",
        destructive: "bg-error text-ink-on-brand hover:brightness-110 active:brightness-95",
      },
      size: {
        sm: "h-9 px-4 text-body-sm",
        md: "h-11 px-5 text-body",
        lg: "h-12 px-7 text-body-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

type CommonProps = ButtonVariants & {
  children: ReactNode;
  /** Shows a spinner and disables interaction. Label stays put so layout doesn't jump. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant,
  size,
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  const content = (
    <>
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {/* The nudge is on every trailing icon automatically (not opt-in per
          call site) so "go somewhere/do something" CTAs across the whole
          site get the same tactile cue for free. */}
      {!loading && trailingIcon && (
        <span className="inline-flex transition-transform duration-150 ease-standard group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0">
          {trailingIcon}
        </span>
      )}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} aria-disabled={loading} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const { disabled, ...buttonProps } = props as ButtonAsButton;
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
