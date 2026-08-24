-- Extends `public.profiles` for the real Settings page (Profile/Account &
-- Security/Preferences/Privacy & Data) - adds the fields that page's own
-- Profile and Preferences sections genuinely persist, plus the storage
-- bucket its avatar upload needs. `display_name` (the previous migration)
-- stays as the one column every existing consumer already reads
-- (`DashboardHeaderTitle`... actually `AccountMenu`/`UserProfileMenu`, the
-- sidebar) - rather than touching every one of those call sites to read
-- `first_name`/`last_name` instead, a trigger below keeps `display_name`
-- itself in sync whenever either is saved, the same "one derived value,
-- computed once, at the source" principle `updated_at`'s own trigger
-- already follows in the previous migration.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in (see each one's own
-- header comment). Apply with `supabase db push` or the SQL Editor at
-- https://supabase.com/dashboard.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists language text not null default 'en',
  add column if not exists date_format text not null default 'MM/DD/YYYY',
  add column if not exists time_format text not null default '12h';

alter table public.profiles
  add constraint profiles_first_name_length check (first_name is null or char_length(first_name) between 1 and 100),
  add constraint profiles_last_name_length check (last_name is null or char_length(last_name) between 1 and 100),
  add constraint profiles_phone_length check (phone is null or char_length(phone) between 1 and 32),
  -- One real value today ('en') - not a placeholder list padded out with
  -- languages nothing in this app actually renders in. Extending this is
  -- exactly one `check` constraint edit (plus the Settings Select's own
  -- options list) the day a second language is genuinely supported.
  add constraint profiles_language_allowed check (language in ('en')),
  add constraint profiles_date_format_allowed check (date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  add constraint profiles_time_format_allowed check (time_format in ('12h', '24h'));

-- Keeps `display_name` correct without every reader (sidebar, Header,
-- account menu) needing to learn about `first_name`/`last_name` at all -
-- an update that touches either name field recomputes it; an update that
-- doesn't (e.g. a Preferences-only save) leaves it untouched. Guards
-- against a blank result (both names cleared to empty strings) collapsing
-- to `''` rather than `null` - `profiles_display_name_length` (previous
-- migration) already rejects an empty string, and `null` is the correct
-- "no name set" state the rest of the app already handles gracefully.
create function public.set_profiles_display_name()
returns trigger
language plpgsql
as $$
begin
  if new.first_name is distinct from old.first_name or new.last_name is distinct from old.last_name then
    new.display_name := nullif(trim(concat_ws(' ', new.first_name, new.last_name)), '');
  end if;
  return new;
end;
$$;

create trigger on_profiles_derive_display_name
  before update on public.profiles
  for each row execute function public.set_profiles_display_name();

-- Avatar storage - one public-read bucket, folder-per-user upload/update/
-- delete. `public: true` matches how every avatar this app will ever show
-- is used (an `<img>` src rendered to whoever's looking at a page with
-- that user's identity on it, never a private document) - reads need no
-- policy beyond "this bucket is public"; writes are still strictly
-- owner-scoped below. Path convention: `avatars/{user_id}/{filename}` -
-- `(storage.foldername(name))[1]` is that first path segment, checked
-- against the caller's own `auth.uid()` the same way `profiles`' own
-- update policy checks row ownership.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can replace their own avatar"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
