import "server-only";

import { getBudgetPlanForCurrentUser } from "@/lib/budget/plans";
import { getHomeForCurrentUser } from "@/lib/home-planner/homes";
import { getLifePlanForCurrentUser } from "@/lib/life-planner/life-plans";
import { getPlannerDefinitionsByIds } from "@/lib/planners";
import { getUserPlannerInstances } from "@/lib/planner-persistence";
import { getTripForCurrentUser } from "@/lib/travel/trips";
import { getWeddingForCurrentUser } from "@/lib/wedding/weddings";
import type { PlannerWorkspace } from "@/types/planner-workspace";

/**
 * The Planner Switcher's own data-access boundary - "which planner
 * workspaces does the current user actually have," composed from every
 * real source that can produce one, the same "compose across sources"
 * reasoning `store/page.tsx` already applies to Store listings (see that
 * file's own comment):
 *
 * 1. The Wedding Planner (`@/lib/wedding/weddings`) - a real, hand-built
 *    product with its own tables and routes, not part of the generic
 *    schema-driven catalog. Present only once the user has completed
 *    onboarding (`getWeddingForCurrentUser()` returns non-`null`) - a
 *    visitor who hasn't onboarded yet has zero workspaces from this
 *    source, not a fake one.
 * 2. The Budget Planner (`@/lib/budget/plans`) - the second hand-built
 *    product, same shape as Wedding: its own tables, its own routes under
 *    `/app/budget-planner`, present only once `getBudgetPlanForCurrentUser()`
 *    returns non-`null`.
 * 3. The Travel Planner (`@/lib/travel/trips`) - the third hand-built
 *    product (Everplans Travel Planner Prompt 1), present only once
 *    `getTripForCurrentUser()` returns non-`null`. Its `navItems` list
 *    grows one real route at a time - "Dashboard", "Itinerary", "Budget",
 *    "Bookings", "Packing", "Documents", and "Travel Information" today
 *    (Prompts 1-4) - each earns its own nav item only once its route is
 *    real (Phase 4's own rule: "do not create functional links to
 *    features that have not yet been implemented").
 * 4. The Home Planner (`@/lib/home-planner/homes`) - the fourth hand-built
 *    product (Everplans Home Planner Prompt 1), present only once
 *    `getHomeForCurrentUser()` returns non-`null` - true once a user has
 *    completed home setup (Phase 2's onboarding flow). Its `navItems` list
 *    grows one real route at a time - "Dashboard", "Rooms", "Household",
 *    and "Contacts" today (Prompt 2 Phase 1) - inventory/maintenance don't
 *    exist yet, the same rule Travel Planner's own entry follows.
 * 5. The Life Planner (`@/lib/life-planner/life-plans`) - the fifth
 *    hand-built product (Life Planner Prompt 1), present only once
 *    `getLifePlanForCurrentUser()` returns non-`null` - true for every
 *    signed-in visitor after their first visit to `/app/life-planner`,
 *    since that route auto-provisions a bare `life_plans` row rather than
 *    gating behind a setup flow (unlike Home Planner). Its `navItems` list
 *    grows one real route at a time, the same rule every other hand-built
 *    product's entry follows - "Dashboard", "Areas", "Goals", "Tasks",
 *    "Routines", "Habits", "Planning", "Journal", and "Important Info"
 *    today.
 * 6. The generic catalog's own planners the user has actually started
 *    (`getUserPlannerInstances()`, `@/lib/planner-persistence`) - always
 *    `[]` today (no real `planner_definitions` source exists yet to join
 *    against - see `@/lib/planners`'s own comment), but the composition
 *    itself is real: the moment a real generic planner + instance exist,
 *    it appears here automatically, as its own workspace with a single
 *    "open" nav item (a schema-driven planner is one page, not a
 *    multi-route product like Wedding/Budget - an honest empty `navItems`
 *    list, not a gap to fill).
 *
 * Order matters: hand-built products first, in the order they were added to
 * the platform, then generic ones in whatever order `getUserPlannerInstances`
 * returns them (most-recently-active first - see that function's own
 * query). The Planner Switcher renders this order as-is, so a user's most
 * relevant workspace surfaces first without either caller needing its own
 * sort.
 */
