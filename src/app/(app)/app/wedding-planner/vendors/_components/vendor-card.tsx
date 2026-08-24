import { Badge, Card, Link, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/wedding/currency";
import type { WeddingVendorFinancials, WeddingVendorStatus } from "@/types/wedding";

const STATUS_LABEL: Record<WeddingVendorStatus, string> = {
  prospect: "Prospect",
  considering: "Considering",
  booked: "Booked",
  "not-proceeding": "Not proceeding",
};

// Calm status treatment (Phase 4: no "complex CRM pipeline" visual
// weight) - `booked` is the one state worth a positive color, everything
// else stays neutral.
const STATUS_VARIANT: Record<WeddingVendorStatus, "outline" | "brand" | "success" | "neutral"> = {
  prospect: "outline",
  considering: "brand",
  booked: "success",
  "not-proceeding": "neutral",
};

interface VendorCardProps {
  financials: WeddingVendorFinancials;
  currency: string;
}

/** One vendor in the list - name, category, status, and a real spending glance if any expenses are linked. Links to the vendor's own detail page for everything else (Phase 4: "progressive disclosure"). */
export function VendorCard({ financials, currency }: VendorCardProps) {
  const { vendor, actualCents, expenses } = financials;

  return (
    <Link href={`/app/wedding-planner/vendors/${vendor.id}`} variant="inline" className="block text-ink no-underline hover:text-ink">
      <Card variant="interactive" padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text size="body-lg" weight="semibold" className="text-ink">
              {vendor.name}
            </Text>
            {vendor.category && (
              <Text size="body-sm" tone="muted" className="mt-0.5">
                {vendor.category}
              </Text>
            )}
          </div>
          <Badge variant={STATUS_VARIANT[vendor.status]}>{STATUS_LABEL[vendor.status]}</Badge>
        </div>

        {expenses.length > 0 && (
          <Text size="body-sm" tone="muted" className="mt-3">
            {formatCurrency(actualCents, currency)} spent · {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
          </Text>
        )}
      </Card>
    </Link>
  );
}
