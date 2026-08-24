/**
 * The Header's route -> title table (Header Prompt §14's exact mapping).
 * Deliberately its own small table, not derived from `dashboardNav` - that
 * config's `label`s are tuned for a narrow sidebar row (`"Help"`, next to
 * an icon) and aren't always the same string the Header should show on its
 * own (`"Help & Support"`, per the Header's own spec) - the same "a page
 * can be titled more specifically than its nav entry" split
 * `/app/analytics`'s own `<title>` vs. sidebar label already established.
 *
 * `/app` isn't a real `dashboardNav` entry (the nav points at
 * `/app/planners`, the actual route - see that config's own comment) but
 * still needs a Header title of its own, since it's a real route visited
 * directly - keyed here the same as every other route rather than
 * special-cased in code.
 */
export const dashboardPageTitles: Record<string, string> = {
  "/app": "My Planners",
  // More specific Wedding Planner routes listed before the base
  // `/app/wedding-planner` entry - `getDashboardPageTitle`'s matching
  // below returns on the first prefix match in insertion order, so a
  // narrower route must come first or the base entry would shadow it.
  "/app/wedding-planner/onboarding": "Set Up Your Wedding",
  "/app/wedding-planner/checklist": "Checklist",
  "/app/wedding-planner/timeline": "Timeline",
  "/app/wedding-planner/budget": "Budget",
  "/app/wedding-planner/guests": "Guests",
  "/app/wedding-planner/vendors": "Vendors",
  "/app/wedding-planner/events": "Events",
  "/app/wedding-planner/notes": "Notes",
  "/app/wedding-planner": "Wedding Planner",
  // Same "more specific route before its base" ordering as Wedding Planner
  // above.
  "/app/budget-planner/onboarding": "Set Up Your Budget",
  "/app/budget-planner/budget": "Budget",
  "/app/budget-planner/income": "Income",
  "/app/budget-planner/expenses": "Expenses",
  "/app/budget-planner/transactions": "Transactions",
  "/app/budget-planner/categories": "Categories",
  "/app/budget-planner/accounts": "Accounts",
  "/app/budget-planner/checkout/success": "Purchase Complete",
  "/app/budget-planner/checkout/cancel": "Checkout Cancelled",
  "/app/budget-planner/checkout": "Checkout",
  "/app/budget-planner/goals": "Goals",
  "/app/budget-planner/recurring": "Recurring",
  "/app/budget-planner": "Budget Planner",
  // Same "more specific route before its base" ordering as Wedding/Budget
  // above.
  "/app/travel-planner/onboarding": "Set Up Your Trip",
  "/app/travel-planner/edit": "Edit Trip Details",
  "/app/travel-planner/itinerary": "Itinerary",
  "/app/travel-planner/budget": "Budget",
  "/app/travel-planner/bookings": "Bookings",
  "/app/travel-planner/packing": "Packing",
  "/app/travel-planner/documents": "Documents",
  "/app/travel-planner/travel-information": "Travel Information",
  "/app/travel-planner/checkout/success": "Purchase Complete",
  "/app/travel-planner/checkout/cancel": "Checkout Cancelled",
  "/app/travel-planner/checkout": "Checkout",
  "/app/travel-planner": "Travel Planner",
  // More specific Life Planner routes before its base entry - same ordering
  // rule as Wedding/Budget/Travel above. `/app/life-planner/goals/[goalId]`
  // (a goal's own detail page) has no entry of its own - same as Wedding's
  // `vendors/[vendorId]`, it falls through to `/app/life-planner/goals`'s
  // prefix match below and inherits "Goals," which is honest: the detail
  // page is still part of the Goals section, not a distinct one.
  // `/app/life-planner/tasks/[taskId]` (a task's own detail page) follows
  // the exact same rule - no entry of its own, it falls through to
  // `/app/life-planner/tasks` below and inherits "Tasks."
  // `/app/life-planner/routines/[routineId]` (a routine's own detail page)
  // follows the same rule too - no entry of its own, it falls through to
  // `/app/life-planner/routines` below and inherits "Routines."
  // `/app/life-planner/habits/[habitId]` (a habit's own detail page) follows
  // the same rule too - no entry of its own, it falls through to
  // `/app/life-planner/habits` below and inherits "Habits."
  // `/app/life-planner/planning/weekly`/`/app/life-planner/planning/monthly`
  // (Life Planner Prompt 4 Phase 1) both need their own titles, not
  // `/app/life-planner/planning`'s - that bare route only ever redirects to
  // Weekly (`planning/page.tsx`), so it's never actually rendered for a
  // header title to apply to, but its entry is kept below anyway (the same
  // "every real route gets a title" completeness every other entry here
  // follows) in case that redirect is ever removed.
  "/app/life-planner/areas": "Life Areas",
  "/app/life-planner/goals/new": "New Goal",
  "/app/life-planner/goals": "Goals",
  "/app/life-planner/tasks": "Tasks",
  "/app/life-planner/routines/new": "New Routine",
  "/app/life-planner/routines": "Routines",
  "/app/life-planner/habits/new": "New Habit",
  "/app/life-planner/habits": "Habits",
  "/app/life-planner/planning/weekly": "Weekly Planning",
  "/app/life-planner/planning/monthly": "Monthly Planning",
  "/app/life-planner/planning": "Planning",
  // `/app/life-planner/journal/[entryId]` (a journal entry's own detail
  // page) has no entry of its own - same rule as every other detail route
  // above, it falls through to `/app/life-planner/journal`'s prefix match
  // below and inherits "Journal."
  "/app/life-planner/journal/new": "New Journal Entry",
  "/app/life-planner/journal": "Journal",
  // `/app/life-planner/information/[itemId]` (an important item's own
  // detail page) has no entry of its own - same rule as every other detail
  // route above, it falls through to `/app/life-planner/information`'s
  // prefix match below and inherits "Important Plans & Information."
  "/app/life-planner/information/new": "New Item",
  "/app/life-planner/information": "Important Plans & Information",
  "/app/life-planner": "Life Planner",
  "/app/purchases": "Purchases",
  "/app/planners": "My Planners",
  "/app/analytics": "Quick Stats",
  "/app/activity": "Activity",
  "/app/store": "Store",
  "/app/resources": "Resources",
  "/app/help": "Help & Support",
  "/app/settings": "Settings",
};
