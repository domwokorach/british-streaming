create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text not null, avatar_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.my_list (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, tmdb_id integer not null, media_type text not null check (media_type in ('movie', 'tv')), created_at timestamptz not null default now(), unique (user_id, tmdb_id, media_type));
create table public.watch_progress (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, tmdb_id integer not null, media_type text not null check (media_type in ('movie', 'tv')), season_number integer check (season_number >= 0), episode_number integer check (episode_number >= 0), progress_seconds integer not null default 0 check (progress_seconds >= 0), duration_seconds integer not null check (duration_seconds > 0), completed boolean not null default false, updated_at timestamptz not null default now(), unique nulls not distinct (user_id, tmdb_id, media_type, season_number, episode_number));
create table public.viewing_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, tmdb_id integer not null, media_type text not null check (media_type in ('movie', 'tv')), viewed_at timestamptz not null default now());
create table public.reactions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, tmdb_id integer not null, media_type text not null check (media_type in ('movie', 'tv')), reaction text not null check (reaction in ('like', 'dislike')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, tmdb_id, media_type));
create table public.recent_searches (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, query text not null check (char_length(trim(query)) > 0), created_at timestamptz not null default now(), unique (user_id, query));
create table public.preferences (user_id uuid primary key references auth.users(id) on delete cascade, preferred_genres integer[] not null default '{}', updated_at timestamptz not null default now());

create index my_list_user_id_idx on public.my_list(user_id);
create index watch_progress_user_id_updated_at_idx on public.watch_progress(user_id, updated_at desc);
create index viewing_history_user_id_viewed_at_idx on public.viewing_history(user_id, viewed_at desc);
create index reactions_user_id_idx on public.reactions(user_id);
create index recent_searches_user_id_created_at_idx on public.recent_searches(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.my_list enable row level security;
alter table public.watch_progress enable row level security;
alter table public.viewing_history enable row level security;
alter table public.reactions enable row level security;
alter table public.recent_searches enable row level security;
alter table public.preferences enable row level security;

create policy "Users manage own profile" on public.profiles for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users manage own list" on public.my_list for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own progress" on public.watch_progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own history" on public.viewing_history for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own reactions" on public.reactions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own searches" on public.recent_searches for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own preferences" on public.preferences for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter publication supabase_realtime add table public.profiles, public.my_list, public.watch_progress, public.reactions;
