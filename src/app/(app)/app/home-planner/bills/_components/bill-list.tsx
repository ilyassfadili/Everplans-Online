"use client";

import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Bill, BillStatus } from "@/types/home-planner";

import { BillRow } from "./bill-row";

export interface BillWithStatus {
  bill: Bill;
  status: BillStatus;
}

interface BillListProps {
  items: BillWithStatus[];
}

type StatusFilter = "all" | BillStatus | "recurring";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "due", label: "Due soon" },
  { value: "upcoming", label: "Upcoming" },
  { value: "recurring", label: "Recurring" },
  { value: "paid", label: "Paid" },
];

/**
 * The bills list - status filter tabs (Phase 1: "upcoming bills, due
 * bills, overdue bills, recurring bills, recently paid bills"), the same
 * client-side filter pattern `TaskList` (Maintenance) establishes.
 */
export function BillList({ items }: BillListProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "recurring") return items.filter((item) => item.bill.recurrenceFrequency !== null);
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Add your first bill"
        description="Start tracking household expenses - add a bill above."
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex flex-wrap gap-1 rounded-md border border-line-subtle bg-surface-muted p-1" role="group" aria-label="Filter bills by status">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={cn(
              "h-9 rounded-sm px-4 text-body-sm font-medium transition-colors duration-150 ease-standard",
              filter === option.value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No bills match this filter" description="Try a different filter to see more of your list." className="py-14" />
      ) : (
        <Card variant="standard" padding="lg">
          <ul className="flex flex-col divide-y divide-line-subtle">
            {filtered.map(({ bill, status }) => (
              <BillRow key={bill.id} bill={bill} status={status} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
