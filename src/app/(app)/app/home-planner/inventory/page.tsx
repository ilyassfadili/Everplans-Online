import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container, Eyebrow, Heading, Text } from "@/components/ui";
import type { SelectOption } from "@/components/ui/form/select";
import { getInventoryForHome } from "@/lib/home-planner/inventory";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getRoomsForHome } from "@/lib/home-planner/rooms";

import { AddItemForm } from "./_components/add-item-form";
import { InventoryList } from "./_components/inventory-list";

export const metadata: Metadata = {
  title: "Inventory",
  robots: { index: false, follow: false },
};

/**
 * The Home Inventory (Everplans Home Planner Prompt 2 Phase 2) - "What do I
 * have, and where is it?" Gated the same way every Home Planner route is:
 * no workspace yet redirects to setup.
 */
export default async function InventoryPage() {
  const home = await getHomeForCurrentUser();

  if (!home) {
    redirect("/app/home-planner/onboarding");
  }

  const [items, rooms] = await Promise.all([getInventoryForHome(home.id), getRoomsForHome(home.id)]);
  const roomOptions: SelectOption[] = rooms.map((room) => ({ value: room.id, label: room.name }));

  return (
    <Container className="flex flex-1 flex-col gap-8 py-10 md:py-14">
      <div>
        <Eyebrow tone="brand">Home Planner</Eyebrow>
        <Heading as="h1" size="h2" className="mt-2">
          Inventory
        </Heading>
        <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
          Everything you own at {home.name}, and where it lives.
        </Text>
      </div>

      <AddItemForm homeId={home.id} roomOptions={roomOptions} />
      <InventoryList items={items} rooms={rooms} />
    </Container>
  );
}
