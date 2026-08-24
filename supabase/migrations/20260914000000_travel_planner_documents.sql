-- Travel Planner (Product #3) - travel documents checklist (Prompt 4 Phase 2).
--
-- SECURITY: `public.trip_documents` is a CHECKLIST/STATUS record, not a
-- secure document vault - deliberately no file storage, and no columns
-- for passport numbers, card numbers, or any other sensitive identifier.
-- Everplans already has a real secure-storage pattern (`wedding_documents`
-- + the private `wedding-documents` Storage bucket, see
-- `20260830000000_wedding_notes_decisions_documents.sql`), but this
-- feature's own scope (Phase 2's explicit instruction) is preparation
-- tracking only: what document, what status, when it expires, a note -
-- nothing a traveler would need to keep truly secret.
create table if not exists public.trip_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  document_type text not null default 'other',
  name text not null,
  status text not null default 'needed',
  expiry_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trip_documents_name_length check (char_length(name) between 1 and 150),
  constraint trip_documents_notes_length check (notes is null or char_length(notes) <= 500),
  constraint trip_documents_type_valid check (
    document_type in ('passport', 'visa', 'insurance', 'id', 'tickets', 'booking-confirmation', 'other')
  ),
  constraint trip_documents_status_valid check (status in ('needed', 'ready', 'expired', 'not-required'))
);

create index if not exists trip_documents_trip_id_idx on public.trip_documents (trip_id);

alter table public.trip_documents enable row level security;

create policy "Users can manage their own trip documents" on public.trip_documents
  for all to authenticated
  using (exists (select 1 from public.trips t where t.id = trip_documents.trip_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_documents.trip_id and t.owner_id = auth.uid()));

create function public.set_trip_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_trip_documents_updated
  before update on public.trip_documents
  for each row
  execute function public.set_trip_documents_updated_at();
