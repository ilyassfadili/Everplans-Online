import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Container, Link } from "@/components/ui";
import { getExpensesForWedding } from "@/lib/wedding/expenses";
import { calculateVendorFinancials } from "@/lib/wedding/vendor-budget";
import { getVendorById } from "@/lib/wedding/vendors";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { VendorDetailView } from "./_components/vendor-detail-view";

interface VendorDetailPageProps {
  params: Promise<{ vendorId: string }>;
}

export const metadata: Metadata = {
  title: "Vendor",
  robots: { index: false, follow: false },
};

/**
 * One vendor's detail view (Prompt 4 Phase 4) - full contact info, status,
 * and its real financial relationship to the budget (Prompt 3's
 * foundation), derived from `wedding_expenses` rather than a second,
 * vendor-owned copy of spending data.
 *
 * `vendor.weddingId !== wedding.id` is checked explicitly, not just left
 * to RLS: RLS already prevents reading another user's vendor at all
 * (`getVendorById` would return `null`), but this is the same
 * belt-and-suspenders check `resolvePlannerAccess` uses elsewhere in this
 * codebase - a second, application-level confirmation that the resolved
 * record genuinely belongs to the workspace this route is scoped to.
 */
export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { vendorId } = await params;
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const vendor = await getVendorById(vendorId);
  if (!vendor || vendor.weddingId !== wedding.id) {
    notFound();
  }

  const expenses = await getExpensesForWedding(wedding.id);
  const financials = calculateVendorFinancials(vendor, expenses);

  return (
    <Container size="narrow" className="flex flex-1 flex-col gap-6 py-10 md:py-14">
      <Link href="/app/wedding-planner/vendors" variant="subtle" className="text-body-sm">
        ← All vendors
      </Link>
      <VendorDetailView financials={financials} currency={wedding.currency} />
    </Container>
  );
}
