"use client";

import { Select } from "@/components/ui";
import { cn } from "@/lib/cn";

export type TaskStatusFilter = "all" | "active" | "completed";
export type TaskSortOption = "manual" | "due-date" | "priority";

const STATUS_FILTERS: { value: TaskStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "manual", label: "Sort: Order added" },
  { value: "due-date", label: "Sort: Due date" },
  { value: "priority", label: "Sort: Priority" },
];

interface TaskFiltersProps {
  statusFilter: TaskStatusFilter;
  onStatusFilterChange: (value: TaskStatusFilter) => void;
  sortBy: TaskSortOption;
  onSortByChange: (value: TaskSortOption) => void;
}

/**
 * The checklist's own filtering/sorting (Phase 4: "simple filtering/sorting
 * where it materially improves usability" - not an advanced query engine).
 * A three-way segmented control for status (the common case: "show me
 * what's left to do"), plus one sort dropdown - two controls total, both
 * usable one-handed on mobile with no cramped layout.
 */
export function TaskFilters({ statusFilter, onStatusFilterChange, sortBy, onSortByChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex rounded-md border border-line-subtle bg-surface-muted p-1" role="group" aria-label="Filter tasks by status">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onStatusFilterChange(filter.value)}
            aria-pressed={statusFilter === filter.value}
            className={cn(
              "h-9 rounded-sm px-4 text-body-sm font-medium transition-colors duration-150 ease-standard",
              statusFilter === filter.value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Select
        aria-label="Sort tasks"
        value={sortBy}
        onValueChange={(value) => onSortByChange(value as TaskSortOption)}
        options={SORT_OPTIONS}
        className="sm:w-52"
      />
    </div>
  );
}
