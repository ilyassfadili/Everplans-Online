"use client";

import { Search, X } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/ui";
import { searchWedding } from "@/lib/wedding/search";
import type { WeddingSearchResult } from "@/types/wedding";

const DEBOUNCE_MS = 200;

const RESULT_TYPE_LABEL: Record<WeddingSearchResult["type"], string> = {
  task: "Task",
  milestone: "Milestone",
  "important-date": "Date",
  guest: "Guest",
  vendor: "Vendor",
  event: "Event",
  venue: "Venue",
  note: "Note",
  decision: "Decision",
  document: "Document",
};

/**
 * The Wedding Planner's global search (Prompt 5 Phase 4) - the same
 * debounced-input/dropdown-panel pattern `DashboardSearch`
 * (`@/app/(app)/_components/dashboard-search.tsx`) already established
 * for the marketplace's own search, applied here to `searchWedding`
 * instead. A separate component rather than extending `DashboardSearch`
 * itself - that one searches the generic planner marketplace, this one
 * searches wedding data; keeping them apart matches the same "avoid
 * coupling Wedding Planner logic to unrelated products" principle the
 * rest of this domain follows.
 */
export function WeddingSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeddingSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchWedding(trimmed);
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
        <Icon icon={Search} size="sm" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          aria-label="Search your wedding"
          placeholder="Search tasks, guests, vendors..."
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
                    {result.description && <span className="block truncate text-caption text-ink-faint">{result.description}</span>}
                  </NextLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-4 text-center text-body-sm text-ink-muted">No results for &ldquo;{trimmedQuery}&rdquo;.</p>
          )}
        </div>
      )}
    </div>
  );
}
