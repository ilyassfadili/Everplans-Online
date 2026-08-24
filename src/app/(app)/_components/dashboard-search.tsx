"use client";

import { Search, X } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/ui";
import { searchWorkspace } from "@/lib/workspace-search";
import type { WorkspaceSearchResult } from "@/types/workspace-search";

const DEBOUNCE_MS = 200;

const RESULT_TYPE_LABEL: Record<WorkspaceSearchResult["type"], string> = {
  planner: "Planner",
  resource: "Resource",
};

/**
 * The desktop top bar's search - real, not decorative chrome: every
 * keystroke (after a short debounce) calls the `searchWorkspace` Server
 * Action (`@/lib/workspace-search`), which queries the same two real
 * discovery sources `/app/planners` and `/app/resources` already read.
 * With today's empty catalog, every search honestly returns nothing -
 * the same "real signature, honest empty today" shape this codebase uses
 * everywhere else, not a search box wired to fabricated results.
 *
 * Deliberately not a full ARIA combobox (no `role="combobox"`/listbox
 * keyboard nav) - this codebase avoids ARIA a native/simpler pattern
 * already covers (see `UserProfileMenu`'s own comment on the same
 * principle). Results are a plain, tabbable list of real links;
 * `aria-live="polite"` on the panel announces when a search finishes
 * without requiring a bespoke widget.
 */
export function DashboardSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkspaceSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    const trimmed = query.trim();
    // No reset call for the empty-query case: `showPanel` already gates
    // the panel entirely on `trimmedQuery.length > 0` below, so a stale
    // `results` value from a previous query never renders once the box
    // is cleared - no need to synchronously setState from inside the
    // effect just to null it out early.
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchWorkspace(trimmed);
        setResults(found);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const trimmedQuery = query.trim();
  const showPanel = open && trimmedQuery.length > 0;

  function clear() {
    setQuery("");
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Icon
          icon={Search}
          size="sm"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="search"
          aria-label="Search planners and resources"
          placeholder="Search planners and resources..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              clear();
            }
          }}
          className="h-10 w-full rounded-md border border-line-strong bg-surface pl-9 pr-9 text-body-sm text-ink placeholder:text-ink-faint transition-[color,box-shadow,border-color] duration-150 ease-standard focus-visible:border-focus-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring/15"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-faint transition-colors duration-150 ease-standard hover:text-ink"
          >
            <Icon icon={X} size="sm" label="Clear search" />
          </button>
        )}
      </div>

      {showPanel && (
        <div
          id={panelId}
          aria-live="polite"
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-lg border border-line-subtle bg-surface p-2 shadow-lg"
        >
          {isPending ? (
            <p className="px-3 py-4 text-center text-body-sm text-ink-muted">Searching…</p>
          ) : results.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <NextLink
                    href={result.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 transition-colors duration-150 ease-standard hover:bg-surface-muted"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-body-sm font-medium text-ink">{result.title}</span>
                      <span className="shrink-0 text-caption text-ink-faint">{RESULT_TYPE_LABEL[result.type]}</span>
                    </span>
                    <span className="block truncate text-caption text-ink-faint">{result.description}</span>
                  </NextLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-4 text-center text-body-sm text-ink-muted">
              No results for &ldquo;{trimmedQuery}&rdquo; - nothing&rsquo;s been published to search yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
