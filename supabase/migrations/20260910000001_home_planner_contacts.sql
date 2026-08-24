-- Home Planner (Product #4) - important contacts foundation (Prompt 1
-- Phase 2: "Create the foundation for important home-related contacts").
--
-- `public.home_contacts` is a child table of `public.homes` - the same
-- "child references root, RLS traverses back up" shape `household_members`
-- already establishes against `homes` (see
-- `20260910000000_home_planner_foundation.sql`). Kept deliberately simple
-- for this phase: a contact is a name, a role, and how to reach them -
-- nothing beyond what Phase 2's own scope asks for (no linked
-- service-history, no scheduling, no documents - those are future prompts).
create table if not exists public.home_contacts (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  name text not null,
  -- Free text constrained by a closed `check` list, not a Postgres enum -
  -- the same "curated in UI, not DB" convention `homes.home_type` already
  -- established.
  role text not null default 'other',
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_contacts_name_length check (char_length(name) between 1 and 150),
  constraint home_contacts_role_valid check (
    role in ('property-manager', 'landlord', 'contractor', 'emergency-contact', 'service-provider', 'other')
  ),
  constraint home_contacts_phone_length check (phone is null or char_length(phone) <= 32),
  constraint home_contacts_email_length check (email is null or char_length(email) <= 254),
  constraint home_contacts_notes_length check (notes is null or char_length(notes) <= 1000)
);

create index if not exists home_contacts_home_id_idx on public.home_contacts (home_id);

alter table public.home_contacts enable row level security;

-- A single `for all` policy on this child table, same convention
-- `household_members` establishes: a correlated subquery back to the
-- root's `owner_id`, covering select/insert/update/delete in one policy.
create policy "Users can manage their own home contacts" on public.home_contacts
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = home_contacts.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_contacts.home_id and h.owner_id = auth.uid()));

create function public.set_home_contacts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_contacts_updated
  before update on public.home_contacts
  for each row
  execute function public.set_home_contacts_updated_at();
