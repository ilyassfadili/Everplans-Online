import { Check, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alert, Card, Container, Icon, Text } from "@/components/ui";
import { PayPalCheckout } from "@/components/commerce/paypal-checkout";
import { HOME_PLANNER_PRODUCT } from "@/config/products/home-planner";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";
import { formatMoney } from "@/lib/home-planner/format-currency";
import { publicEnv } from "@/lib/env";

import { PageHeader } from "../../_components/page-header";
import { captureHomePlannerOrder, createHomePlannerPayPalOrder } from "./actions";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/**
 * Home Planner's checkout entry point (Prompt 6 Phase 1) - the single
 * destination every "buy Home Planner" link on the public site points at
 * (`HOME_PLANNER_PRODUCT`'s own `ctaHref`/plannerId comment,
 * `@/config/products/home-planner.ts`). Resolves "already owns this" vs.
 * "needs to buy this" server-side, since the public Product Landing Page
 * itself stays fully static with no per-viewer state - an already-entitled
 * visitor is sent straight to `/app/home-planner` (which itself routes them
 * into home setup or their dashboard via `requireHomeForCurrentUser()`,
 * `@/lib/home-planner/homes.ts`), never shown a $29 charge for something
 * they already have. Entitlement, not home existence, is the authoritative
 * check here - a home can exist for a user whose entitlement was later
 * revoked/refunded, and that user must still see checkout, not a false
 * "you already own this." Same shape as `travel-planner/checkout/page.tsx`/
 * `life-planner/checkout/page.tsx`.
 *
 * `PayPalCheckout` (`@/components/commerce/paypal-checkout.tsx`) is the
 * shared checkout UI every product in this app uses, here bound to Home
 * Planner's own `createOrder`/`captureOrder` actions (`./actions.ts`).
 */
const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  start_failed: "We couldn't start checkout with PayPal just now. Please try again.",
  missing_token: "We couldn't confirm your PayPal checkout. Please try again.",
  order_not_found: "We couldn't find that order. Please start checkout again.",
  verification_failed: "We couldn't verify your payment with PayPal. Please try again, or contact support if you were charged.",
  not_approved: "It looks like that PayPal checkout wasn't completed. Please try again.",
  capture_failed: "We couldn't complete your payment. Please try again, or contact support if you were charged.",
  mismatch: "Something didn't match up while confirming your payment. Please contact support before trying again.",
};

interface CheckoutPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function HomePlannerCheckoutPage({ searchParams }: CheckoutPageProps) {
  const user = await requireUser();

  if (await hasProductAccess(user.id, HOME_PLANNER_PRODUCT.plannerId)) {
    redirect("/app/home-planner");
  }

  const { error } = await searchParams;
  const errorMessage = error ? (CHECKOUT_ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.") : null;

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center gap-8 py-10 md:py-14">
      <PageHeader title="Checkout" description="One-time payment, permanent access - no subscription." />

      {errorMessage && (
        <Alert variant="error" title="Checkout didn't go through">
          {errorMessage}
        </Alert>
      )}

      <Card variant="standard" padding="lg" className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle pb-6">
          <div>
            <Text size="body-lg" weight="semibold">
              {HOME_PLANNER_PRODUCT.name}
            </Text>
            <Text size="body-sm" tone="muted" className="mt-1">
              A connected home-organization workspace - rooms, inventory, maintenance, bills, documents, and projects, all in one place.
            </Text>
          </div>
          <Text size="body-lg" weight="semibold" className="shrink-0">
            {formatMoney(HOME_PLANNER_PRODUCT.priceCents)}
          </Text>
        </div>

        <ul className="flex flex-col gap-2">
          {[
            "Home profile, rooms, inventory, and important items",
            "Maintenance, bills, documents, and projects",
            "One workspace, ready in under a minute",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Icon icon={Check} size="sm" className="mt-0.5 shrink-0 text-success" aria-hidden />
              <Text size="body-sm" tone="muted">
                {line}
              </Text>
            </li>
          ))}
        </ul>

        <div className="border-t border-line-subtle pt-6">
          <Text size="label" weight="semibold" tone="muted" className="mb-4 uppercase tracking-wide">
            Payment method
          </Text>
          <PayPalCheckout
            clientId={publicEnv.paypalClientId}
            currency={HOME_PLANNER_PRODUCT.currency}
            createOrder={createHomePlannerPayPalOrder}
            captureOrder={captureHomePlannerOrder}
            successHref="/app/home-planner/checkout/success"
          />
        </div>

        <div className="flex items-center gap-2">
          <Icon icon={ShieldCheck} size="sm" className="shrink-0 text-ink-faint" aria-hidden />
          <Text size="caption" tone="faint">
            Paid securely through PayPal. Everplans never sees or stores your card details.
          </Text>
        </div>
      </Card>
    </Container>
  );
}
