import { Star } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, Container, EmptyState, Eyebrow, Heading, Link, Text } from "@/components/ui";
import { getImportantItemsForHome } from "@/lib/home-planner/inventory";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { ItemRow } from "../inventory/_components/item-row";

export const metadata: Metadata = {
  title: "Important Items",
  robots: { index: false, follow: false },
};

/**
 * Important Items (Everplans Home Planner Prompt 2 Phase 3) - a focused
 * view of inventory items flagged important. Reuses `ItemRow` (from
 * `../inventory/_components/item-row`) directly - the same edit/delete/
 * important-toggle behavior as the main Inventory list, since this is the
 * same underlying record, not a second item database (Phase 3's own
 * instruction).
 */
export default async function ImportantItemsPage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const [items, rooms] = await Promise.all([getImportantItemsForHome(home.id), getRoomsForHome(home.id)]);
  const roomOptions = rooms.map((room) => ({ value: room.id, label: room.name }));
  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Important Items
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Household belongings worth keeping close track of - major appliances, electronics,
          and anything else you&rsquo;d want to review at a glance.
        </Text>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nothing marked important yet"
          description="Mark an item as important from your inventory to see it here."
          action={<Link href="/app/home-planner/inventory">Go to inventory</Link>}
        />
      ) : (
        <Card variant="standard" padding="lg">
          <ul className="flex flex-col divide-y divide-line-subtle">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                roomOptions={roomOptions}
                roomName={item.roomId ? (roomNameById.get(item.roomId) ?? null) : null}
              />
            ))}
          </ul>
        </Card>
      )}
    </Container>
  );
}
