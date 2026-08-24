import { Eyebrow, Heading, Text } from "@/components/ui";
import type { LifePlan } from "@/types/life-planner";

interface LifePlannerHeaderProps {
  plan: LifePlan;
}

/**
 * The dashboard's own identity block (Phase 3 §1) - the Life Planner's
 * equivalent of Travel Planner's `TravelHeader`. Greets by
 * `planningIdentity` when the Life Profile has already captured one (it's
 * free text, e.g. "I'm the kind of person who plans everything two months
 * out" - not a display name, so this reads as a soft, secondary line
 * rather than a name-shaped greeting), and falls back to a plain, honest
 * greeting when the profile is still empty. Never gamified ("Welcome back,
 * champion!") - matches the calm register the rest of this workspace uses.
 */
export function LifePlannerHeader({ plan }: LifePlannerHeaderProps) {
  return (
    <div className="animate-hero-in" style={{ animationDelay: "40ms" }}>
      <Eyebrow tone="brand">Life Planner</Eyebrow>
      <Heading as="h1" size="h2" className="mt-1">
        Welcome back
      </Heading>
      <Text size="body-lg" tone="muted" className="mt-2 max-w-xl">
        {plan.planningIdentity
          ? plan.planningIdentity
          : "Your Life Profile is the context everything else in this workspace builds on."}
      </Text>
    </div>
  );
}
