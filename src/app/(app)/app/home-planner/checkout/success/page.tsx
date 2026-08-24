import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Container, EmptyState } from "@/components/ui";
import { HOME_PLANNER_PRODUCT } from "@/config/products/home-planner";
import { requireUser } from "@/lib/auth/dal";
import { hasProductAccess } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Purchase complete",
  robots: { index: false, follow: false },
};

/**
 * The purchase-success confirmation screen (Prompt 6) - what a customer
 * actually sees after `checkout/return/page.tsx` finishes verifying
 * payment and granting the entitlement. Gated by `hasProductAccess` itself
 * so this success state can only ever be shown to someone who genuinely
 * has an active entitlement right now - bookmarking or sharing this URL
 * never shows a false "you're all set" to someone who doesn't actually
 * have access. Same shape as `travel-planner/checkout/success/page.tsx`.
 */
export default async function CheckoutSuccessPage() {
  const user = await requireUser();

  if (!(await hasProductAccess(user.id, HOME_PLANNER_PRODUCT.plannerId))) {
    redirect("/app/home-planner/checkout");
  }

  return (
    <Container size="narrow" className="flex flex-1 flex-col justify-center py-10 md:py-14">
      <EmptyState
        icon={CheckCircle2}
        titleAs="h1"
        title="You're all set"
        description={`${HOME_PLANNER_PRODUCT.name} is now yours - a one-time payment, permanent access, no subscription. You can set up your home whenever you're ready.`}
        action={<Button href="/app/home-planner">Open Home Planner</Button>}
      />
    </Container>
  );
}