export async function getUserPlannerWorkspaces(): Promise<PlannerWorkspace[]> {
  const [wedding, budgetPlan, trip, home, lifePlan, instances] = await Promise.all([
    getWeddingForCurrentUser(),
    getBudgetPlanForCurrentUser(),
    getTripForCurrentUser(),
    getHomeForCurrentUser(),
    getLifePlanForCurrentUser(),
    getUserPlannerInstances(),
  ]);

  const workspaces: PlannerWorkspace[] = [];

  if (wedding) {
    workspaces.push({
      id: "wedding-planner",
      name: "Wedding Planner",
      href: "/app/wedding-planner",
      iconKey: "dashboard",
      navItems: [
        { label: "Dashboard", href: "/app/wedding-planner", iconKey: "dashboard" },
        { label: "Checklist", href: "/app/wedding-planner/checklist", iconKey: "checklist" },
        { label: "Timeline", href: "/app/wedding-planner/timeline", iconKey: "timeline" },
        { label: "Budget", href: "/app/wedding-planner/budget", iconKey: "budget" },
        { label: "Guests", href: "/app/wedding-planner/guests", iconKey: "guests" },
        { label: "Vendors", href: "/app/wedding-planner/vendors", iconKey: "vendors" },
        { label: "Events", href: "/app/wedding-planner/events", iconKey: "events" },
        { label: "Notes", href: "/app/wedding-planner/notes", iconKey: "notes" },
      ],
    });
  }

  if (budgetPlan) {
    workspaces.push({
      id: "budget-planner",
      name: "Budget Planner",
      href: "/app/budget-planner",
      iconKey: "budget",
      navItems: [
        { label: "Overview", href: "/app/budget-planner", iconKey: "overview" },
        { label: "Income", href: "/app/budget-planner/income", iconKey: "income" },
        { label: "Expenses", href: "/app/budget-planner/expenses", iconKey: "expenses" },
        { label: "Transactions", href: "/app/budget-planner/transactions", iconKey: "transactions" },
        { label: "Categories", href: "/app/budget-planner/categories", iconKey: "categories" },
        { label: "Accounts", href: "/app/budget-planner/accounts", iconKey: "accounts" },
        { label: "Budget", href: "/app/budget-planner/budget", iconKey: "budget" },
        { label: "Goals", href: "/app/budget-planner/goals", iconKey: "goals" },
        { label: "Recurring", href: "/app/budget-planner/recurring", iconKey: "recurring" },
      ],
    });
  }

  if (trip) {
    workspaces.push({
      id: "travel-planner",
      name: "Travel Planner",
      href: "/app/travel-planner",
      iconKey: "trip",
      navItems: [
        { label: "Dashboard", href: "/app/travel-planner", iconKey: "trip" },
        { label: "Itinerary", href: "/app/travel-planner/itinerary", iconKey: "itinerary" },
        { label: "Budget", href: "/app/travel-planner/budget", iconKey: "budget" },
        { label: "Bookings", href: "/app/travel-planner/bookings", iconKey: "bookings" },
        { label: "Packing", href: "/app/travel-planner/packing", iconKey: "packing" },
        { label: "Documents", href: "/app/travel-planner/documents", iconKey: "documents" },
        { label: "Travel Information", href: "/app/travel-planner/travel-information", iconKey: "information" },
      ],
    });
  }

  if (home) {
    workspaces.push({
      id: "home-planner",
      name: "Home Planner",
      href: "/app/home-planner",
      iconKey: "home",
      navItems: [
        { label: "Dashboard", href: "/app/home-planner", iconKey: "home" },
        { label: "Rooms", href: "/app/home-planner/rooms", iconKey: "rooms" },
        { label: "Inventory", href: "/app/home-planner/inventory", iconKey: "inventory" },
        { label: "Important Items", href: "/app/home-planner/important-items", iconKey: "important" },
        { label: "Maintenance", href: "/app/home-planner/maintenance", iconKey: "maintenance" },
        { label: "Bills", href: "/app/home-planner/bills", iconKey: "bills" },
        { label: "Documents", href: "/app/home-planner/documents", iconKey: "documents" },
        { label: "Projects", href: "/app/home-planner/projects", iconKey: "projects" },
        { label: "Household", href: "/app/home-planner/household", iconKey: "guests" },
        { label: "Contacts", href: "/app/home-planner/contacts", iconKey: "contacts" },
      ],
    });
  }

  if (lifePlan) {
    workspaces.push({
      id: "life-planner",
      name: "Life Planner",
      href: "/app/life-planner",
      iconKey: "life",
      navItems: [
        { label: "Dashboard", href: "/app/life-planner", iconKey: "life" },
        { label: "Areas", href: "/app/life-planner/areas", iconKey: "areas" },
        { label: "Goals", href: "/app/life-planner/goals", iconKey: "goals" },
        { label: "Tasks", href: "/app/life-planner/tasks", iconKey: "tasks" },
        { label: "Routines", href: "/app/life-planner/routines", iconKey: "routines" },
        { label: "Habits", href: "/app/life-planner/habits", iconKey: "habits" },
        { label: "Planning", href: "/app/life-planner/planning", iconKey: "planning" },
        { label: "Journal", href: "/app/life-planner/journal", iconKey: "journal" },
        { label: "Important Info", href: "/app/life-planner/information", iconKey: "importantInfo" },
      ],
    });
  }

  if (instances.length > 0) {
    const definitions = await getPlannerDefinitionsByIds(instances.map((instance) => instance.plannerId));
    const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));

    for (const instance of instances) {
      const definition = definitionById.get(instance.plannerId);
      // An instance whose definition no longer resolves - skipped rather
      // than rendered as a switcher entry with no real name to show (the
      // same defensive shape `getActivePlanners` already applies, see
      // `@/lib/dashboard-planners`'s own comment).
      if (!definition) continue;

      workspaces.push({
        id: definition.id,
        name: definition.title,
        href: `/app/planners/${definition.slug}`,
        iconKey: "generic",
        navItems: [],
      });
    }
  }

  return workspaces;
}
