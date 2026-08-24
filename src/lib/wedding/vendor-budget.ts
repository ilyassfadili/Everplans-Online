import type { WeddingExpense, WeddingVendor, WeddingVendorFinancials } from "@/types/wedding";

/**
 * A vendor's financial snapshot, derived from its linked expenses at read
 * time - no separate "vendor spending" total is ever stored (Prompt 4
 * Phase 4: "avoid duplicating expense amounts... the system must have a
 * clear source of truth"). Mirrors `calculateCategorySummaries`
 * (`@/lib/wedding/budget.ts`) exactly, applied to vendors instead of
 * categories.
 */
export function calculateVendorFinancials(vendor: WeddingVendor, expenses: WeddingExpense[]): WeddingVendorFinancials {
  const vendorExpenses = expenses.filter((expense) => expense.vendorId === vendor.id);
  const actualCents = vendorExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return {
    vendor,
    actualCents,
    remainingCents: vendor.plannedAmountCents === null ? null : vendor.plannedAmountCents - actualCents,
    isOverBudget: vendor.plannedAmountCents !== null && actualCents > vendor.plannedAmountCents,
    expenses: vendorExpenses,
  };
}
