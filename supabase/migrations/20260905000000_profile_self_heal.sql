-- Self-healing profile rows. `handle_new_user()`
-- (20260819000001_profiles.sql) only ever fires on a fresh `auth.users`
-- insert - any account created before that trigger existed (or, in
-- principle, any future account created through a path that somehow
-- bypasses it) has no `public.profiles` row at all. Every profile mutation
-- (`updateProfileDetails`/`updateProfilePreferences`/`updateAvatar`,
-- `@/lib/profile`) does an `update ... where id = auth.uid()` - against a
-- missing row that matches zero rows, not an error, so it silently "does
-- nothing" and the caller only ever sees a generic "failed" message with no
-- way to recover. `authenticated` deliberately has no INSERT policy on
-- `profiles` (the earlier migration's own comment: "a client can never
-- insert a profile... outside the signup flow") - so a plain client-side
-- upsert isn't an option; this is the same `security definer` escape hatch
-- `grant_planner_entitlement` already uses for the one case ordinary RLS
-- can't safely express.
--
-- Not yet applied to the live project - same "written, not yet pushed"
-- status every migration in this repo starts in. Apply with
-- `supabase db push` or the SQL Editor at https://supabase.com/dashboard.

create function public.ensure_profile_exists()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (auth.uid())
  on conflict (id) do nothing;
end;
$$;

-- Callable by any signed-in user, but only ever for their own row -
-- `auth.uid()` is resolved server-side from the caller's own JWT, never a
-- parameter the caller supplies, so this can't be used to create or
-- affect anyone else's profile.
revoke execute on function public.ensure_profile_exists() from public, anon;
grant execute on function public.ensure_profile_exists() to authenticated;

-- One-time backfill for every account that already exists without a
-- profile row - the real fix for accounts created before this migration,
-- not just future-proofing.
insert into public.profiles (id, display_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
