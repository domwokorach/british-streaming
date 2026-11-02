-- Custom JWT authentication. Replaces Supabase Auth (auth.users) as the identity source.
-- All access goes through the server using the service-role key; RLS is enabled with NO policies,
-- so the anon/authenticated roles (i.e. anything reachable from a browser) can read or write nothing.

create table public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 1 and 100),
  email text not null check (email = lower(email) and char_length(email) <= 254),
  password_hash text not null,
  email_verified_at timestamptz,
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_key on public.users (email);

create table public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  refresh_token_hash text not null,
  previous_token_hash text,
  rotated_at timestamptz,
  persistent boolean not null default false,
  expires_at timestamptz not null,
  absolute_expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason text,
  user_agent text,
  ip text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);
create index auth_sessions_active_user_idx on public.auth_sessions (user_id) where revoked_at is null;
create index auth_sessions_expires_at_idx on public.auth_sessions (expires_at);

create table public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index password_reset_tokens_user_idx on public.password_reset_tokens (user_id);

create table public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_verification_tokens_user_idx on public.email_verification_tokens (user_id);

-- No FK on user_id: audit rows must outlive the account they describe.
create table public.auth_audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  event text not null,
  ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index auth_audit_log_user_idx on public.auth_audit_log (user_id, created_at desc);
create index auth_audit_log_event_idx on public.auth_audit_log (event, created_at desc);

create table public.auth_rate_limits (
  key text primary key,
  count integer not null,
  window_start timestamptz not null
);

alter table public.users enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.email_verification_tokens enable row level security;
alter table public.auth_audit_log enable row level security;
alter table public.auth_rate_limits enable row level security;

-- Fixed-window counter, atomic under concurrency (single upsert).
create function public.auth_rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public as $$
declare r public.auth_rate_limits;
begin
  insert into public.auth_rate_limits as l (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case when l.window_start < now() - make_interval(secs => p_window_seconds) then 1 else l.count + 1 end,
    window_start = case when l.window_start < now() - make_interval(secs => p_window_seconds) then now() else l.window_start end
  returning * into r;
  allowed := r.count <= p_max;
  remaining := greatest(p_max - r.count, 0);
  retry_after_seconds := case when r.count <= p_max then 0
    else greatest(ceil(extract(epoch from (r.window_start + make_interval(secs => p_window_seconds) - now())))::integer, 1) end;
  return next;
end $$;

-- Single-use token consumption + password change + session revocation in ONE transaction.
-- Returns the user id, or NULL when the token is unknown, expired or already used.
create function public.auth_reset_password(p_token_hash text, p_password_hash text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  update public.password_reset_tokens set used_at = now()
   where token_hash = p_token_hash and used_at is null and expires_at > now()
  returning user_id into v_user;
  if v_user is null then return null; end if;

  update public.users set password_hash = p_password_hash, updated_at = now() where id = v_user;
  update public.password_reset_tokens set used_at = now() where user_id = v_user and used_at is null;
  update public.auth_sessions set revoked_at = now(), revoked_reason = 'password_reset'
   where user_id = v_user and revoked_at is null;
  return v_user;
end $$;

create function public.auth_verify_email(p_token_hash text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  update public.email_verification_tokens set used_at = now()
   where token_hash = p_token_hash and used_at is null and expires_at > now()
  returning user_id into v_user;
  if v_user is null then return null; end if;
  update public.users set email_verified_at = coalesce(email_verified_at, now()), updated_at = now() where id = v_user;
  update public.email_verification_tokens set used_at = now() where user_id = v_user and used_at is null;
  return v_user;
end $$;

revoke all on function public.auth_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.auth_reset_password(text, text) from public, anon, authenticated;
revoke all on function public.auth_verify_email(text) from public, anon, authenticated;
grant execute on function public.auth_rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.auth_reset_password(text, text) to service_role;
grant execute on function public.auth_verify_email(text) to service_role;

-- ---------------------------------------------------------------------------
-- Re-point the existing user-data tables from auth.users to public.users.
-- Rows owned by Supabase-Auth users cannot satisfy the new foreign key and are removed
-- (this migration assumes Supabase-Auth accounts are NOT being carried over).
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['my_list', 'watch_progress', 'viewing_history', 'reactions', 'recent_searches', 'preferences'] loop
    execute format('delete from public.%I', t);
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_user_id_fkey');
    execute format('alter table public.%I add constraint %I foreign key (user_id) references public.users(id) on delete cascade', t, t || '_user_id_fkey');
    execute format('drop policy if exists %I on public.%I', 'Users manage own ' || case t
      when 'my_list' then 'list' when 'watch_progress' then 'progress' when 'viewing_history' then 'history'
      when 'reactions' then 'reactions' when 'recent_searches' then 'searches' else 'preferences' end, t);
  end loop;
end $$;

-- Display name now lives on public.users; policies depended on auth.uid().
drop table if exists public.profiles;

-- Realtime relied on Supabase-Auth RLS; clients now refetch through the API instead.
do $$
declare t text;
begin
  foreach t in array array['my_list', 'watch_progress', 'reactions'] loop
    begin
      execute format('alter publication supabase_realtime drop table public.%I', t);
    exception when others then null; -- not in the publication (or publication missing): nothing to do
    end;
  end loop;
end $$;
