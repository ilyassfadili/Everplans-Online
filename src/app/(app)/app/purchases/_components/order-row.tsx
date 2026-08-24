import { ChevronRight } from "lucide-react";

import { Badge, Card, Heading, Icon, Link, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { accessStatusBadge, formatOrderDate, orderReference, orderStatusBadge } from "@/lib/order-display";
import type { Order } from "@/types/order";

interface OrderRowProps {
  order: Order;
  /**
   * This order's own current access state, already resolved by the page via
   * `hasProductAccess` - `null` for any non-`paid` order (there's no access
   * to speak of yet), `true`/`false` for a `paid` one. Kept as a plain prop
   * rather than this component calling `hasProductAccess` itself so the
   * list page can resolve every row's access in one `Promise.all` instead of
   * N sequential lookups, and so this stays a pure render of already-decided
   * state, the same split `StoreProductCard` keeps from its own page.
   */
  hasAccess: boolean | null;
}

/** One row in the Purchase History list - links to this order's own detail view. */
export function OrderRow({ order, hasAccess }: OrderRowProps) {
  const statusBadge = orderStatusBadge[order.status];
  const date = formatOrderDate(order);
  const access = hasAccess === null ? null : accessStatusBadge[hasAccess ? "active" : "revoked"];

  return (
    <Link href={`/app/purchases/${order.id}`} className="block no-underline">
      <Card
        variant="interactive"
        padding="md"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Heading as="h3" size="h4" className="truncate">
              {order.productName}
            </Heading>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            {access && <Badge variant={access.variant}>{access.label}</Badge>}
          </div>
          <Text size="body-sm" tone="muted">
            {date.label} {date.value} · Order {orderReference(order)}
          </Text>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start sm:gap-1">
          <Text size="body-lg" weight="semibold">
            {formatCurrency(order.amountCents, order.currency)}
          </Text>
          <Icon icon={ChevronRight} size="sm" className="text-ink-faint sm:hidden" />
        </div>
      </Card>
    </Link>
  );
}
