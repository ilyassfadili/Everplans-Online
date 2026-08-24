"use client";

import { useState } from "react";
import { Pencil, Wallet } from "lucide-react";

import { Button, Card, Heading, Icon, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { formatCurrency } from "@/lib/travel/currency";
import type { TripBudgetSummary } from "@/types/travel";

import { updateTotalBudgetAction } from "../actions";

interface BudgetOverviewProps {
  tripId: string;
  summary: TripBudgetSummary;
  currency: string;
}

/**
 * "Total budget / allocated / spent / remaining" (Prompt 3 Phase 1 §6,
 * extended by Phase 2 §6/§8's "clearly distinguish planned/spent/remaining")
 * - the numbers that matter, plus an inline edit for the total itself
 * (there's no separate settings page for it - this card is both the
 * display and the one place it's set). A single calm progress bar shows
 * spending against the total - no pie chart or per-category chart here,
 * the category list right below already shows that breakdown, the same
 * restraint `BudgetOverview` (Wedding Planner) already applies.
 *
 * Takes `tripId` (plain, serializable data) rather than a bound save
 * function - a Server Component can't hand a Client Component an arbitrary
 * closure over a Server Action, only plain props or the Server Action
 * reference itself, so this component imports and calls
 * `updateTotalBudgetAction` directly, the same "bind inside the Client
 * Component" shape `AddDateForm` (Wedding Planner) already establishes.
 */
export function BudgetOverview({ tripId, summary, currency }: BudgetOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setIsSaving(true);
    setError(null);

    const amount = formData.get("totalBudget");
    const result = await updateTotalBudgetAction(tripId, typeof amount === "string" ? amount : "");
    setIsSaving(false);
    if (result.status === "success") {
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that amount.");
    }
  }

  const percentSpent =
    summary.totalBudgetCents === 0 ? 0 : Math.min(100, Math.round((summary.totalActualCents / summary.totalBudgetCents) * 100));
  const isOverBudget = summary.remainingCents < 0;
  const isOverAllocated = summary.unallocatedCents < 0;

  return (
    <Card variant="standard" padding="lg">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h2" size="h4">
          Budget
        </Heading>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit total budget"
            className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <Icon icon={Pencil} size="sm" />
          </button>
        )}
      </div>

      {isEditing ? (
        <form action={handleSave} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Text size="body-sm" tone="muted">
              Total budget
            </Text>
            <Input
              name="totalBudget"
              defaultValue={(summary.totalBudgetCents / 100).toFixed(2)}
              inputMode="decimal"
              aria-label="Total budget amount"
              className="w-40"
              autoFocus
            />
          </div>
          <Button type="submit" size="sm" loading={isSaving}>
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          {error && (
            <Text size="body-sm" tone="error" className="w-full">
              {error}
            </Text>
          )}
        </form>
      ) : summary.totalBudgetCents === 0 ? (
        <Text size="body" tone="muted" className="mt-1.5">
          Set a total budget to start planning where your money goes.
        </Text>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <Text size="body-sm" tone="muted">
                Total budget
              </Text>
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatCurrency(summary.totalBudgetCents, currency)}
              </Text>
            </div>
            <div>
              <Text size="body-sm" tone="muted">
                Allocated
              </Text>
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatCurrency(summary.totalPlannedCents, currency)}
              </Text>
              {isOverAllocated && (
                <Text size="body-sm" tone="warning" className="mt-0.5">
                  {formatCurrency(Math.abs(summary.unallocatedCents), currency)} over
                </Text>
              )}
            </div>
            <div>
              <Text size="body-sm" tone="muted">
                Spent
              </Text>
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatCurrency(summary.totalActualCents, currency)}
              </Text>
            </div>
            <div>
              <Text size="body-sm" tone="muted">
                {isOverBudget ? "Over by" : "Remaining"}
              </Text>
              <Text size="body-lg" weight="semibold" className={isOverBudget ? "text-warning" : "text-ink"}>
                {formatCurrency(Math.abs(summary.remainingCents), currency)}
              </Text>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${isOverBudget ? "bg-warning" : "bg-brand"}`}
              style={{ width: `${percentSpent}%` }}
            />
          </div>
        </>
      )}

      {!isEditing && summary.totalBudgetCents === 0 && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          leadingIcon={<Wallet className="size-4" strokeWidth={1.75} aria-hidden="true" />}
          onClick={() => setIsEditing(true)}
        >
          Set total budget
        </Button>
      )}
    </Card>
  );
}
