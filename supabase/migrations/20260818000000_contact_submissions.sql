-- Contact form submissions.
--
-- Minimal, purpose-built schema: exactly the fields the /contact form
-- collects, nothing more. No admin UI is created by this migration -
-- submissions are read via the Supabase dashboard's table editor
-- (service_role bypasses RLS there) until/unless an authenticated admin
-- view is genuinely needed.
--
-- Apply with the Supabase CLI (`supabase db push`) or by running this file
-- in the SQL Editor at https://supabase.com/dashboard.

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  reason text not null,
  message text not null,
  created_at timestamptz not null default now(),

  constraint contact_submissions_name_length check (char_length(name) between 1 and 200),
  constraint contact_submissions_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint contact_submissions_email_length check (char_length(email) <= 320),
  constraint contact_submissions_reason_valid check (
    reason in ('general', 'product', 'feedback', 'technical', 'partnership')
  ),
  constraint contact_submissions_message_length check (char_length(message) between 1 and 5000)
);

alter table public.contact_submissions enable row level security;

-- Anyone (including anonymous visitors) can submit a message. This is the
-- only privilege granted: there is deliberately no select/update/delete
-- policy for anon or authenticated roles, so a submission can never be
-- read back, listed, or modified by anyone other than the project owner
-- (via service_role, which bypasses RLS).
create policy "Anyone can submit a contact message"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);
