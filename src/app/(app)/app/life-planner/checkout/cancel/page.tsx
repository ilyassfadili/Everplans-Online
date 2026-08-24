import { XCircle } from "lucide-react";
import type { Metadata } from "next";

import { Button, Container, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { getOrderForCurrentUser, markOrderTerminal } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

interface CheckoutCancelPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * PayPal's own "customer cancelled" redirect target for Life Planner's
 * checkout - marks the corresponding order `cancelled` on a best-effort
 * basis. A customer landing here without ever completing PayPal's checkout
 * never had a payment to lose, so there's nothing to verify, only local
 * bookkeeping to tidy up. No entitlement is ever granted from this path.
 * Same shape as `travel-planner/checkout/cancel/page.tsx`.
 */
export default async function CheckoutCancelPage({ searchParams }: CheckoutCancelPageProps) {
  const user = await requireUser();
  const { token } = await searchParams;

  if (token) {
    const order = await getOrderForCurrentUser(user.id, token);
    // Only ever cancels an order that's genuinely this user's own and not
    // already resolved - `markOrderTerminal` itself also refuses to touch
    // an already-`paid` order, so a stale/reused cancel link can never
    // downgrade a real purchase.
    if (order) {
      await markOrderTerminal(order.id, "cancelled");
    }
  }

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center py-10 md:py-14">
      <EmptyState
        icon={XCircle}
        titleAs="h1"
        title="Checkout cancelled"
        description="No charge was made. You can pick up where you left off whenever you're ready."
        action={<Button href="/app/life-planner/checkout">Try checkout again</Button>}
      />
    </Container>
  );
}
