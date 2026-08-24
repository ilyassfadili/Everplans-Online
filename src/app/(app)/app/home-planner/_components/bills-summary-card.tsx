import { Receipt } from "lucide-react";

import { Badge, Button, Card, Text } from "@/components/ui";
import { BillStatusBadge } from "@/components/home-planner/bill-status-badge";
import { calculateBillStatus } from "@/lib/home-planner/bill-status";
import type { Bill } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface BillsSummaryCardProps {
  bills: Bill[];
}

/**
 * A small, lightweight Bills summary for the Home Dashboard (Prompt 4
 * Phase 1: "add a small household-bills summary to the existing Home
 * Dashboard... do not redesign the dashboard"), the same shape
 * `MaintenanceSummaryCard` establishes.
 */
export function BillsSummaryCard({ bills }: BillsSummaryCardProps) {
  const today = new Date();
  const withStatus = bills
    .map((bill) => ({ bill, status: calculateBillStatus(bill, today) }))
    .filter((item) => item.status === "overdue" || item.status === "due")
    .sort((a, b) => (a.status === "overdue" && b.status !== "overdue" ? -1 : 0));

  const overdueCount = withStatus.filter((item) => item.status === "overdue").length;
  const dueSoonCount = withStatus.filter((item) => item.status === "due").length;

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader
        icon={Receipt}
        title="Bills"
        action={
          <Button href="/app/home-planner/bills" variant="ghost" size="sm">
            View
          </Button>
        }
      />
      <div className="mt-4 flex-1">
        {withStatus.length === 0 ? (
          <Text size="body-sm" tone="faint">
            Nothing due or overdue right now.
          </Text>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {overdueCount > 0 && <Badge variant="error">{overdueCount} overdue</Badge>}
              {dueSoonCount > 0 && <Badge variant="warning">{dueSoonCount} due soon</Badge>}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {withStatus.slice(0, 4).map(({ bill, status }) => (
                <li key={bill.id} className="flex items-center justify-between gap-2">
                  <Text size="body-sm" className="truncate text-ink">
                    {bill.name}
                  </Text>
                  <BillStatusBadge status={status} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
