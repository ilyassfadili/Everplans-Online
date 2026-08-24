import {
  Bath,
  BedDouble,
  Boxes,
  Briefcase,
  Car,
  CookingPot,
  DoorOpen,
  Flower2,
  Sofa,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { SelectOption } from "@/components/ui/form/select";
import type { RoomType } from "@/types/home-planner";

/**
 * The Room Type `Select`'s curated option list - matches
 * `home_rooms_room_type_valid` (the migration) and `RoomType`
 * (`@/types/home-planner`) exactly. Matches Phase 1's own example list
 * (Living Room, Bedroom, Kitchen, Bathroom, Office, Dining Room, Garage,
 * Basement, Garden, Other) - "Other" is always a safe fallback so the list
 * is never unnecessarily restrictive.
 */
export const ROOM_TYPE_OPTIONS: SelectOption[] = [
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "office", label: "Office" },
  { value: "dining-room", label: "Dining Room" },
  { value: "garage", label: "Garage" },
  { value: "basement", label: "Basement" },
  { value: "garden", label: "Garden" },
  { value: "other", label: "Other" },
];

const ROOM_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ROOM_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

/** Resolves a stored `room_type` value back into its display label. Falls back to the raw value, so a display never renders `undefined`. */
export function getRoomTypeLabel(roomType: string): string {
  return ROOM_TYPE_LABELS[roomType] ?? roomType;
}

/**
 * A distinct glyph per room type, so the rooms overview reads as
 * scannable cards rather than a plain list (Phase 1: "use appropriate
 * cards, icons, labels").
 */
export const ROOM_TYPE_ICONS: Record<RoomType, LucideIcon> = {
  "living-room": Sofa,
  bedroom: BedDouble,
  kitchen: CookingPot,
  bathroom: Bath,
  office: Briefcase,
  "dining-room": UtensilsCrossed,
  garage: Car,
  basement: Boxes,
  garden: Flower2,
  other: DoorOpen,
};
