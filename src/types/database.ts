/**
 * Hand-written Supabase database types, kept manually in sync with
 * `supabase/migrations/` - not generated. Generating real types requires
 * either a running local Supabase instance or an authenticated, linked
 * remote project (`supabase gen types typescript --linked`); neither is
 * available in this environment, the same constraint that has kept every
 * migration in this repo written-but-not-yet-applied (see each
 * migration's own header comment). This file exists so the Supabase
 * clients (`@/lib/supabase/client.ts`, `server.ts`) are still typed
 * against the real, current schema rather than left as `any` - every
 * column here matches its migration file exactly, and it should be
 * updated by hand whenever a migration adds, removes, or renames a
 * column, in the same commit as that migration.
 *
 * Every table declared here is one the application code actually queries
 * through a typed Supabase client - an omitted table doesn't stay
 * "untyped and fine," it resolves `.from("that_table")` to `never` and
 * fails every call against it (this repo's own first draft of this file
 * did exactly that to `contact_submissions` before this comment was
 * corrected).
 *
 * The shape each table interface must satisfy - `Row`/`Insert`/`Update`/
 * `Relationships`, all four - comes from `@supabase/postgrest-js`'s
 * `GenericTable` (via `@supabase/supabase-js`'s `SupabaseClient` generic).
 * `Relationships` is genuinely required by that type even though nothing
 * here uses embedded-resource queries (`select("*, planner_categories(*)")`)
 * yet - omitted, it silently fails to structurally match `GenericTable`
 * and every query against that table resolves to `never` instead of a
 * real error pointing at the cause. Left empty (`[]`) for every table
 * below since no foreign-key relationship is queried through embedding
 * today; fill one in (matching `GenericRelationship`'s shape) the day a
 * query actually needs it.
 */

interface ContactSubmissionsTable {
  Row: {
    id: string;
    name: string;
    email: string;
    reason: string;
    message: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    email: string;
    reason: string;
    message: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    email?: string;
    reason?: string;
    message?: string;
    created_at?: string;
  };
  Relationships: [];
}

