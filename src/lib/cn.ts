import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Plain `twMerge` only knows Tailwind's *stock* class names - it has no
 * idea `text-ink` is a color or `text-body-lg` is a font-size, because
 * Everplans defines both through its own `@theme` tokens (see
 * globals.css), not Tailwind's defaults. Both happen to use the `text-`
 * prefix (color *and* font-size both do, natively, in Tailwind itself),
 * so without telling tailwind-merge about our custom names, it falls back
 * to guessing - and guesses wrong: `cn("text-body-lg", "text-ink")` was
 * silently dropping `text-ink`, and `cn("text-ink", "text-body-lg")` was
 * silently dropping the size instead. That's not a one-off bug, it's
 * every `Text`/`Heading`/`Badge`/etc. call in the app, since all of them
 * combine a semantic color with a semantic size.
 *
 * The fix: register every custom color and font-size token name so
 * tailwind-merge treats them as their own class groups again, the same
 * way it already handles `text-red-500` vs `text-lg`. Keep this list in
 * sync with the `@theme inline` block in globals.css - grep for
 * `--color-` / `--text-` there to regenerate it if tokens change.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas",
        "surface",
        "surface-muted",
        "overlay",
        "deep",
        "ink",
        "ink-muted",
        "ink-faint",
        "ink-disabled",
        "ink-on-brand",
        "ink-on-accent",
        "ink-on-deep",
        "ink-on-deep-muted",
        "line-subtle",
        "line",
        "line-strong",
        "focus-ring",
        "brand",
        "brand-hover",
        "brand-active",
        "accent",
        "accent-subtle",
        "success",
        "success-subtle",
        "warning",
        "warning-subtle",
        "error",
        "error-subtle",
      ],
      text: ["display", "h1", "h2", "h3", "h4", "body-lg", "body", "body-sm", "caption", "label"],
    },
  },
});

/**
 * Combine conditional classNames and resolve Tailwind conflicts (the last
 * conflicting utility wins) so a consumer can override a component's
 * default styling with `className="p-8"` without fighting its internal
 * `p-4`. Used by every component in `src/components/ui`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
