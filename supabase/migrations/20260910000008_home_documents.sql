-- Home Planner (Product #4) - Documents & Records (Everplans Home Planner
-- Prompt 4 Phase 2). Metadata lives here; the actual file lives in the
-- private `home-documents` Storage bucket below, at
-- `{owner_id}/{document_id}-{filename}` - the exact same "folder per
-- owner, checked against auth.uid()" convention `wedding_documents`/
-- `avatars` already establish (`20260830000000_wedding_notes_decisions_documents.sql`,
-- `20260821000000_profile_details.sql`). This is the reuse Phase 2's own
-- instruction asks for ("where the existing Everplans file/storage
-- infrastructure supports uploads, reuse it") - not a parallel storage
-- architecture, the same bucket-per-product pattern Wedding already
-- established, applied to Home Planner.
--
-- `related_entity_type`/`related_entity_id` is the same soft-reference
-- shape `wedding_documents` uses (no FK - a document can point at a room
-- or an inventory item, and no single FK constraint can point at two
-- different tables) - deliberately just these two target types, matching
-- Phase 2's own examples exactly ("a warranty -> appliance/item, a
-- room-related document -> room"), not an unnecessarily complex
-- relationship graph.
create table if not exists public.home_documents (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  title text not null,
  category text not null default 'other',
  description text,
  document_date date,
  storage_path text not null,
  file_type text,
  file_size_bytes bigint,
  related_entity_type text,
  related_entity_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_documents_title_length check (char_length(title) between 1 and 150),
  constraint home_documents_category_valid check (
    category in ('property', 'rental', 'insurance', 'warranty', 'receipt', 'manual', 'record', 'other')
  ),
  constraint home_documents_description_length check (description is null or char_length(description) <= 1000),
  constraint home_documents_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint home_documents_related_entity_type_valid check (
    related_entity_type is null or related_entity_type in ('room', 'inventory_item')
  ),
  -- Both columns null, or both set - never a dangling type with no id or
  -- vice versa.
  constraint home_documents_related_entity_pair check (
    (related_entity_type is null) = (related_entity_id is null)
  )
);

create index if not exists home_documents_home_id_idx on public.home_documents (home_id, created_at desc);

alter table public.home_documents enable row level security;

create policy "Users can manage their own home documents" on public.home_documents
  for all to authenticated
  using (exists (select 1 from public.homes h where h.id = home_documents.home_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.homes h where h.id = home_documents.home_id and h.owner_id = auth.uid()));

create function public.set_home_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_home_documents_updated
  before update on public.home_documents
  for each row
  execute function public.set_home_documents_updated_at();

-- Private bucket - a home document (insurance policy, warranty, receipt)
-- is never meant for public display, the same reasoning `wedding-documents`
-- documents. Every operation, including read, requires the caller's own
-- folder - there is no "publicly accessible" policy at all here.
insert into storage.buckets (id, name, public)
values ('home-documents', 'home-documents', false)
on conflict (id) do nothing;

create policy "Users can read their own home documents"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'home-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own home documents"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'home-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own home documents"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'home-documents' and (storage.foldername(name))[1] = auth.uid()::text);
