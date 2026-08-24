"use client";

import { useTransition } from "react";
import { Check, Repeat, RotateCcw, Trash2 } from "lucide-react";

import { Badge, Button, Icon, Link, Stack, Text } from "@/components/ui";
import { getBillCategoryLabel } from "@/components/home-planner/bill-category-options";
import { BillStatusBadge } from "@/components/home-planner/bill-status-badge";
import { formatMoney } from "@/lib/home-planner/format-currency";
import { getRecurrenceFrequencyLabel } from "@/lib/home-planner/recurrence";
import type { Bill, BillStatus } from "@/types/home-planner";

import { deleteBillAction, markPaidAction, markUnpaidAction } from "../actions";

interface BillRowProps {
  bill: Bill;
  status: BillStatus;
}

/** One bill, in the overview list - the same shape `TaskRow` (Maintenance) establishes. */
export function BillRow({ bill, status }: BillRowProps) {
  const [isToggling, startToggleTransition] = useTransition();

  function handleTogglePaid() {
    startToggleTransition(() => {
      if (status === "paid") {
        void markUnpaidAction(bill.id);
      } else {
        void markPaidAction(bill.id);
      }
    });
  }

  function handleDelete() {
    if (window.confirm(`Remove ${bill.name}? This can't be undone.`)) {
      void deleteBillAction(bill.id);
    }
  }

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/app/home-planner/bills/${bill.id}`} variant="prominent">
            {bill.name}
          </Link>
          <BillStatusBadge status={status} />
          {bill.recurrenceFrequency && (
            <Badge variant="brand">
              <Icon icon={Repeat} size="sm" />
              {getRecurrenceFrequencyLabel(bill.recurrenceFrequency)}
            </Badge>
          )}
        </div>
        <Stack direction="row" gap="3" className="mt-1 flex-wrap">
          <Text size="body-sm" tone="muted">
            {getBillCategoryLabel(bill.category)}
          </Text>
          <Text size="body-sm" weight="medium" className="text-ink">
            {formatMoney(bill.amountCents)}
          </Text>
          {bill.dueDate && (
            <Text size="body-sm" tone="muted">
              Due {bill.dueDate}
            </Text>
          )}
        </Stack>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant={status === "paid" ? "outline" : "secondary"}
          size="sm"
          onClick={handleTogglePaid}
          disabled={isToggling}
          leadingIcon={<Icon icon={status === "paid" ? RotateCcw : Check} size="sm" />}
        >
          {status === "paid" ? "Mark unpaid" : "Mark paid"}
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Remove ${bill.name}`}
          className="-m-1.5 rounded-sm p-1.5 text-ink-faint transition-colors duration-150 ease-standard hover:bg-surface-muted hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Icon icon={Trash2} size="sm" />
        </button>
      </div>
    </li>
  );
}
