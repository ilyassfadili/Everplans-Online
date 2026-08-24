import type { Home, HomeSetupProgress } from "@/types/home-planner";

/**
 * Home setup progress, derived from a home's own fields at read time - the
 * same "derived, never stored" rule `@/lib/travel/progress.ts` follows for
 * `TripSetupProgress`. Name, home type, and ownership status are all
 * required at creation (`createHome`'s own schema), so they're always
 * complete the moment a home exists; address, household, and contacts are
 * the parts that actually vary and represent genuine progress. Deliberately
 * scoped to only what Prompt 1 implemented - no rooms/inventory/maintenance
 * steps, which don't exist yet (Phase 3: "do not create fake progress for
 * features that do not yet exist").
 */
export function calculateHomeSetupProgress(home: Home, householdMemberCount: number, contactCount: number): HomeSetupProgress {
  const steps = [
    home.name.length > 0,
    Boolean(home.homeType),
    Boolean(home.addressLine1),
    householdMemberCount > 0,
    contactCount > 0,
  ];

  const completedSteps = steps.filter(Boolean).length;
  const totalSteps = steps.length;

  return {
    completedSteps,
    totalSteps,
    percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
  };
}
