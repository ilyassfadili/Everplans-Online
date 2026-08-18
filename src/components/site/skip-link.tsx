/**
 * The first focusable element on every page. Invisible until it receives
 * keyboard focus, at which point it's the fastest way past the header and
 * navigation straight to the page's actual content - required for anyone
 * navigating by keyboard or screen reader, invisible to everyone else.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-brand focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-body-sm focus-visible:font-medium focus-visible:text-ink-on-brand"
    >
      Skip to main content
    </a>
  );
}
