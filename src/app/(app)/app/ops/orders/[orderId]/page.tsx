import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, Card, Container, Heading, Link, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/budget/currency";
import { getAuditLogForTarget } from "@/lib/commerce-ops/audit";
import { requireCommerceOperator } from "@/lib/commerce-ops/auth";
import { getEntitlementByOrderIdForOps } from "@/lib/commerce-ops/entitlements";
import { getCustomerEmailForOps, getOrderForOps } from "@/lib/commerce-ops/orders";
import { getWebhookEventsForOrderForOps } from "@/lib/commerce-ops/webhook-events";
import { formatOrderDate, orderReference, orderStatusBadge } from "@/lib/order-display";

import { RetryVerificationForm } from "./_components/retry-verification-form";

export const metadata: Metadata = {
  title: "Order - Commerce Operations",
  robots: { index: false, follow: false },
};

interface OpsOrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function formatDateTime(iso: string | null): string {
  return iso ? dateTimeFormatter.format(new Date(iso)) : "-";
}

const entitlementStatusVariant: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  revoked: "neutral",
  expired: "neutral",
};

const webhookStatusVariant: Record<string, "success" | "neutral" | "error"> = {
  processed: "success",
  ignored: "neutral",
  failed: "error",
  received: "neutral",
};

/**
 * `/app/ops/orders/[orderId]` - Everplans Money Prompt 7's Order Detail
 * operations view, the one place an operator sees the full chain:
 * Customer -> Product -> Order -> PayPal payment -> Entitlement ->
 * Refund/revocation. Gated by `requireCommerceOperator()`. Shows only
 * SAFE PayPal identifiers (order/capture/refund ids - operational
 * references, never secrets or tokens) and never raw webhook payloads or
 * `metadata` columns.
 */
export default async function OpsOrderDetailPage({ params }: OpsOrderDetailPageProps) {
  await requireCommerceOperator();
  const { orderId } = await params;

  const order = await getOrderForOps(orderId);
  if (!order) {
    notFound();
  }

  const [customerEmail, entitlement, webhookEvents, auditLog] = await Promise.all([
    getCustomerEmailForOps(order.userId),
    getEntitlementByOrderIdForOps(order.id),
    getWebhookEventsForOrderForOps(order.id),
    getAuditLogForTarget("order", order.id),
  ]);

  const statusBadge = orderStatusBadge[order.status];
  const date = formatOrderDate(order);
  const canRetry = order.status === "pending" && order.providerOrderId !== null;

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/ops" variant="subtle" className="text-body-sm">
        ← All orders
      </Link>

      <Card padding="lg" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Text size="body-sm" tone="muted">
              {orderReference(order)}
            </Text>
          </div>
          <Heading as="h1" size="h2">
            {order.productName}
          </Heading>
          <Text size="body-sm" tone="muted">
            Customer: {customerEmail ?? `user ${order.userId.slice(0, 8)}…`}
          </Text>
        </div>

        <dl className="grid gap-4 border-t border-line-subtle pt-6 sm:grid-cols-2">
          <Field label="Amount" value={formatCurrency(order.amountCents, order.currency)} />
          <Field label={date.label} value={date.value} />
          <Field label="Created" value={formatDateTime(order.createdAt)} />
          <Field label="Last updated" value={formatDateTime(order.updatedAt)} />
          <Field label="PayPal order" value={order.providerOrderId ?? "-"} />
          <Field label="PayPal capture" value={order.providerCaptureId ?? "-"} />
          {order.status === "refunded" && (
            <>
              <Field label="Refunded" value={formatDateTime(order.refundedAt)} />
              <Field label="PayPal refund" value={order.providerRefundId ?? "-"} />
            </>
          )}
        </dl>

        {canRetry && (
          <div className="border-t border-line-subtle pt-6">
            <RetryVerificationForm orderId={order.id} />
          </div>
        )}
      </Card>

      <Card padding="lg" className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          Entitlement
        </Heading>
        {entitlement ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Text as="dt" size="body-sm" tone="muted">
                Status
              </Text>
              <Badge variant={entitlementStatusVariant[entitlement.status] ?? "neutral"} className="w-fit">
                {entitlement.status}
              </Badge>
            </div>
            <Field label="Granted" value={formatDateTime(entitlement.grantedAt)} />
            <Field label="Revoked" value={formatDateTime(entitlement.revokedAt)} />
          </dl>
        ) : (
          <Text size="body-sm" tone="muted">
            No entitlement exists for this order yet.
          </Text>
        )}
      </Card>

      <Card padding="lg" className="flex flex-col gap-4">
        <Heading as="h2" size="h4">
          Webhook events
        </Heading>
        {webhookEvents.length === 0 ? (
          <Text size="body-sm" tone="muted">
            No PayPal webhook deliveries recorded for this order yet.
          </Text>
        ) : (
          <ul className="flex flex-col gap-3">
            {webhookEvents.map((event) => (
              <li key={event.id} className="flex flex-col gap-1 border-b border-line-subtle pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={webhookStatusVariant[event.status] ?? "neutral"}>{event.status}</Badge>
                  <Text size="body-sm" weight="medium">
                    {event.eventType}
                  </Text>
                </div>
                <Text size="caption" tone="faint">
                  {formatDateTime(event.receivedAt)}
                  {event.errorMessage ? ` · ${event.errorMessage}` : ""}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {auditLog.length > 0 && (
        <Card padding="lg" className="flex flex-col gap-4">
          <Heading as="h2" size="h4">
            Operator activity
          </Heading>
          <ul className="flex flex-col gap-3">
            {auditLog.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 border-b border-line-subtle pb-3 last:border-0 last:pb-0">
                <Text size="body-sm" weight="medium">
                  {entry.action} - {entry.result}
                </Text>
                <Text size="caption" tone="faint">
                  {formatDateTime(entry.createdAt)}
                </Text>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Container>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Text as="dt" size="body-sm" tone="muted">
        {label}
      </Text>
      <Text as="dd" size="body" weight="medium" className="break-all">
        {value}
      </Text>
    </div>
  );
}
