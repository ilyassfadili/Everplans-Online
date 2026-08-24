import { MapPin } from "lucide-react";

import { Card, Text } from "@/components/ui";
import type { Home } from "@/types/home-planner";

import { PanelHeader } from "./panel-header";

interface HomeDetailsCardProps {
  home: Home;
}

/** The home profile summary - address and any additional details, the profile data Phase 2's setup flow collects. */
export function HomeDetailsCard({ home }: HomeDetailsCardProps) {
  const address = [home.addressLine1, home.addressLine2, [home.city, home.state].filter(Boolean).join(", "), home.postalCode, home.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Card variant="standard" padding="lg" className="flex h-full flex-col">
      <PanelHeader icon={MapPin} title="Home Profile" />
      <div className="mt-4 flex flex-1 flex-col gap-4">
        <div>
          <Text size="body-sm" tone="muted">
            Address
          </Text>
          <Text size="body" weight="medium" className="mt-0.5 text-ink">
            {address || "Not set yet"}
          </Text>
        </div>
        <div>
          <Text size="body-sm" tone="muted">
            Additional details
          </Text>
          <Text size="body" className="mt-0.5 text-ink">
            {home.notes || "Nothing added yet"}
          </Text>
        </div>
      </div>
    </Card>
  );
}
