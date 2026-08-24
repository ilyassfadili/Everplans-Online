import { Receipt } from "lucide-react";
import type { Metadata } from "next";

import { Button, Container, EmptyState, Heading } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";
import { getOrdersForCurrentUser } from "@/lib/orders";
import { getOwnedPlanners } from "@/lib/owned-planners";

import { PageHeader } from "../_components/page-header";
import { OrderRow } from "./_components/order-row";
import { OwnedPlannerRow } from "./_components/owned-planner-row";

export const metadata: Metadata = {
  title: "Purchases",
  robots: { index: false, follow: false },
};

/**
 * `/app/purchases` - Everplans Money Prompt 5's Purchase History. Every
 * order the current user has ever started, most recent first, regardless of
 * status (`getOrdersForCurrentUser`'s own doc comment) - a `pending`/
 * `failed`/`cancelled` attempt is still real history worth showing, not
 * just successful purchases. Product-agnostic by construction: every field
 * rendered here (`productName`, `amountCents`, `plannerId`, ...) comes from
 * the order's own row, never a hardcoded "Budget Planner" assumption, so a
 * future second product's orders appear here with zero changes to this page.
 *
 * Access state (`hasAccess`) is only meaningful for a `paid` order - it's
 * resolved once here, for every `paid` order, via `hasProductAccess`
 * (keyed off that order's own `plannerId`, not a specific product) and
 * handed down to each `OrderRow` as a plain prop rather than each row doing
 * its own lookup.
 *
 * No dedicated error UI: `getOrdersForCurrentUser` already fails closed to
 * `[]` on a database error (its own doc comment), so a genuinely empty
 * history and a failed load are indistinguishable here by design - the
 * empty state below covers both honestly rather than guessing which one
 * happened.
 *
 * Order history alone understates what the user actually has: Wedding
 * Planner and Budget Planner both predate the real checkout/`orders`
 * system, so a genuine owner can have zero rows here despite using a
 * planner daily. `getOwnedPlanners()` (`@/lib/owned-planners`) is the same
 * ownership source `/app/planners` already uses, reconciled against
 * `paidOrders` by product name so a planner that *does* have a real paid
 * order isn't shown twice - once as an order row, once as a bare
 * "Included" row for the same thing.
 */
export default async function PurchasesPage() {
  const user = await requireUser();
  const [orders, ownedPlanners] = await Promise.all([getOrdersForCurrentUser(user.id), getOwnedPlanners()]);

  const paidOrders = orders.filter((order) => order.status === "paid");
  const accessEntries = await Promise.all(
    paidOrders.map(async (order) => [order.id, await hasProductAccess(user.id, order.plannerId)] as const),
  );
  const accessByOrderId = new Map(accessEntries);

  const paidProductNames = new Set(paidOrders.map((order) => order.productName.trim().toLowerCase()));
  const unlistedOwnedPlanners = ownedPlanners.filter(
    (listing) => !paidProductNames.has(listing.title.trim().toLowerCase()),
  );

  const hasNothing = orders.length === 0 && unlistedOwnedPlanners.length === 0;

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Purchases" description="Every order you've placed with Everplans, and what it unlocked." />

      {hasNothing ? (
        <EmptyState
          icon={Receipt}
          titleAs="h2"
          title="Nothing here yet"
          description="Products you purchase from Everplans will show up here, with their receipt and current status."
          action={
            <Button href="/app/store" variant="outline">
              Browse the Store
            </Button>
          }
          className="py-10 sm:py-14 md:py-16"
        />
      ) : (
        <div className="flex flex-col gap-8">
          {unlistedOwnedPlanners.length > 0 && (
            <div className="flex flex-col gap-3">
              {orders.length > 0 && (
                <Heading as="h2" size="h4">
                  Your planners
                </Heading>
              )}
              {unlistedOwnedPlanners.map((listing) => (
                <OwnedPlannerRow key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {orders.length > 0 && (
            <div className="flex flex-col gap-3">
              {unlistedOwnedPlanners.length > 0 && (
                <Heading as="h2" size="h4">
                  Order history
                </Heading>
              )}
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} hasAccess={accessByOrderId.get(order.id) ?? null} />
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
