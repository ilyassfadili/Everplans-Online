-- User planner instances, answers, and activity - the "does this user's
-- private planning work survive a refresh" layer on top of the already-
-- real product/entitlement architecture (planner_definitions,
-- entitlements). Global product data (what a planner IS) and this
-- migration's tables (what a SPECIFIC user has done with one) stay
-- strictly separate: nothing here duplicates a planner_definitions
-- column, and nothing in planner_definitions knows a single thing about
-- any user's progress.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

-- One row per (user, planner) - "this user's relationship to this
-- specific planner," distinct from `entitlements` (whether they're
-- *allowed* to have one at all). `current_page_id` is a plain text
-- pointer into whatever `PlannerStructure` the matching
-- `planner_definitions.schema_version` describes (`@/types/planner-structure`)
-- - never a foreign key, since page ids live inside a planner's JSON
-- structure, not a database table of their own.
create table if not exists public.planner_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  planner_id uuid not null references public.planner_definitions (id) on delete cascade,
  status text not null default 'not-started',
  current_page_id text,
  started_at timestamptz,
  last_active_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint planner_instances_status_valid check (status in ('not-started', 'in-progress', 'completed')),
  -- One working copy per user per planner - matches `entitlements`' own
  -- `unique (user_id, planner_id)` (20260819000002_entitlements.sql) for
  -- the same reason: "resume where I left off" only means something if
  -- there's exactly one instance to resume.
  constraint planner_instances_user_planner_unique unique (user_id, planner_id)
);

create index if not exists planner_instances_user_id_idx on public.planner_instances (user_id);

alter table public.planner_instances enable row level security;

create policy "Users can read their own planner instances"
  on public.planner_instances
  for select
  to authenticated
  using (user_id = auth.uid());

-- Real, database-level authorization, not merely "the app happens to
-- only call this after checking access" - a direct insert attempt for a
-- planner the caller has no active entitlement for is rejected by
-- Postgres itself, the same "frontend hiding is not authorization"
-- principle `entitlements`' own read-only RLS already enforces one layer
-- up. Mirrors `getActiveEntitlement`'s own "active and not expired"
-- check (`@/lib/entitlements`) exactly, so a row can never be inserted
-- through a path that checks looser rules than the one the application
-- itself uses to decide access.
create policy "Users can start an instance for a planner they're entitled to"
  on public.planner_instances
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.entitlements e
      where e.user_id = auth.uid()
        and e.planner_id = planner_instances.planner_id
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
  );

-- Update is ownership-only (no re-check of entitlement here) - once a
-- session is already resuming an instance the access-resolution layer
-- above it (`resolvePlannerAccess`) already approved for this request,
-- saving that same session's own further progress shouldn't itself hinge
-- on re-proving entitlement on every keystroke; entitlement changes are
-- enforced again the next time the planner route is opened, not mid-save.
create policy "Users can update their own planner instances"
  on public.planner_instances
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create function public.set_planner_instances_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_planner_instances_updated
  before update on public.planner_instances
  for each row execute function public.set_planner_instances_updated_at();

-- One row per answered field per instance - a flat key/value map mirroring
-- `PlannerFieldValues` (`@/types/planner-runtime`) exactly, not a wider
-- per-field-type column set: `FieldValue` is already a narrow
-- `string | number | boolean | null` union, which `jsonb` represents
-- natively without inventing `text_value`/`number_value`/`boolean_value`
-- columns for a query pattern ("all of this instance's answers, or one
-- answer by field id") that never needs to filter or aggregate by value.
create table if not exists public.planner_answers (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.planner_instances (id) on delete cascade,
  field_id text not null,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- What makes "save this field's answer" a safe upsert
  -- (`on conflict (instance_id, field_id) do update`) rather than a
  -- read-then-decide-insert-or-update race.
  constraint planner_answers_instance_field_unique unique (instance_id, field_id)
);

create index if not exists planner_answers_instance_id_idx on public.planner_answers (instance_id);

alter table public.planner_answers enable row level security;

-- No `user_id` column on this table at all - ownership is resolved
-- through `instance_id`'s own owner (`planner_instances.user_id`), the
-- standard "join back to the owning row" RLS pattern rather than
-- duplicating `user_id` onto every child table. One combined policy
-- (not split select/insert/update like `profiles`) because answers are
-- freely read/written/cleared by their own owner as a normal part of
-- filling out a planner - there's no narrower boundary to enforce within
-- "this is genuinely your own answer."
create policy "Users can manage answers on their own planner instances"
  on public.planner_answers
  for all
  to authenticated
  using (
    exists (
      select 1 from public.planner_instances pi
      where pi.id = planner_answers.instance_id and pi.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.planner_instances pi
      where pi.id = planner_answers.instance_id and pi.user_id = auth.uid()
    )
  );

create function public.set_planner_answers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_planner_answers_updated
  before update on public.planner_answers
  for each row execute function public.set_planner_answers_updated_at();

-- The minimum real foundation for `/app/activity` (Dashboard V2 Prompt
-- 3's own "do not build real activity tracking backend" deferred until
-- there was something worth tracking - this is that something).
-- `event_type` matches `ActivityEventType` (`@/types/activity`) exactly,
-- so `getRecentActivity` can map a row to an `ActivityItem` with no
-- translation layer between the two vocabularies. Append-only by design:
-- no update/delete policy exists below, because a past event shouldn't
-- be editable after the fact, the same "audit-log" restraint
-- `entitlements`' own read-only policy applies to a different table.
create table if not exists public.planner_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  planner_id uuid not null references public.planner_definitions (id) on delete cascade,
  instance_id uuid not null references public.planner_instances (id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb,
  occurred_at timestamptz not null default now(),

  constraint planner_activity_events_type_valid check (
    event_type in (
      'planner-started',
      'section-completed',
      'progress-updated',
      'planner-resumed',
      'planner-completed',
      'data-updated'
    )
  )
);

create index if not exists planner_activity_events_user_id_occurred_at_idx
  on public.planner_activity_events (user_id, occurred_at desc);

alter table public.planner_activity_events enable row level security;

create policy "Users can read their own activity"
  on public.planner_activity_events
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can record their own activity"
  on public.planner_activity_events
  for insert
  to authenticated
  with check (user_id = auth.uid());
