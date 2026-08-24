/**
 * "One planner this user actually has, as the sidebar's Planner Switcher
 * needs to show it" - distinct from `@/types/planner-definition`'s
 * `PlannerDefinition` (what a planner product *is*, the same row for every
 * viewer) and `@/types/dashboard-planner`'s `DashboardPlanner` (a card's
 * worth of progress data for `/app`). This is the shell-navigation view:
 * identity plus the contextual nav items that should render underneath the
 * switcher once this workspace is selected.
 *
 * Deliberately all-serializable (`iconKey`, not a `LucideIcon` component
 * reference) - `getUserPlannerWorkspaces()` (`@/lib/planner-workspaces`) is
 * `server-only` and this type crosses from a Server Component
 * (`AppLayout`) into a Client Component (`DashboardMobileNav`) as a plain
 * prop. A `LucideIcon` reference can't survive that crossing (see
 * `DashboardNavSections`'s own comment on exactly this constraint) -
 * `iconKey` is resolved back into a real icon component client-side, by
 * `PLANNER_WORKSPACE_ICONS` (`@/app/(app)/_components/planner-workspace-icons`),
 * which both `DashboardSidebar` (server) and `PlannerWorkspaceNav` (client)
 * can import directly without ever needing the icon itself as a prop.
 */
export type PlannerWorkspaceIconKey =
  | "dashboard"
  | "checklist"
  | "timeline"
  | "budget"
  | "guests"
  | "vendors"
  | "events"
  | "notes"
  | "generic"
  // Budget Planner's own nav icons - "dashboard" (Heart) stays Wedding-only,
  // since reusing it for a money product's Overview page would read as a
  // mismatched theme rather than a generic "workspace home" glyph.
  | "overview"
  | "income"
  | "expenses"
  | "goals"
  | "recurring"
  | "transactions"
  | "categories"
  | "accounts"
  // Travel Planner's own workspace icon - "dashboard" (Heart) stays
  // Wedding-only (see that key's own comment), so a travel product gets its
  // own thematically-apt glyph rather than reusing a mismatched one.
  | "trip"
  // Travel Planner's itinerary nav item (Prompt 2 Phase 1).
  | "itinerary"
  // Travel Planner's bookings nav item (Prompt 3 Phase 3) - "budget" is
  // reused as-is for its Budget nav item (Phase 1/2), the same generic
  // money glyph Wedding/Budget Planner already share.
  | "bookings"
  // Travel Planner's packing nav item (Prompt 4 Phase 1).
  | "packing"
  // Travel Planner's documents nav item (Prompt 4 Phase 2) - a distinct
  // glyph from Wedding's "notes" (NotebookText, a different concept - free
  // notes vs. a document checklist) and from Home Planner's own document
  // handling, if any.
  | "documents"
  // Travel Planner's Travel Information nav item (Prompt 4 Phase 3).
  | "information"
  // Home Planner's own workspace icon (Prompt 1 Phase 1) - "dashboard"
  // (Heart) stays Wedding-only (see that key's own comment), so a home
  // product gets its own thematically-apt glyph rather than reusing a
  // mismatched one.
  | "home"
  // Home Planner's important contacts nav item (Prompt 1 Phase 2).
  | "contacts"
  // Home Planner's rooms nav item (Prompt 2 Phase 1).
  | "rooms"
  // Home Planner's inventory nav item (Prompt 2 Phase 2).
  | "inventory"
  // Home Planner's important items nav item (Prompt 2 Phase 3).
  | "important"
  // Home Planner's maintenance nav item (Prompt 3 Phase 1).
  | "maintenance"
  // Home Planner's bills nav item (Prompt 4 Phase 1).
  | "bills"
  // Home Planner's projects nav item (Prompt 4 Phase 3).
  | "projects"
  // Life Planner's own workspace icon (Life Planner Prompt 1) - "dashboard"
  // (Heart) stays Wedding-only (see that key's own comment), and "trip"
  // (Plane)/"itinerary" (Compass) stay Travel-only, so a life-planning
  // product gets its own thematically-apt glyph rather than reusing a
  // mismatched one.
  | "life"
  // Life Planner's Areas nav item (Life Planner Prompt 2 Phase 1) - a
  // distinct glyph from "life" (Sparkles, the workspace's own icon) and
  // from Budget's "categories" (Tags), since Life Areas is a different
  // concept (a life domain, not a money category) even though both are
  // "a small named group" in the abstract.
  | "areas"
  // Life Planner's Tasks nav item (Life Planner Prompt 3 Phase 1) - a
  // distinct glyph from Wedding's "checklist" (ListChecks, a fixed
  // milestone-tracking list) and Home's "maintenance" (Wrench, home upkeep
  // specifically), since a Life Task is a general-purpose personal to-do,
  // not either of those.
  | "tasks"
  // Life Planner's Routines nav item (Life Planner Prompt 3 Phase 2) - a
  // recurring checklist, distinct from every other icon already in this
  // union (none of which represent repetition).
  | "routines"
  // Life Planner's Habits nav item (Life Planner Prompt 3 Phase 3) - a
  // distinct glyph from "routines" (Repeat, a recurring checklist of
  // sub-items) since a Habit is flatter (no sub-items, just a name and a
  // log), closer in spirit to a single recurring goal check-in.
  | "habits"
  // Life Planner's Planning nav item (Life Planner Prompt 4 Phase 1) - the
  // Weekly & Monthly Planning views. Distinct from every other icon already
  // in this union - a calendar/date glyph, since this is the one Life
  // Planner section organized by date range rather than by content type.
  | "planning"
  // Life Planner's Journal nav item (Life Planner Prompt 4 Phase 2) - a
  // distinct glyph from Wedding's "notes" (NotebookText, a plain free-text
  // note) and Budget's "generic" (NotebookPen), since a Journal Entry is a
  // dated personal reflection, not either of those.
  | "journal"
  // Life Planner's Important Plans & Information nav item (Life Planner
  // Prompt 4 Phase 3) - named distinctly from Travel Planner's own
  // "information" key (Info, a plain "i" glyph for its Travel Information
  // nav item) even though the two labels sound similar, since this is a
  // genuinely different concept with its own bookmark/archive-style glyph:
  // undated reference material - a plan, an intention, a milestone note - a
  // user comes back to look up, closer to a personal archive entry than a
  // diary page (see `LifeImportantItem`'s own comment). Also distinct from
  // "journal" (BookOpenText, a dated reflection) one item up.
  | "importantInfo";

/** One contextual nav item under a selected workspace - e.g. Wedding Planner's "Checklist". */
export interface PlannerWorkspaceNavItem {
  label: string;
  href: string;
  iconKey: PlannerWorkspaceIconKey;
}

/**
 * One planner workspace the current user actually has. `href` is both this
 * workspace's canonical dashboard entry point (what clicking it in the
 * switcher navigates to) and the route prefix `PlannerWorkspaceNav` matches
 * the current pathname against to decide which workspace is "active" -
 * the same prefix-match convention `DashboardNavLink` already uses for its
 * own active state.
 */
export interface PlannerWorkspace {
  id: string;
  name: string;
  href: string;
  iconKey: PlannerWorkspaceIconKey;
  /** Contextual sub-navigation for this workspace. Can be empty - a single-page planner (the generic catalog's `PlannerRuntime` planners) genuinely has no sub-navigation of its own, and that's an honest empty list, not a gap to fill. */
  navItems: PlannerWorkspaceNavItem[];
}
