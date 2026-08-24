import type { Metadata } from "next";

import { Badge, Button, Card, Container, Heading, Link, Text } from "@/components/ui";
import { requireCommerceOperator } from "@/lib/commerce-ops/auth";
import { getOrdersForOps } from "@/lib/commerce-ops/orders";
import { formatCurrency } from "@/lib/budget/currency";
import { formatOrderDate, orderReference, orderStatusBadge } from "@/lib/order-display";
import type { OrderStatus } from "@/types/order";

import { PageHeader } from "../_components/page-header";

export const metadata: Metadata = {
  title: "Commerce Operations",
  robots: { index: false, follow: false },
};

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

function isOrderStatus(value: string): value is OrderStatus {
  return ["created", "pending", "paid", "failed", "cancelled", "refunded"].includes(value);
}

interface OpsOrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

/**
 * `/app/ops` - Everplans Money Prompt 7's Orders operations view. Gated by
 * `requireCommerceOperator()` (`@/lib/commerce-ops/auth.ts`) - the ONLY
 * check standing between this page and a `not-found` response for anyone
 * who isn't a verified operator, checked server-side before a single row
 * of order data is fetched.
 *
 * Deliberately absent from `dashboardNav`/the sidebar (Prompt 7's own "do
 * not expose admin functionality to normal customers") - an operator
 * reaches this by URL, not by a link every customer would also see.
 */
export default async function OpsOrdersPage({ searchParams }: OpsOrdersPageProps) {
  await requireCommerceOperator();

  const { status: statusParam } = await searchParams;
  const status = statusParam && isOrderStatus(statusParam) ? statusParam : undefined;

  const orders = await getOrdersForOps(status);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Commerce Operations" description="Orders across every customer - inspect status, payment, and access." />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((filter) => {
          const isActive = (status ?? "all") === filter.value;
          return (
            <Button
              key={filter.value}
              href={filter.value === "all" ? "/app/ops" : `/app/ops?status=${filter.value}`}
              variant={isActive ? "primary" : "outline"}
              size="sm"
            >
              {filter.label}
            </Button>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <Text tone="muted">No orders match this filter.</Text>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => {
            const badge = orderStatusBadge[order.status];
            const date = formatOrderDate(order);
            return (
              <Link key={order.id} href={`/app/ops/orders/${order.id}`} className="block no-underline">
                <Card variant="interactive" padding="md" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Heading as="h3" size="h4" className="truncate">
                        {order.productName}
                      </Heading>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <Text size="body-sm" tone="muted">
                      {orderReference(order)} · {date.label} {date.value}
                    </Text>
                  </div>
                  <Text size="body-lg" weight="semibold" className="shrink-0">
                    {formatCurrency(order.amountCents, order.currency)}
                  </Text>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
