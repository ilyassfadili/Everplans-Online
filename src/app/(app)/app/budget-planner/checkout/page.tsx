import { Check, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alert, Card, Container, Icon, Text } from "@/components/ui";
import { PayPalCheckout } from "@/components/commerce/paypal-checkout";
import { BUDGET_PLANNER_PRODUCT } from "@/config/products/budget-planner";
import { requireUser } from "@/lib/auth/dal";
import { formatCurrency } from "@/lib/budget/currency";
import { hasProductAccess } from "@/lib/entitlements";
import { publicEnv } from "@/lib/env";

import { PageHeader } from "../../_components/page-header";
import { captureBudgetPlannerOrder, createBudgetPlannerPayPalOrder } from "./actions";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/**
 * Budget Planner's checkout entry point (Everplans Money Prompt 3 Phase 2,
 * rebuilt in Prompt 8 to pay by card without a PayPal account) - the single
 * destination every "buy Budget Planner" link on the public site points at
 * (`BUDGET_PLANNER_PRODUCT`'s own `ctaHref` comment,
 * `@/config/products/budget-planner.ts`). Resolves "already owns this" vs.
 * "needs to buy this" server-side, since the public Product Landing Page
 * itself stays fully static with no per-viewer state - an already-entitled
 * visitor is sent straight to `/app/budget-planner` (which itself routes
 * them into onboarding or their workspace via `resolveBudgetPlannerAccess`,
 * `@/lib/budget/plans.ts`), never shown a $29 charge for something they
 * already have. Entitlement, not plan existence, is the authoritative check
 * here (Everplans Money Prompt 4) - a plan can exist for a user whose
 * entitlement was later revoked/refunded, and that user must still see
 * checkout, not a false "you already own this."
 *
 * `PayPalCheckout` (`@/components/commerce/paypal-checkout.tsx` - shared,
 * generalized in Everplans Travel Planner Prompt 6 so Travel Planner's own
 * checkout could reuse it rather than duplicating this component) is the actual
 * payment UI - PayPal's Card Fields (card number/expiry/CVV/cardholder
 * name, PCI-compliant hosted fields) plus the PayPal Buttons component,
 * both converging into the same order/verification/entitlement pipeline
 * every other checkout path already uses. `?error=` is a defensive
 * fallback only, still handled here for the rare case PayPal's SDK falls
 * back to a real redirect (a blocked popup, certain payment methods) and
 * lands back on `checkout/return`/`checkout/cancel`, which still redirect
 * here with an error code exactly as they did before this prompt.
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

export default async function BudgetPlannerCheckoutPage({ searchParams }: CheckoutPageProps) {
  const user = await requireUser();

  if (await hasProductAccess(user.id, BUDGET_PLANNER_PRODUCT.plannerId)) {
    redirect("/app/budget-planner");
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
              {BUDGET_PLANNER_PRODUCT.name}
            </Text>
            <Text size="body-sm" tone="muted" className="mt-1">
              A calm, connected budgeting workspace - income, categories, spending, and goals, all in one place.
            </Text>
          </div>
          <Text size="body-lg" weight="semibold" className="shrink-0">
            {formatCurrency(BUDGET_PLANNER_PRODUCT.priceCents, BUDGET_PLANNER_PRODUCT.currency)}
          </Text>
        </div>

        <ul className="flex flex-col gap-2">
          {["Income, expenses, transactions, categories, and accounts", "Budget categories, financial goals, and recurring items", "One workspace, ready in under a minute"].map(
            (line) => (
              <li key={line} className="flex items-start gap-2">
                <Icon icon={Check} size="sm" className="mt-0.5 shrink-0 text-success" aria-hidden />
                <Text size="body-sm" tone="muted">
                  {line}
                </Text>
              </li>
            ),
          )}
        </ul>

        <div className="border-t border-line-subtle pt-6">
          <Text size="label" weight="semibold" tone="muted" className="mb-4 uppercase tracking-wide">
            Payment method
          </Text>
          <PayPalCheckout
            clientId={publicEnv.paypalClientId}
            currency={BUDGET_PLANNER_PRODUCT.currency}
            createOrder={createBudgetPlannerPayPalOrder}
            captureOrder={captureBudgetPlannerOrder}
            successHref="/app/budget-planner/checkout/success"
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