interface ProfilesTable {
  Row: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    language: string;
    date_format: string;
    time_format: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    language?: string;
    date_format?: string;
    time_format?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    language?: string;
    date_format?: string;
    time_format?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface PlannerCategoriesTable {
  Row: {
    id: string;
    slug: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    slug: string;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    slug?: string;
    name?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface PlannerDefinitionsTable {
  Row: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category_id: string;
    status: string;
    schema_version: number;
    cover_image_url: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    slug: string;
    title: string;
    description?: string;
    category_id: string;
    status?: string;
    schema_version?: number;
    cover_image_url?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    slug?: string;
    title?: string;
    description?: string;
    category_id?: string;
    status?: string;
    schema_version?: number;
    cover_image_url?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  // Not `[]`: `planner_definitions.category_id` is a real foreign key to
  // `planner_categories.id` (see the migration's `references` clause),
  // and this is the one relationship declared because it's the one an
  // embedded-select query would plausibly reach for
  // (`select("*, planner_categories(*)")`) even though nothing calls
  // that today - `src/lib/planners.ts` currently does the category
  // lookup as a separate query instead.
  Relationships: [
    {
      foreignKeyName: "planner_definitions_category_id_fkey";
      columns: ["category_id"];
      isOneToOne: false;
      referencedRelation: "planner_categories";
      referencedColumns: ["id"];
    },
  ];
}

interface EntitlementsTable {
  Row: {
    id: string;
    user_id: string;
    planner_id: string;
    status: string;
    granted_at: string;
    expires_at: string | null;
    order_id: string | null;
    revoked_at: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    planner_id: string;
    status?: string;
    granted_at?: string;
    expires_at?: string | null;
    order_id?: string | null;
    revoked_at?: string | null;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    planner_id?: string;
    status?: string;
    granted_at?: string;
    expires_at?: string | null;
    order_id?: string | null;
    revoked_at?: string | null;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
  // `planner_id` is a real foreign key to `planner_definitions.id`, and
  // (since Everplans Money Prompt 4) `order_id` a real foreign key to
  // `orders.id` (see the migration) - declared for the same reason
  // `planner_definitions.category_id` is: the relationship an embedded
  // select would plausibly reach for, even though
  // `getActiveEntitlement` (src/lib/entitlements.ts) queries both as
  // separate, plain lookups today.
  Relationships: [
    {
      foreignKeyName: "entitlements_planner_id_fkey";
      columns: ["planner_id"];
      isOneToOne: false;
      referencedRelation: "planner_definitions";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "entitlements_order_id_fkey";
      columns: ["order_id"];
      isOneToOne: false;
      referencedRelation: "orders";
      referencedColumns: ["id"];
    },
  ];
}

// The two `security definer` RPC functions from
// 20260819000003_commerce_provisioning.sql - callable only via
// `createSupabaseServiceClient().rpc(...)` (src/lib/supabase/service.ts),
// never through the ordinary publishable-key clients (EXECUTE is revoked
// from anon/authenticated at the database level; see that migration).
// `commerce_event_log`, the table these functions write to internally,
// is deliberately NOT declared in `Tables` above - nothing in this
// codebase ever queries it directly through a Supabase client, only
// these two functions touch it, from inside their own function bodies.
interface GrantPlannerEntitlementFunction {
  Args: {
    p_user_id: string;
    p_planner_id: string;
    p_external_event_id: string;
    p_source: string;
    p_expires_at?: string | null;
    p_order_id?: string | null;
    p_metadata?: Record<string, unknown>;
  };
  Returns: EntitlementsTable["Row"];
}

interface RevokePlannerEntitlementFunction {
  Args: {
    p_user_id: string;
    p_planner_id: string;
    p_external_event_id: string;
    p_source: string;
    p_metadata?: Record<string, unknown>;
  };
  Returns: EntitlementsTable["Row"];
}

// `20260905000000_profile_self_heal.sql`'s own escape hatch - inserts the
// caller's own missing `profiles` row (id resolved from their JWT via
// `auth.uid()`, never a parameter), for the same reason a client can't
// just upsert one itself: `profiles` deliberately has no INSERT policy for
// `authenticated` (see `20260819000001_profiles.sql`'s own comment).
interface EnsureProfileExistsFunction {
  Args: Record<string, never>;
  Returns: undefined;
}

interface PlannerInstancesTable {
  Row: {
    id: string;
    user_id: string;
    planner_id: string;
    status: string;
    current_page_id: string | null;
    started_at: string | null;
    last_active_at: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    planner_id: string;
    status?: string;
    current_page_id?: string | null;
    started_at?: string | null;
    last_active_at?: string;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    planner_id?: string;
    status?: string;
    current_page_id?: string | null;
    started_at?: string | null;
    last_active_at?: string;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "planner_instances_planner_id_fkey";
      columns: ["planner_id"];
      isOneToOne: false;
      referencedRelation: "planner_definitions";
      referencedColumns: ["id"];
    },
  ];
}

interface PlannerAnswersTable {
  Row: {
    id: string;
    instance_id: string;
    field_id: string;
    value: unknown;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    instance_id: string;
    field_id: string;
    value?: unknown;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    instance_id?: string;
    field_id?: string;
    value?: unknown;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "planner_answers_instance_id_fkey";
      columns: ["instance_id"];
      isOneToOne: false;
      referencedRelation: "planner_instances";
      referencedColumns: ["id"];
    },
  ];
}

interface PlannerActivityEventsTable {
  Row: {
    id: string;
    user_id: string;
    planner_id: string;
    instance_id: string;
    event_type: string;
    description: string;
    metadata: unknown;
    occurred_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    planner_id: string;
    instance_id: string;
    event_type: string;
    description: string;
    metadata?: unknown;
    occurred_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    planner_id?: string;
    instance_id?: string;
    event_type?: string;
    description?: string;
    metadata?: unknown;
    occurred_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "planner_activity_events_instance_id_fkey";
      columns: ["instance_id"];
      isOneToOne: false;
      referencedRelation: "planner_instances";
      referencedColumns: ["id"];
    },
  ];
}

// Wedding Planner - its own product, not the generic planner marketplace
// above (see `20260823000000_wedding_workspace.sql`'s own comment for why
// it's a separate table rather than a `planner_definitions` row).
interface WeddingsTable {
  Row: {
    id: string;
    owner_id: string;
    partner_one_name: string;
    partner_two_name: string;
    wedding_date: string | null;
    currency: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    partner_one_name: string;
    partner_two_name: string;
    wedding_date?: string | null;
    currency?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    partner_one_name?: string;
    partner_two_name?: string;
    wedding_date?: string | null;
    currency?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripsTable {
  Row: {
    id: string;
    owner_id: string;
    destination: string;
    start_date: string;
    end_date: string;
    traveler_count: number;
    trip_type: string;
    trip_goals: string | null;
    notes: string | null;
    total_budget_cents: number;
    currency: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    destination: string;
    start_date: string;
    end_date: string;
    traveler_count?: number;
    trip_type?: string;
    trip_goals?: string | null;
    notes?: string | null;
    total_budget_cents?: number;
    currency?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    destination?: string;
    start_date?: string;
    end_date?: string;
    traveler_count?: number;
    trip_type?: string;
    trip_goals?: string | null;
    notes?: string | null;
    total_budget_cents?: number;
    currency?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripBudgetCategoriesTable {
  Row: {
    id: string;
    trip_id: string;
    name: string;
    planned_amount_cents: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_id: string;
    name: string;
    planned_amount_cents?: number;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_id?: string;
    name?: string;
    planned_amount_cents?: number;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripExpensesTable {
  Row: {
    id: string;
    trip_id: string;
    category_id: string | null;
    title: string;
    amount_cents: number;
    expense_date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_id: string;
    category_id?: string | null;
    title: string;
    amount_cents: number;
    expense_date: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_id?: string;
    category_id?: string | null;
    title?: string;
    amount_cents?: number;
    expense_date?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripBookingsTable {
  Row: {
    id: string;
    trip_id: string;
    booking_type: string;
    title: string;
    provider: string | null;
    confirmation_number: string | null;
    booking_date: string;
    booking_time: string | null;
    location: string | null;
    cost_cents: number | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_id: string;
    booking_type?: string;
    title: string;
    provider?: string | null;
    confirmation_number?: string | null;
    booking_date: string;
    booking_time?: string | null;
    location?: string | null;
    cost_cents?: number | null;
    status?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_id?: string;
    booking_type?: string;
    title?: string;
    provider?: string | null;
    confirmation_number?: string | null;
    booking_date?: string;
    booking_time?: string | null;
    location?: string | null;
    cost_cents?: number | null;
    status?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripPackingItemsTable {
  Row: {
    id: string;
    trip_id: string;
    name: string;
    category: string;
    quantity: number;
    is_complete: boolean;
    notes: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_id: string;
    name: string;
    category?: string;
    quantity?: number;
    is_complete?: boolean;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_id?: string;
    name?: string;
    category?: string;
    quantity?: number;
    is_complete?: boolean;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripDocumentsTable {
  Row: {
    id: string;
    trip_id: string;
    document_type: string;
    name: string;
    status: string;
    expiry_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_id: string;
    document_type?: string;
    name: string;
    status?: string;
    expiry_date?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_id?: string;
    document_type?: string;
    name?: string;
    status?: string;
    expiry_date?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripEmergencyContactsTable {
  Row: {
    id: string;
    trip_id: string;
    name: string;
    relationship: string;
    phone: string;
    email: string | null;
    notes: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_id: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_id?: string;
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string | null;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripDaysTable {
  Row: {
    id: string;
    trip_id: string;
    day_date: string;
    title: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_id: string;
    day_date: string;
    title?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_id?: string;
    day_date?: string;
    title?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface TripActivitiesTable {
  Row: {
    id: string;
    trip_day_id: string;
    title: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    category: string;
    notes: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    trip_day_id: string;
    title: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    category?: string;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    trip_day_id?: string;
    title?: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    category?: string;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface WeddingMilestonesTable {
  Row: {
    id: string;
    wedding_id: string;
    title: string;
    description: string | null;
    status: string;
    target_date: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    title: string;
    description?: string | null;
    status?: string;
    target_date?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    title?: string;
    description?: string | null;
    status?: string;
    target_date?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_milestones_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingTasksTable {
  Row: {
    id: string;
    wedding_id: string;
    milestone_id: string | null;
    event_id: string | null;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    completed_at: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    milestone_id?: string | null;
    title: string;
    event_id?: string | null;
    description?: string | null;
    status?: string;
    priority?: string;
    due_date?: string | null;
    completed_at?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    milestone_id?: string | null;
    title?: string;
    description?: string | null;
    event_id?: string | null;
    status?: string;
    priority?: string;
    due_date?: string | null;
    completed_at?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_tasks_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "wedding_tasks_milestone_id_fkey";
      columns: ["milestone_id"];
      isOneToOne: false;
      referencedRelation: "wedding_milestones";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingImportantDatesTable {
  Row: {
    id: string;
    wedding_id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    title: string;
    description?: string | null;
    event_date: string;
    event_time?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    title?: string;
    description?: string | null;
    event_date?: string;
    event_time?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_important_dates_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingBudgetCategoriesTable {
  Row: {
    id: string;
    wedding_id: string;
    name: string;
    description: string | null;
    planned_amount_cents: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    name: string;
    description?: string | null;
    planned_amount_cents?: number;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    name?: string;
    description?: string | null;
    planned_amount_cents?: number;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_budget_categories_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingVendorsTable {
  Row: {
    id: string;
    wedding_id: string;
    name: string;
    category: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    notes: string | null;
    planned_amount_cents: number | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    name: string;
    category?: string | null;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    notes?: string | null;
    planned_amount_cents?: number | null;
    status?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    name?: string;
    category?: string | null;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    notes?: string | null;
    planned_amount_cents?: number | null;
    status?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_vendors_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingGuestsTable {
  Row: {
    id: string;
    wedding_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    group_label: string | null;
    rsvp_status: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    group_label?: string | null;
    rsvp_status?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string | null;
    phone?: string | null;
    group_label?: string | null;
    rsvp_status?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_guests_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingExpensesTable {
  Row: {
    id: string;
    wedding_id: string;
    category_id: string | null;
    vendor_id: string | null;
    title: string;
    amount_cents: number;
    expense_date: string;
    note: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    category_id?: string | null;
    vendor_id?: string | null;
    title: string;
    amount_cents: number;
    expense_date: string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    category_id?: string | null;
    vendor_id?: string | null;
    title?: string;
    amount_cents?: number;
    expense_date?: string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_expenses_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "wedding_expenses_category_id_fkey";
      columns: ["category_id"];
      isOneToOne: false;
      referencedRelation: "wedding_budget_categories";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "wedding_expenses_vendor_id_fkey";
      columns: ["vendor_id"];
      isOneToOne: false;
      referencedRelation: "wedding_vendors";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingVenuesTable {
  Row: {
    id: string;
    wedding_id: string;
    name: string;
    address: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    website: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    name: string;
    address?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    website?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    name?: string;
    address?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    website?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_venues_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingEventsTable {
  Row: {
    id: string;
    wedding_id: string;
    venue_id: string | null;
    name: string;
    description: string | null;
    event_type: string | null;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    venue_id?: string | null;
    name: string;
    description?: string | null;
    event_type?: string | null;
    event_date: string;
    start_time?: string | null;
    end_time?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    venue_id?: string | null;
    name?: string;
    description?: string | null;
    event_type?: string | null;
    event_date?: string;
    start_time?: string | null;
    end_time?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_events_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "wedding_events_venue_id_fkey";
      columns: ["venue_id"];
      isOneToOne: false;
      referencedRelation: "wedding_venues";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingEventVendorsTable {
  Row: { event_id: string; vendor_id: string; created_at: string };
  Insert: { event_id: string; vendor_id: string; created_at?: string };
  Update: { event_id?: string; vendor_id?: string; created_at?: string };
  Relationships: [
    {
      foreignKeyName: "wedding_event_vendors_event_id_fkey";
      columns: ["event_id"];
      isOneToOne: false;
      referencedRelation: "wedding_events";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "wedding_event_vendors_vendor_id_fkey";
      columns: ["vendor_id"];
      isOneToOne: false;
      referencedRelation: "wedding_vendors";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingEventGuestsTable {
  Row: { event_id: string; guest_id: string; created_at: string };
  Insert: { event_id: string; guest_id: string; created_at?: string };
  Update: { event_id?: string; guest_id?: string; created_at?: string };
  Relationships: [
    {
      foreignKeyName: "wedding_event_guests_event_id_fkey";
      columns: ["event_id"];
      isOneToOne: false;
      referencedRelation: "wedding_events";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "wedding_event_guests_guest_id_fkey";
      columns: ["guest_id"];
      isOneToOne: false;
      referencedRelation: "wedding_guests";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingNotesTable {
  Row: {
    id: string;
    wedding_id: string;
    title: string;
    content: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    title: string;
    content?: string;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    title?: string;
    content?: string;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_notes_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingDecisionsTable {
  Row: {
    id: string;
    wedding_id: string;
    title: string;
    description: string | null;
    status: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    title: string;
    description?: string | null;
    status?: string;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    title?: string;
    description?: string | null;
    status?: string;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_decisions_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface WeddingDocumentsTable {
  Row: {
    id: string;
    wedding_id: string;
    title: string;
    storage_path: string;
    file_type: string | null;
    file_size_bytes: number | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    wedding_id: string;
    title: string;
    storage_path: string;
    file_type?: string | null;
    file_size_bytes?: number | null;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    wedding_id?: string;
    title?: string;
    storage_path?: string;
    file_type?: string | null;
    file_size_bytes?: number | null;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "wedding_documents_wedding_id_fkey";
      columns: ["wedding_id"];
      isOneToOne: false;
      referencedRelation: "weddings";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetPlansTable {
  Row: {
    id: string;
    owner_id: string;
    name: string;
    currency: string;
    period_type: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    name?: string;
    currency?: string;
    period_type?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    name?: string;
    currency?: string;
    period_type?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface BudgetIncomeSourcesTable {
  Row: {
    id: string;
    plan_id: string;
    name: string;
    amount_cents: number;
    frequency: string;
    is_active: boolean;
    notes: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    name: string;
    amount_cents?: number;
    frequency?: string;
    is_active?: boolean;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    name?: string;
    amount_cents?: number;
    frequency?: string;
    is_active?: boolean;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_income_sources_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetCategoriesTable {
  Row: {
    id: string;
    plan_id: string;
    name: string;
    group_label: string;
    kind: string;
    planned_amount_cents: number;
    is_archived: boolean;
    sort_order: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    name: string;
    group_label?: string;
    kind?: string;
    planned_amount_cents?: number;
    is_archived?: boolean;
    sort_order?: number;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    name?: string;
    group_label?: string;
    kind?: string;
    planned_amount_cents?: number;
    is_archived?: boolean;
    sort_order?: number;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_categories_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetAccountsTable {
  Row: {
    id: string;
    plan_id: string;
    name: string;
    type: string;
    is_archived: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    name: string;
    type?: string;
    is_archived?: boolean;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    name?: string;
    type?: string;
    is_archived?: boolean;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_accounts_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetIncomeEntriesTable {
  Row: {
    id: string;
    plan_id: string;
    source_id: string | null;
    category_id: string | null;
    account_id: string | null;
    title: string;
    amount_cents: number;
    entry_date: string;
    note: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    source_id?: string | null;
    category_id?: string | null;
    account_id?: string | null;
    title: string;
    amount_cents: number;
    entry_date: string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    source_id?: string | null;
    category_id?: string | null;
    account_id?: string | null;
    title?: string;
    amount_cents?: number;
    entry_date?: string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_income_entries_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_income_entries_source_id_fkey";
      columns: ["source_id"];
      isOneToOne: false;
      referencedRelation: "budget_income_sources";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_income_entries_category_id_fkey";
      columns: ["category_id"];
      isOneToOne: false;
      referencedRelation: "budget_categories";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_income_entries_account_id_fkey";
      columns: ["account_id"];
      isOneToOne: false;
      referencedRelation: "budget_accounts";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetGoalsTable {
  Row: {
    id: string;
    plan_id: string;
    name: string;
    target_amount_cents: number;
    current_amount_cents: number;
    target_date: string | null;
    description: string | null;
    status: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    name: string;
    target_amount_cents: number;
    current_amount_cents?: number;
    target_date?: string | null;
    description?: string | null;
    status?: string;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    name?: string;
    target_amount_cents?: number;
    current_amount_cents?: number;
    target_date?: string | null;
    description?: string | null;
    status?: string;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_goals_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetExpensesTable {
  Row: {
    id: string;
    plan_id: string;
    category_id: string | null;
    recurring_item_id: string | null;
    account_id: string | null;
    title: string;
    amount_cents: number;
    expense_date: string;
    note: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    category_id?: string | null;
    recurring_item_id?: string | null;
    account_id?: string | null;
    title: string;
    amount_cents: number;
    expense_date: string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    category_id?: string | null;
    recurring_item_id?: string | null;
    account_id?: string | null;
    title?: string;
    amount_cents?: number;
    expense_date?: string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_expenses_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_expenses_category_id_fkey";
      columns: ["category_id"];
      isOneToOne: false;
      referencedRelation: "budget_categories";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_expenses_recurring_item_id_fkey";
      columns: ["recurring_item_id"];
      isOneToOne: false;
      referencedRelation: "budget_recurring_items";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_expenses_account_id_fkey";
      columns: ["account_id"];
      isOneToOne: false;
      referencedRelation: "budget_accounts";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetRecurringItemsTable {
  Row: {
    id: string;
    plan_id: string;
    type: string;
    name: string;
    amount_cents: number;
    category_id: string | null;
    account_id: string | null;
    frequency: string;
    start_date: string;
    end_date: string | null;
    next_occurrence_date: string | null;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    type: string;
    name: string;
    amount_cents: number;
    category_id?: string | null;
    account_id?: string | null;
    frequency?: string;
    start_date: string;
    end_date?: string | null;
    next_occurrence_date?: string | null;
    is_active?: boolean;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    type?: string;
    name?: string;
    amount_cents?: number;
    category_id?: string | null;
    account_id?: string | null;
    frequency?: string;
    start_date?: string;
    end_date?: string | null;
    next_occurrence_date?: string | null;
    is_active?: boolean;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_recurring_items_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_recurring_items_category_id_fkey";
      columns: ["category_id"];
      isOneToOne: false;
      referencedRelation: "budget_categories";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_recurring_items_account_id_fkey";
      columns: ["account_id"];
      isOneToOne: false;
      referencedRelation: "budget_accounts";
      referencedColumns: ["id"];
    },
  ];
}

interface BudgetSavingsTargetsTable {
  Row: {
    id: string;
    plan_id: string;
    goal_id: string | null;
    name: string;
    planned_amount_cents: number;
    frequency: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    plan_id: string;
    goal_id?: string | null;
    name: string;
    planned_amount_cents?: number;
    frequency?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    plan_id?: string;
    goal_id?: string | null;
    name?: string;
    planned_amount_cents?: number;
    frequency?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "budget_savings_targets_plan_id_fkey";
      columns: ["plan_id"];
      isOneToOne: false;
      referencedRelation: "budget_plans";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "budget_savings_targets_goal_id_fkey";
      columns: ["goal_id"];
      isOneToOne: false;
      referencedRelation: "budget_goals";
      referencedColumns: ["id"];
    },
  ];
}

// Home Planner - its own product (`20260910000000_home_planner_foundation.sql`,
// `20260910000001_home_planner_contacts.sql`), same "hand-built product,
// not the generic marketplace" shape as `TripsTable`.
interface HomesTable {
  Row: {
    id: string;
    owner_id: string;
    name: string;
    home_type: string;
    ownership_status: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    name: string;
    home_type?: string;
    ownership_status?: string;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    name?: string;
    home_type?: string;
    ownership_status?: string;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface HouseholdMembersTable {
  Row: {
    id: string;
    home_id: string;
    name: string;
    relationship: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    name: string;
    relationship?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    name?: string;
    relationship?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface HomeContactsTable {
  Row: {
    id: string;
    home_id: string;
    name: string;
    role: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    name: string;
    role?: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    name?: string;
    role?: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface HomeRoomsTable {
  Row: {
    id: string;
    home_id: string;
    name: string;
    room_type: string;
    description: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    name: string;
    room_type?: string;
    description?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    name?: string;
    room_type?: string;
    description?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface HomeInventoryItemsTable {
  Row: {
    id: string;
    home_id: string;
    room_id: string | null;
    name: string;
    category: string;
    quantity: number;
    purchase_date: string | null;
    purchase_info: string | null;
    estimated_value_cents: number | null;
    notes: string | null;
    is_important: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    room_id?: string | null;
    name: string;
    category?: string;
    quantity?: number;
    purchase_date?: string | null;
    purchase_info?: string | null;
    estimated_value_cents?: number | null;
    notes?: string | null;
    is_important?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    room_id?: string | null;
    name?: string;
    category?: string;
    quantity?: number;
    purchase_date?: string | null;
    purchase_info?: string | null;
    estimated_value_cents?: number | null;
    notes?: string | null;
    is_important?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "home_inventory_items_room_id_fkey";
      columns: ["room_id"];
      isOneToOne: false;
      referencedRelation: "home_rooms";
      referencedColumns: ["id"];
    },
  ];
}

interface HomeMaintenanceTasksTable {
  Row: {
    id: string;
    home_id: string;
    room_id: string | null;
    name: string;
    description: string | null;
    category: string;
    priority: string;
    due_date: string | null;
    notes: string | null;
    completed_at: string | null;
    recurrence_frequency: string | null;
    recurrence_interval_days: number | null;
    recurrence_active: boolean;
    series_root_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    room_id?: string | null;
    name: string;
    description?: string | null;
    category?: string;
    priority?: string;
    due_date?: string | null;
    notes?: string | null;
    completed_at?: string | null;
    recurrence_frequency?: string | null;
    recurrence_interval_days?: number | null;
    recurrence_active?: boolean;
    series_root_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    room_id?: string | null;
    name?: string;
    description?: string | null;
    category?: string;
    priority?: string;
    due_date?: string | null;
    notes?: string | null;
    completed_at?: string | null;
    recurrence_frequency?: string | null;
    recurrence_interval_days?: number | null;
    recurrence_active?: boolean;
    series_root_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "home_maintenance_tasks_room_id_fkey";
      columns: ["room_id"];
      isOneToOne: false;
      referencedRelation: "home_rooms";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "home_maintenance_tasks_series_root_id_fkey";
      columns: ["series_root_id"];
      isOneToOne: false;
      referencedRelation: "home_maintenance_tasks";
      referencedColumns: ["id"];
    },
  ];
}

interface HomeBillsTable {
  Row: {
    id: string;
    home_id: string;
    name: string;
    category: string;
    amount_cents: number;
    due_date: string | null;
    notes: string | null;
    paid_at: string | null;
    recurrence_frequency: string | null;
    recurrence_interval_days: number | null;
    recurrence_active: boolean;
    series_root_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    name: string;
    category?: string;
    amount_cents: number;
    due_date?: string | null;
    notes?: string | null;
    paid_at?: string | null;
    recurrence_frequency?: string | null;
    recurrence_interval_days?: number | null;
    recurrence_active?: boolean;
    series_root_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    name?: string;
    category?: string;
    amount_cents?: number;
    due_date?: string | null;
    notes?: string | null;
    paid_at?: string | null;
    recurrence_frequency?: string | null;
    recurrence_interval_days?: number | null;
    recurrence_active?: boolean;
    series_root_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "home_bills_series_root_id_fkey";
      columns: ["series_root_id"];
      isOneToOne: false;
      referencedRelation: "home_bills";
      referencedColumns: ["id"];
    },
  ];
}

interface HomeDocumentsTable {
  Row: {
    id: string;
    home_id: string;
    title: string;
    category: string;
    description: string | null;
    document_date: string | null;
    storage_path: string;
    file_type: string | null;
    file_size_bytes: number | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    title: string;
    category?: string;
    description?: string | null;
    document_date?: string | null;
    storage_path: string;
    file_type?: string | null;
    file_size_bytes?: number | null;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    title?: string;
    category?: string;
    description?: string | null;
    document_date?: string | null;
    storage_path?: string;
    file_type?: string | null;
    file_size_bytes?: number | null;
    related_entity_type?: string | null;
    related_entity_id?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

interface HomeProjectsTable {
  Row: {
    id: string;
    home_id: string;
    room_id: string | null;
    name: string;
    description: string | null;
    category: string;
    status: string;
    start_date: string | null;
    target_completion_date: string | null;
    budget_planned_cents: number | null;
    budget_used_cents: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    home_id: string;
    room_id?: string | null;
    name: string;
    description?: string | null;
    category?: string;
    status?: string;
    start_date?: string | null;
    target_completion_date?: string | null;
    budget_planned_cents?: number | null;
    budget_used_cents?: number | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    home_id?: string;
    room_id?: string | null;
    name?: string;
    description?: string | null;
    category?: string;
    status?: string;
    start_date?: string | null;
    target_completion_date?: string | null;
    budget_planned_cents?: number | null;
    budget_used_cents?: number | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "home_projects_room_id_fkey";
      columns: ["room_id"];
      isOneToOne: false;
      referencedRelation: "home_rooms";
      referencedColumns: ["id"];
    },
  ];
}

interface HomeProjectTasksTable {
  Row: {
    id: string;
    project_id: string;
    name: string;
    is_completed: boolean;
    due_date: string | null;
    notes: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    project_id: string;
    name: string;
    is_completed?: boolean;
    due_date?: string | null;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    project_id?: string;
    name?: string;
    is_completed?: boolean;
    due_date?: string | null;
    notes?: string | null;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "home_project_tasks_project_id_fkey";
      columns: ["project_id"];
      isOneToOne: false;
      referencedRelation: "home_projects";
      referencedColumns: ["id"];
    },
  ];
}

// Life Planner - its own product, not the generic planner marketplace above
// (see `20260911000000_life_planner_foundation.sql`'s own comment for why
// it's a separate table rather than a `planner_definitions` row).
interface LifePlansTable {
  Row: {
    id: string;
    owner_id: string;
    planning_identity: string | null;
    current_priorities: string | null;
    important_areas: string | null;
    short_term_direction: string | null;
    long_term_direction: string | null;
    planning_preferences: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    planning_identity?: string | null;
    current_priorities?: string | null;
    important_areas?: string | null;
    short_term_direction?: string | null;
    long_term_direction?: string | null;
    planning_preferences?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    planning_identity?: string | null;
    current_priorities?: string | null;
    important_areas?: string | null;
    short_term_direction?: string | null;
    long_term_direction?: string | null;
    planning_preferences?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

// Life Areas - the first child table of `life_plans` (see
// `20260912000000_life_planner_areas.sql`'s own comment).
interface LifeAreasTable {
  Row: {
    id: string;
    owner_id: string;
    plan_id: string;
    name: string;
    description: string | null;
    icon_key: string;
    color_key: string;
    is_custom: boolean;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    plan_id: string;
    name: string;
    description?: string | null;
    icon_key?: string;
    color_key?: string;
    is_custom?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    plan_id?: string;
    name?: string;
    description?: string | null;
    icon_key?: string;
    color_key?: string;
    is_custom?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

// Life Goals - a sibling (not a child) of `life_areas` (see
// `20260913000000_life_planner_goals.sql`'s own comment for why
// `life_area_id` is `on delete set null`, not `cascade`).
interface LifeGoalsTable {
  Row: {
    id: string;
    owner_id: string;
    life_area_id: string | null;
    title: string;
    description: string | null;
    target_date: string | null;
    priority: string;
    status: string;
    progress: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    life_area_id?: string | null;
    title: string;
    description?: string | null;
    target_date?: string | null;
    priority?: string;
    status?: string;
    progress?: number;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    life_area_id?: string | null;
    title?: string;
    description?: string | null;
    target_date?: string | null;
    priority?: string;
    status?: string;
    progress?: number;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_goals_life_area_id_fkey";
      columns: ["life_area_id"];
      isOneToOne: false;
      referencedRelation: "life_areas";
      referencedColumns: ["id"];
    },
  ];
}

// Life Goal Milestones - a child of `life_goals` (see
// `20260914000000_life_planner_goal_planning.sql`'s own comment).
interface LifeGoalMilestonesTable {
  Row: {
    id: string;
    owner_id: string;
    goal_id: string;
    title: string;
    status: string;
    target_date: string | null;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    goal_id: string;
    title: string;
    status?: string;
    target_date?: string | null;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    goal_id?: string;
    title?: string;
    status?: string;
    target_date?: string | null;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_goal_milestones_goal_id_fkey";
      columns: ["goal_id"];
      isOneToOne: false;
      referencedRelation: "life_goals";
      referencedColumns: ["id"];
    },
  ];
}

// Life Goal Action Steps - a child of `life_goals`, optionally filed under
// one of that same goal's milestones (see
// `20260914000000_life_planner_goal_planning.sql`'s own comment).
interface LifeGoalActionStepsTable {
  Row: {
    id: string;
    owner_id: string;
    goal_id: string;
    milestone_id: string | null;
    title: string;
    is_completed: boolean;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    goal_id: string;
    milestone_id?: string | null;
    title: string;
    is_completed?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    goal_id?: string;
    milestone_id?: string | null;
    title?: string;
    is_completed?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_goal_action_steps_goal_id_fkey";
      columns: ["goal_id"];
      isOneToOne: false;
      referencedRelation: "life_goals";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "life_goal_action_steps_milestone_id_fkey";
      columns: ["milestone_id"];
      isOneToOne: false;
      referencedRelation: "life_goal_milestones";
      referencedColumns: ["id"];
    },
  ];
}

// Life Tasks - a third top-level table alongside `life_goals`/`life_areas`,
// not a child of either (see `20260915000000_life_planner_tasks.sql`'s own
// comment for why both FKs are `on delete set null`, not `cascade`).
interface LifeTasksTable {
  Row: {
    id: string;
    owner_id: string;
    life_area_id: string | null;
    goal_id: string | null;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: string;
    status: string;
    completed_at: string | null;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    title: string;
    description?: string | null;
    due_date?: string | null;
    priority?: string;
    status?: string;
    completed_at?: string | null;
    is_archived?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    title?: string;
    description?: string | null;
    due_date?: string | null;
    priority?: string;
    status?: string;
    completed_at?: string | null;
    is_archived?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_tasks_life_area_id_fkey";
      columns: ["life_area_id"];
      isOneToOne: false;
      referencedRelation: "life_areas";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "life_tasks_goal_id_fkey";
      columns: ["goal_id"];
      isOneToOne: false;
      referencedRelation: "life_goals";
      referencedColumns: ["id"];
    },
  ];
}

// Life Routines - a fourth top-level table alongside
// `life_areas`/`life_goals`/`life_tasks`, not a child of any of them (see
// `20260916000000_life_planner_routines.sql`'s own comment). `active_days`
// is a Postgres `smallint[]`, which the JS client already returns as a
// plain `number[]` - no extra parsing needed the way a `jsonb` column would.
interface LifeRoutinesTable {
  Row: {
    id: string;
    owner_id: string;
    name: string;
    purpose: string | null;
    routine_type: string;
    frequency: string;
    active_days: number[];
    is_active: boolean;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    name: string;
    purpose?: string | null;
    routine_type?: string;
    frequency?: string;
    active_days?: number[];
    is_active?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    name?: string;
    purpose?: string | null;
    routine_type?: string;
    frequency?: string;
    active_days?: number[];
    is_active?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

// Life Routine Items - a child of `life_routines` (see
// `20260916000000_life_planner_routines.sql`'s own comment).
interface LifeRoutineItemsTable {
  Row: {
    id: string;
    owner_id: string;
    routine_id: string;
    title: string;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    routine_id: string;
    title: string;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    routine_id?: string;
    title?: string;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_routine_items_routine_id_fkey";
      columns: ["routine_id"];
      isOneToOne: false;
      referencedRelation: "life_routines";
      referencedColumns: ["id"];
    },
  ];
}

// Life Routine Completions - a per-item, per-day completion log, a child of
// `life_routine_items` (see `20260916000000_life_planner_routines.sql`'s
// own comment for why this is a log, not a boolean flag). No `Update` shape
// needed beyond the generic id/owner fields - this table has no `update`
// RLS policy and nothing on a completion row is ever edited in place.
interface LifeRoutineCompletionsTable {
  Row: {
    id: string;
    owner_id: string;
    routine_item_id: string;
    completed_on: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    routine_item_id: string;
    completed_on?: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    routine_item_id?: string;
    completed_on?: string;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_routine_completions_routine_item_id_fkey";
      columns: ["routine_item_id"];
      isOneToOne: false;
      referencedRelation: "life_routine_items";
      referencedColumns: ["id"];
    },
  ];
}

// Life Habits - a sixth top-level Life Planner table alongside
// `life_areas`/`life_goals`/`life_tasks`/`life_routines`, not a child of any
// of them (see `20260917000000_life_planner_habits.sql`'s own comment).
interface LifeHabitsTable {
  Row: {
    id: string;
    owner_id: string;
    life_area_id: string | null;
    goal_id: string | null;
    name: string;
    description: string | null;
    frequency: string;
    target_per_period: number;
    is_active: boolean;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    name: string;
    description?: string | null;
    frequency?: string;
    target_per_period?: number;
    is_active?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    name?: string;
    description?: string | null;
    frequency?: string;
    target_per_period?: number;
    is_active?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_habits_life_area_id_fkey";
      columns: ["life_area_id"];
      isOneToOne: false;
      referencedRelation: "life_areas";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "life_habits_goal_id_fkey";
      columns: ["goal_id"];
      isOneToOne: false;
      referencedRelation: "life_goals";
      referencedColumns: ["id"];
    },
  ];
}

// Life Habit Logs - a per-habit, per-day completion log, a child of
// `life_habits` (see `20260917000000_life_planner_habits.sql`'s own
// comment for why this is a log, not a boolean flag). No `Update` shape
// needed beyond the generic id/owner fields - this table has no `update`
// RLS policy and nothing on a log row is ever edited in place.
interface LifeHabitLogsTable {
  Row: {
    id: string;
    owner_id: string;
    habit_id: string;
    logged_on: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    habit_id: string;
    logged_on?: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    habit_id?: string;
    logged_on?: string;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_habit_logs_habit_id_fkey";
      columns: ["habit_id"];
      isOneToOne: false;
      referencedRelation: "life_habits";
      referencedColumns: ["id"];
    },
  ];
}

// Life Weekly Plans - a seventh top-level Life Planner table alongside
// `life_areas`/`life_goals`/`life_tasks`/`life_routines`/`life_habits`, not
// a child of any of them (see `20260918000000_life_planner_planning.sql`'s
// own comment).
interface LifeWeeklyPlansTable {
  Row: {
    id: string;
    owner_id: string;
    week_start: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    week_start: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    week_start?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

// Life Weekly Priorities - a child of `life_weekly_plans` (see
// `20260918000000_life_planner_planning.sql`'s own comment for why
// `source_id` carries no foreign key of its own).
interface LifeWeeklyPrioritiesTable {
  Row: {
    id: string;
    owner_id: string;
    weekly_plan_id: string;
    title: string;
    source_type: string;
    source_id: string | null;
    is_done: boolean;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    weekly_plan_id: string;
    title: string;
    source_type?: string;
    source_id?: string | null;
    is_done?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    weekly_plan_id?: string;
    title?: string;
    source_type?: string;
    source_id?: string | null;
    is_done?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_weekly_priorities_weekly_plan_id_fkey";
      columns: ["weekly_plan_id"];
      isOneToOne: false;
      referencedRelation: "life_weekly_plans";
      referencedColumns: ["id"];
    },
  ];
}

// Life Monthly Plans - the exact same shape as `LifeWeeklyPlansTable` one
// level up (see `20260918000000_life_planner_planning.sql`'s own comment).
interface LifeMonthlyPlansTable {
  Row: {
    id: string;
    owner_id: string;
    month_start: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    month_start: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    month_start?: string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

// Life Monthly Priorities - a child of `life_monthly_plans`, the exact same
// shape as `LifeWeeklyPrioritiesTable` one level up.
interface LifeMonthlyPrioritiesTable {
  Row: {
    id: string;
    owner_id: string;
    monthly_plan_id: string;
    title: string;
    source_type: string;
    source_id: string | null;
    is_done: boolean;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    monthly_plan_id: string;
    title: string;
    source_type?: string;
    source_id?: string | null;
    is_done?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    monthly_plan_id?: string;
    title?: string;
    source_type?: string;
    source_id?: string | null;
    is_done?: boolean;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "life_monthly_priorities_monthly_plan_id_fkey";
      columns: ["monthly_plan_id"];
      isOneToOne: false;
      referencedRelation: "life_monthly_plans";
      referencedColumns: ["id"];
    },
  ];
}

interface OrdersTable {
  Row: {
    id: string;
    user_id: string;
    planner_id: string;
    product_slug: string;
    product_name: string;
    quantity: number;
    currency: string;
    unit_amount_cents: number;
    amount_cents: number;
    status: string;
    payment_provider: string;
    provider_order_id: string | null;
    provider_capture_id: string | null;
    paid_at: string | null;
    refunded_at: string | null;
    provider_refund_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    planner_id: string;
    product_slug: string;
    product_name: string;
    quantity?: number;
    currency: string;
    unit_amount_cents: number;
    amount_cents: number;
    status?: string;
    payment_provider?: string;
    provider_order_id?: string | null;
    provider_capture_id?: string | null;
    paid_at?: string | null;
    refunded_at?: string | null;
    provider_refund_id?: string | null;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    planner_id?: string;
    product_slug?: string;
    product_name?: string;
    quantity?: number;
    currency?: string;
    unit_amount_cents?: number;
    amount_cents?: number;
    status?: string;
    payment_provider?: string;
    provider_order_id?: string | null;
    provider_capture_id?: string | null;
    paid_at?: string | null;
    refunded_at?: string | null;
    provider_refund_id?: string | null;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "orders_planner_id_fkey";
      columns: ["planner_id"];
      isOneToOne: false;
      referencedRelation: "planner_definitions";
      referencedColumns: ["id"];
    },
  ];
}

interface CommerceOperatorsTable {
  Row: {
    user_id: string;
    granted_at: string;
    notes: string | null;
  };
  Insert: {
    user_id: string;
    granted_at?: string;
    notes?: string | null;
  };
  Update: {
    user_id?: string;
    granted_at?: string;
    notes?: string | null;
  };
  Relationships: [];
}

interface CommerceWebhookEventsTable {
  Row: {
    id: string;
    provider: string;
    provider_event_id: string;
    event_type: string;
    order_id: string | null;
    status: string;
    error_message: string | null;
    received_at: string;
    processed_at: string | null;
  };
  Insert: {
    id?: string;
    provider?: string;
    provider_event_id: string;
    event_type: string;
    order_id?: string | null;
    status?: string;
    error_message?: string | null;
    received_at?: string;
    processed_at?: string | null;
  };
  Update: {
    id?: string;
    provider?: string;
    provider_event_id?: string;
    event_type?: string;
    order_id?: string | null;
    status?: string;
    error_message?: string | null;
    received_at?: string;
    processed_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "commerce_webhook_events_order_id_fkey";
      columns: ["order_id"];
      isOneToOne: false;
      referencedRelation: "orders";
      referencedColumns: ["id"];
    },
  ];
}

interface CommerceOpsAuditLogTable {
  Row: {
    id: string;
    operator_id: string;
    action: string;
    target_type: string;
    target_id: string;
    result: string;
    metadata: Record<string, unknown>;
    created_at: string;
  };
  Insert: {
    id?: string;
    operator_id: string;
    action: string;
    target_type: string;
    target_id: string;
    result: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
  };
  Update: {
    id?: string;
    operator_id?: string;
    action?: string;
    target_type?: string;
    target_id?: string;
    result?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
  };
  Relationships: [];
}

// Life Journal Entries - a child of neither, an eighth top-level Life
// Planner table (see `20260919000000_life_planner_journal.sql`'s own
// comment for why this is the most sensitive table in the schema and
// carries no service-role escape hatch, unlike some commerce tables
// elsewhere in this file).
interface LifeJournalEntriesTable {
  Row: {
    id: string;
    owner_id: string;
    title: string;
    content: string;
    entry_date: string;
    life_area_id: string | null;
    goal_id: string | null;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    title: string;
    content: string;
    entry_date?: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    is_archived?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    title?: string;
    content?: string;
    entry_date?: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    is_archived?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

// Life Important Items - a child of neither, a ninth top-level Life Planner
// table (see `20260920000000_life_planner_important_items.sql`'s own
// comment for why this carries no service-role escape hatch, the same
// RLS-only rigor `LifeJournalEntriesTable` documents one table over).
interface LifeImportantItemsTable {
  Row: {
    id: string;
    owner_id: string;
    title: string;
    content: string;
    category: string;
    life_area_id: string | null;
    goal_id: string | null;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    title: string;
    content: string;
    category?: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    is_archived?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    title?: string;
    content?: string;
    category?: string;
    life_area_id?: string | null;
    goal_id?: string | null;
    is_archived?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      contact_submissions: ContactSubmissionsTable;
      profiles: ProfilesTable;
      planner_categories: PlannerCategoriesTable;
      planner_definitions: PlannerDefinitionsTable;
      entitlements: EntitlementsTable;
      planner_instances: PlannerInstancesTable;
      planner_answers: PlannerAnswersTable;
      planner_activity_events: PlannerActivityEventsTable;
      weddings: WeddingsTable;
      wedding_milestones: WeddingMilestonesTable;
      wedding_tasks: WeddingTasksTable;
      wedding_important_dates: WeddingImportantDatesTable;
      wedding_budget_categories: WeddingBudgetCategoriesTable;
      wedding_vendors: WeddingVendorsTable;
      wedding_expenses: WeddingExpensesTable;
      wedding_guests: WeddingGuestsTable;
      wedding_venues: WeddingVenuesTable;
      wedding_events: WeddingEventsTable;
      wedding_event_vendors: WeddingEventVendorsTable;
      wedding_event_guests: WeddingEventGuestsTable;
      wedding_notes: WeddingNotesTable;
      wedding_decisions: WeddingDecisionsTable;
      wedding_documents: WeddingDocumentsTable;
      budget_plans: BudgetPlansTable;
      budget_income_sources: BudgetIncomeSourcesTable;
      budget_categories: BudgetCategoriesTable;
      budget_accounts: BudgetAccountsTable;
      budget_income_entries: BudgetIncomeEntriesTable;
      budget_goals: BudgetGoalsTable;
      budget_expenses: BudgetExpensesTable;
      budget_recurring_items: BudgetRecurringItemsTable;
      budget_savings_targets: BudgetSavingsTargetsTable;
      orders: OrdersTable;
      commerce_operators: CommerceOperatorsTable;
      commerce_webhook_events: CommerceWebhookEventsTable;
      commerce_ops_audit_log: CommerceOpsAuditLogTable;
      trips: TripsTable;
      trip_days: TripDaysTable;
      trip_activities: TripActivitiesTable;
      trip_budget_categories: TripBudgetCategoriesTable;
      trip_expenses: TripExpensesTable;
      trip_bookings: TripBookingsTable;
      trip_packing_items: TripPackingItemsTable;
      trip_documents: TripDocumentsTable;
      trip_emergency_contacts: TripEmergencyContactsTable;
      homes: HomesTable;
      household_members: HouseholdMembersTable;
      home_contacts: HomeContactsTable;
      home_rooms: HomeRoomsTable;
      home_inventory_items: HomeInventoryItemsTable;
      home_maintenance_tasks: HomeMaintenanceTasksTable;
      home_bills: HomeBillsTable;
      home_documents: HomeDocumentsTable;
      home_projects: HomeProjectsTable;
      home_project_tasks: HomeProjectTasksTable;
      life_plans: LifePlansTable;
      life_areas: LifeAreasTable;
      life_goals: LifeGoalsTable;
      life_goal_milestones: LifeGoalMilestonesTable;
      life_goal_action_steps: LifeGoalActionStepsTable;
      life_tasks: LifeTasksTable;
      life_routines: LifeRoutinesTable;
      life_routine_items: LifeRoutineItemsTable;
      life_routine_completions: LifeRoutineCompletionsTable;
      life_habits: LifeHabitsTable;
      life_habit_logs: LifeHabitLogsTable;
      life_weekly_plans: LifeWeeklyPlansTable;
      life_weekly_priorities: LifeWeeklyPrioritiesTable;
      life_monthly_plans: LifeMonthlyPlansTable;
      life_monthly_priorities: LifeMonthlyPrioritiesTable;
      life_journal_entries: LifeJournalEntriesTable;
      life_important_items: LifeImportantItemsTable;
    };
    Views: Record<string, never>;
    Functions: {
      grant_planner_entitlement: GrantPlannerEntitlementFunction;
      revoke_planner_entitlement: RevokePlannerEntitlementFunction;
      ensure_profile_exists: EnsureProfileExistsFunction;
    };
  };
}
