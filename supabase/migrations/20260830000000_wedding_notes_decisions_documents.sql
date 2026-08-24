-- Wedding Planner: notes, decisions, and documents (Prompt 5 Phase 3) -
-- the lightweight information layer. All three share the same optional
-- "relates to" shape: `related_entity_type` + `related_entity_id`, a soft
-- reference (no foreign key) rather than one FK per possible target table
-- - a note/decision/document can point at an event, venue, vendor, guest,
-- task, milestone, or budget category, and no single FK constraint can
-- point at six different tables at once. Ownership is still fully
-- enforced independent of this reference (via `wedding_id`, the same
-- RLS join every other table uses) - `related_entity_id` is a display/
-- navigation convenience, never a security boundary.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

create table if not exists public.wedding_notes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  content text not null default '',
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_notes_title_length check (char_length(title) between 1 and 150),
  constraint wedding_notes_content_length check (char_length(content) <= 5000),
  constraint wedding_notes_related_entity_type_valid check (
    related_entity_type is null
    or related_entity_type in ('event', 'venue', 'vendor', 'guest', 'task', 'milestone', 'budget_category')
  ),
  -- Both columns null, or both set - never a dangling type with no id or
  -- vice versa.
  constraint wedding_notes_related_entity_pair check (
    (related_entity_type is null) = (related_entity_id is null)
  )
);

create index if not exists wedding_notes_wedding_id_idx on public.wedding_notes (wedding_id, created_at desc);

alter table public.wedding_notes enable row level security;

create policy "Users can manage their own wedding notes"
  on public.wedding_notes
  for all
  to authenticated
  using (exists (select 1 from public.weddings w where w.id = wedding_notes.wedding_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.weddings w where w.id = wedding_notes.wedding_id and w.owner_id = auth.uid()));

create function public.set_wedding_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_notes_updated
  before update on public.wedding_notes
  for each row execute function public.set_wedding_notes_updated_at();

create table if not exists public.wedding_decisions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_decisions_title_length check (char_length(title) between 1 and 150),
  constraint wedding_decisions_status_valid check (status in ('open', 'decided')),
  constraint wedding_decisions_related_entity_type_valid check (
    related_entity_type is null
    or related_entity_type in ('event', 'venue', 'vendor', 'guest', 'task', 'milestone', 'budget_category')
  ),
  constraint wedding_decisions_related_entity_pair check (
    (related_entity_type is null) = (related_entity_id is null)
  )
);

create index if not exists wedding_decisions_wedding_id_idx on public.wedding_decisions (wedding_id, created_at desc);

alter table public.wedding_decisions enable row level security;

create policy "Users can manage their own wedding decisions"
  on public.wedding_decisions
  for all
  to authenticated
  using (exists (select 1 from public.weddings w where w.id = wedding_decisions.wedding_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.weddings w where w.id = wedding_decisions.wedding_id and w.owner_id = auth.uid()));

create function public.set_wedding_decisions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_decisions_updated
  before update on public.wedding_decisions
  for each row execute function public.set_wedding_decisions_updated_at();

-- Documents - metadata only in this table; the actual file lives in the
-- private `wedding-documents` Storage bucket below, at
-- `{owner_id}/{document_id}-{filename}` (the same "folder per owner,
-- checked against auth.uid()" convention `avatars` already established -
-- see `20260821000000_profile_details.sql`). `storage_path` is the one
-- pointer between the two; nothing about the file's actual bytes is
-- duplicated here.
create table if not exists public.wedding_documents (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  storage_path text not null,
  file_type text,
  file_size_bytes bigint,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedding_documents_title_length check (char_length(title) between 1 and 150),
  constraint wedding_documents_related_entity_type_valid check (
    related_entity_type is null
    or related_entity_type in ('event', 'venue', 'vendor', 'guest', 'task', 'milestone', 'budget_category')
  ),
  constraint wedding_documents_related_entity_pair check (
    (related_entity_type is null) = (related_entity_id is null)
  )
);

create index if not exists wedding_documents_wedding_id_idx on public.wedding_documents (wedding_id, created_at desc);

alter table public.wedding_documents enable row level security;

create policy "Users can manage their own wedding documents"
  on public.wedding_documents
  for all
  to authenticated
  using (exists (select 1 from public.weddings w where w.id = wedding_documents.wedding_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.weddings w where w.id = wedding_documents.wedding_id and w.owner_id = auth.uid()));

create function public.set_wedding_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_wedding_documents_updated
  before update on public.wedding_documents
  for each row execute function public.set_wedding_documents_updated_at();

-- Private bucket - unlike `avatars`, a wedding document (a contract, a
-- quote) is never meant for public display, so there is no "publicly
-- accessible" read policy at all here; every operation, including read,
-- requires the caller's own folder.
insert into storage.buckets (id, name, public)
values ('wedding-documents', 'wedding-documents', false)
on conflict (id) do nothing;

create policy "Users can read their own wedding documents"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'wedding-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own wedding documents"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'wedding-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own wedding documents"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'wedding-documents' and (storage.foldername(name))[1] = auth.uid()::text);
