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

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-medium transition-colors duration-150 ease-standard",
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
      {!loading && trailingIcon}
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
