import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, Button, Card, Container, Heading, Link, Text } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { formatCurrency } from "@/lib/budget/currency";
import { hasProductAccess } from "@/lib/entitlements";
import { accessStatusBadge, formatOrderDate, orderReference, orderStatusBadge } from "@/lib/order-display";
import { getOrderForCurrentUserById } from "@/lib/orders";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata: Metadata = {
  title: "Purchase details",
  robots: { index: false, follow: false },
};

/**
 * `/app/purchases/[orderId]` - one order's own detail view (Everplans Money
 * Prompt 5). `getOrderForCurrentUserById` returns `null` identically for
 * "doesn't exist" and "exists but belongs to someone else" (its own doc
 * comment) - `notFound()` is the only correct response for either, never a
 * 403 that would confirm/deny an order id belongs to another account.
 *
 * "Open Budget Planner" only ever renders when this order is `paid` AND
 * `hasProductAccess` currently returns `true` for its own `plannerId` - a
 * refunded/revoked order shows neither a disabled button (this codebase
 * omits inapplicable actions rather than disabling them, per
 * `StoreProductCard`'s own `isActionable` precedent) nor any other
 * suggestion the product is still open.
 */
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const user = await requireUser();

  const order = await getOrderForCurrentUserById(user.id, orderId);
  if (!order) {
    notFound();
  }

  const isPaid = order.status === "paid";
  const access = isPaid ? await hasProductAccess(user.id, order.plannerId) : null;
  const accessBadge = access === null ? null : accessStatusBadge[access ? "active" : "revoked"];
  const statusBadge = orderStatusBadge[order.status];
  const date = formatOrderDate(order);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/purchases" variant="subtle" className="text-body-sm">
        ← All purchases
      </Link>

      <Card padding="lg" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            {accessBadge && <Badge variant={accessBadge.variant}>{accessBadge.label}</Badge>}
          </div>
          <Heading as="h1" size="h2">
            {order.productName}
          </Heading>
          <Text size="body-sm" tone="muted">
            Order {orderReference(order)}
          </Text>
        </div>

        <dl className="grid gap-4 border-t border-line-subtle pt-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Text as="dt" size="body-sm" tone="muted">
              {date.label}
            </Text>
            <Text as="dd" size="body-lg" weight="semibold">
              {date.value}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text as="dt" size="body-sm" tone="muted">
              Amount
            </Text>
            <Text as="dd" size="body-lg" weight="semibold">
              {formatCurrency(order.amountCents, order.currency)}
            </Text>
          </div>
        </dl>

        {isPaid && access && (
          <div className="border-t border-line-subtle pt-6">
            <Button href="/app/budget-planner">Open Budget Planner</Button>
          </div>
        )}
      </Card>
    </Container>
  );
}
