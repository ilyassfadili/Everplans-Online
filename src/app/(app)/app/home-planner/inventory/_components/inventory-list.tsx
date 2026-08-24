"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";

import { Card, EmptyState } from "@/components/ui";
import { Input } from "@/components/ui/form/input";
import { Select, type SelectOption } from "@/components/ui/form/select";
import { INVENTORY_CATEGORY_OPTIONS } from "@/components/home-planner/inventory-category-options";
import type { InventoryItem, Room } from "@/types/home-planner";

import { ItemRow } from "./item-row";

interface InventoryListProps {
  items: InventoryItem[];
  rooms: Room[];
}

const ALL_CATEGORIES_OPTION: SelectOption = { value: "all", label: "All categories" };
const ALL_ROOMS_OPTION: SelectOption = { value: "all", label: "All rooms" };
const UNASSIGNED_ROOM_OPTION: SelectOption = { value: "unassigned", label: "No room assigned" };

/**
 * The inventory list itself - search plus category/room filters, all
 * client-side over the already-fetched list (Phase 2: "provide search" and
 * "useful filters"), the same "fetch once, filter in the browser" pattern
 * `GuestList` (Wedding Planner) establishes for its own RSVP filter.
 */
export function InventoryList({ items, rooms }: InventoryListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  const roomOptions: SelectOption[] = rooms.map((room) => ({ value: room.id, label: room.name }));
  const roomNameById = useMemo(() => new Map(rooms.map((room) => [room.id, room.name])), [rooms]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (normalizedQuery && !item.name.toLowerCase().includes(normalizedQuery)) return false;
      if (category !== "all" && item.category !== category) return false;
      if (roomFilter === "unassigned" && item.roomId !== null) return false;
      if (roomFilter !== "all" && roomFilter !== "unassigned" && item.roomId !== roomFilter) return false;
      return true;
    });
  }, [items, query, category, roomFilter]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Add your first item"
        description="Start building your home inventory - add items above, and assign them to a room if you like."
        className="py-14"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search inventory..."
          aria-label="Search inventory"
        />
        <Select
          value={category}
          onValueChange={setCategory}
          options={[ALL_CATEGORIES_OPTION, ...INVENTORY_CATEGORY_OPTIONS]}
          aria-label="Filter by category"
          className="sm:w-48"
        />
        <Select
          value={roomFilter}
          onValueChange={setRoomFilter}
          options={[ALL_ROOMS_OPTION, UNASSIGNED_ROOM_OPTION, ...roomOptions]}
          aria-label="Filter by room"
          className="sm:w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No items match" description="Try a different search or filter." className="py-14" />
      ) : (
        <Card variant="standard" padding="lg">
          <ul className="flex flex-col divide-y divide-line-subtle">
            {filtered.map((item) => (
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
    </div>
  );
}
