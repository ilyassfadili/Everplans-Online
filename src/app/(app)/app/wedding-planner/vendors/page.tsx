import type { Metadata } from "next";
import { Store } from "lucide-react";
import { redirect } from "next/navigation";

import { Container, EmptyState } from "@/components/ui";
import { getExpensesForWedding } from "@/lib/wedding/expenses";
import { calculateVendorFinancials } from "@/lib/wedding/vendor-budget";
import { getVendorsForWedding } from "@/lib/wedding/vendors";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";

import { PageHeader } from "../../_components/page-header";
import { AddVendorForm } from "./_components/add-vendor-form";
import { VendorCard } from "./_components/vendor-card";

export const metadata: Metadata = {
  title: "Vendors",
  robots: { index: false, follow: false },
};

/**
 * The Wedding Planner's vendor list (Prompt 4 Phase 4) - the canonical
 * `wedding_vendors` record from Prompt 3, now with real management on top.
 * Gated the same way every Wedding Planner route is: no workspace yet
 * redirects to onboarding.
 */
export default async function VendorsPage() {
  const wedding = await getWeddingForCurrentUser();

  if (!wedding) {
    redirect("/app/wedding-planner/onboarding");
  }

  const [vendors, expenses] = await Promise.all([getVendorsForWedding(wedding.id), getExpensesForWedding(wedding.id)]);
  const financials = vendors.map((vendor) => calculateVendorFinancials(vendor, expenses));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <PageHeader title="Vendors" description="The people bringing your day to life, and what you've spent with each." />
      <AddVendorForm weddingId={wedding.id} />

      {financials.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Build your dream team"
          description="Add a vendor above - your photographer, caterer, or venue are a good place to start."
          className="py-14"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {financials.map((summary) => (
            <VendorCard key={summary.vendor.id} financials={summary} currency={wedding.currency} />
          ))}
        </div>
      )}
    </Container>
  );
}
