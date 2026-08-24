"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Badge, Button, Card, EmptyState, Heading, Label, ProgressRing, Select, Text } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { VENDOR_CATEGORY_OPTIONS } from "@/components/wedding/vendor-category-options";
import { formatCurrency } from "@/lib/wedding/currency";
import type { WeddingVendorFinancials, WeddingVendorStatus } from "@/types/wedding";

import { editVendorAction, removeVendorAction } from "../../actions";

const STATUS_OPTIONS: { value: WeddingVendorStatus; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  { value: "considering", label: "Considering" },
  { value: "booked", label: "Booked" },
  { value: "not-proceeding", label: "Not proceeding" },
];

function formatExpenseDate(expenseDate: string): string {
  const date = new Date(`${expenseDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface VendorDetailViewProps {
  financials: WeddingVendorFinancials;
  currency: string;
}

/**
 * The vendor detail page (Prompt 4 Phase 4) - one editable card for
 * everything about the vendor itself, plus a read-only financial summary
 * and related-expenses list derived from `wedding_expenses` (never a
 * second, vendor-owned copy of that data). Editing expenses themselves
 * still happens on the Budget page - this page shows the relationship,
 * not a duplicate expense editor.
 */
export function VendorDetailView({ financials, currency }: VendorDetailViewProps) {
  const router = useRouter();
  const { vendor, actualCents, remainingCents, isOverBudget, expenses } = financials;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const name = formData.get("name");
    const category = formData.get("category");
    const status = formData.get("status");
    const contactName = formData.get("contactName");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const website = formData.get("website");
    const notes = formData.get("notes");
    const plannedAmountCents = formData.get("plannedAmountCents");

    setIsSaving(true);
    const result = await editVendorAction(vendor.id, {
      name: typeof name === "string" ? name : undefined,
      category: typeof category === "string" ? category : "",
      status: status === "prospect" || status === "considering" || status === "booked" || status === "not-proceeding" ? status : undefined,
      contactName: typeof contactName === "string" ? contactName : "",
      email: typeof email === "string" ? email : "",
      phone: typeof phone === "string" ? phone : "",
      website: typeof website === "string" ? website : "",
      notes: typeof notes === "string" ? notes : "",
      plannedAmountCents: typeof plannedAmountCents === "string" ? plannedAmountCents : "",
    });
    setIsSaving(false);

    if (result.status === "success") {
      setError(null);
      setIsEditing(false);
    } else {
      setError(result.message ?? "Couldn't save that change.");
    }
  }

  function handleDelete() {
    if (window.confirm(`Remove ${vendor.name}? Related expenses will stay, just without a vendor link.`)) {
      void removeVendorAction(vendor.id);
      router.push("/app/wedding-planner/vendors");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="standard" padding="lg">
        {isEditing ? (
          <form action={handleSave} className="flex flex-col gap-4">
            {error && (
              <Alert variant="error" title="Couldn’t save your changes">
                {error}
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-name">Name</Label>
                <Input id="vendor-name" name="name" defaultValue={vendor.name} maxLength={150} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-category">Category</Label>
                <Select id="vendor-category" name="category" defaultValue={vendor.category ?? undefined} placeholder="Choose a category" options={VENDOR_CATEGORY_OPTIONS} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-status">Status</Label>
                <Select id="vendor-status" name="status" defaultValue={vendor.status} options={STATUS_OPTIONS} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-planned-amount">
                  Planned amount <span className="font-normal text-ink-faint">(optional)</span>
                </Label>
                <Input
                  id="vendor-planned-amount"
                  name="plannedAmountCents"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={vendor.plannedAmountCents !== null ? (vendor.plannedAmountCents / 100).toFixed(2) : ""}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-contact-name">
                  Contact person <span className="font-normal text-ink-faint">(optional)</span>
                </Label>
                <Input id="vendor-contact-name" name="contactName" defaultValue={vendor.contactName ?? ""} maxLength={150} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-email">
                  Email <span className="font-normal text-ink-faint">(optional)</span>
                </Label>
                <Input id="vendor-email" name="email" type="email" defaultValue={vendor.email ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-phone">
                  Phone <span className="font-normal text-ink-faint">(optional)</span>
                </Label>
                <Input id="vendor-phone" name="phone" type="tel" defaultValue={vendor.phone ?? ""} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vendor-website">
                  Website <span className="font-normal text-ink-faint">(optional)</span>
                </Label>
                <Input id="vendor-website" name="website" type="url" defaultValue={vendor.website ?? ""} placeholder="https://" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendor-notes">
                Notes <span className="font-normal text-ink-faint">(optional)</span>
              </Label>
              <Textarea id="vendor-notes" name="notes" defaultValue={vendor.notes ?? ""} rows={3} maxLength={1000} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Heading as="h1" size="h3">
                  {vendor.name}
                </Heading>
                {vendor.category && (
                  <Text size="body" tone="muted" className="mt-1">
                    {vendor.category}
                  </Text>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={vendor.status === "booked" ? "success" : vendor.status === "considering" ? "brand" : "outline"}>
                  {STATUS_OPTIONS.find((option) => option.value === vendor.status)?.label}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </div>

            {(vendor.contactName || vendor.email || vendor.phone || vendor.website) && (
              <div className="mt-4 flex flex-col gap-1 border-t border-line-subtle pt-4">
                {vendor.contactName && <Text size="body-sm">{vendor.contactName}</Text>}
                {vendor.email && (
                  <Text size="body-sm">
                    <a href={`mailto:${vendor.email}`} className="text-brand underline-offset-4 hover:underline">
                      {vendor.email}
                    </a>
                  </Text>
                )}
                {vendor.phone && (
                  <Text size="body-sm">
                    <a href={`tel:${vendor.phone}`} className="text-brand underline-offset-4 hover:underline">
                      {vendor.phone}
                    </a>
                  </Text>
                )}
                {vendor.website && (
                  <Text size="body-sm">
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-brand underline-offset-4 hover:underline">
                      {vendor.website}
                    </a>
                  </Text>
                )}
              </div>
            )}

            {vendor.notes && (
              <Text size="body-sm" tone="muted" className="mt-4 border-t border-line-subtle pt-4">
                {vendor.notes}
              </Text>
            )}
          </>
        )}
      </Card>

      <Card variant="standard" padding="lg">
        <Heading as="h2" size="h4">
          Spending
        </Heading>
        <div className="mt-4 flex items-center gap-5">
          {vendor.plannedAmountCents !== null && (
            <ProgressRing
              percent={vendor.plannedAmountCents === 0 ? 0 : Math.min(100, Math.round((actualCents / vendor.plannedAmountCents) * 100))}
              size={56}
              strokeWidth={5}
            />
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {vendor.plannedAmountCents !== null && (
              <div>
                <Text size="body-sm" tone="muted">
                  Planned
                </Text>
                <Text size="body-lg" weight="semibold" className="text-ink">
                  {formatCurrency(vendor.plannedAmountCents, currency)}
                </Text>
              </div>
            )}
            <div>
              <Text size="body-sm" tone="muted">
                Spent
              </Text>
              <Text size="body-lg" weight="semibold" className="text-ink">
                {formatCurrency(actualCents, currency)}
              </Text>
            </div>
            {remainingCents !== null && (
              <div>
                <Text size="body-sm" tone="muted">
                  {isOverBudget ? "Over by" : "Remaining"}
                </Text>
                <Text size="body-lg" weight="semibold" className={isOverBudget ? "text-warning" : "text-ink"}>
                  {formatCurrency(Math.abs(remainingCents), currency)}
                </Text>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card variant="standard" padding="lg">
        <Heading as="h2" size="h4">
          Related expenses
        </Heading>
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses linked yet"
            description="Add an expense on the Budget page and set this vendor to see it here."
            className="mt-4 py-10"
          />
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line-subtle">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <Text size="body" weight="medium" className="text-ink">
                    {expense.title}
                  </Text>
                  <Text size="body-sm" tone="muted">
                    {formatExpenseDate(expense.expenseDate)}
                  </Text>
                </div>
                <Text size="body" weight="medium" className="text-ink">
                  {formatCurrency(expense.amountCents, currency)}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button variant="ghost" size="sm" className="self-start text-error hover:text-error" onClick={handleDelete}>
        Remove vendor
      </Button>
    </div>
  );
}
