create table if not exists public.friends (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  title text not null,
  price integer not null check (price >= 0),
  friend_ids text[] not null check (array_length(friend_ids, 1) between 2 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  winner_ids text[] not null check (array_length(winner_ids, 1) >= 1),
  loser_ids text[] not null check (array_length(loser_ids, 1) >= 1),
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.friends enable row level security;
alter table public.sessions enable row level security;
alter table public.games enable row level security;

revoke all on table public.friends from anon;
revoke all on table public.sessions from anon;
revoke all on table public.games from anon;

grant select, insert, delete on table public.friends to authenticated;
grant select, insert, delete on table public.sessions to authenticated;
grant select, insert, delete on table public.games to authenticated;

drop policy if exists "public read friends" on public.friends;
drop policy if exists "public insert friends" on public.friends;
drop policy if exists "public delete friends" on public.friends;
drop policy if exists "public read sessions" on public.sessions;
drop policy if exists "public insert sessions" on public.sessions;
drop policy if exists "public delete sessions" on public.sessions;
drop policy if exists "public read games" on public.games;
drop policy if exists "public insert games" on public.games;
drop policy if exists "public delete games" on public.games;

drop policy if exists "authenticated read friends" on public.friends;
drop policy if exists "authenticated insert friends" on public.friends;
drop policy if exists "authenticated delete friends" on public.friends;
drop policy if exists "authenticated read sessions" on public.sessions;
drop policy if exists "authenticated insert sessions" on public.sessions;
drop policy if exists "authenticated delete sessions" on public.sessions;
drop policy if exists "authenticated read games" on public.games;
drop policy if exists "authenticated insert games" on public.games;
drop policy if exists "authenticated delete games" on public.games;

create policy "authenticated read friends"
on public.friends for select
to authenticated
using (true);

create policy "authenticated insert friends"
on public.friends for insert
to authenticated
with check (true);

create policy "authenticated delete friends"
on public.friends for delete
to authenticated
using (true);

create policy "authenticated read sessions"
on public.sessions for select
to authenticated
using (true);

create policy "authenticated insert sessions"
on public.sessions for insert
to authenticated
with check (true);

create policy "authenticated delete sessions"
on public.sessions for delete
to authenticated
using (true);

create policy "authenticated read games"
on public.games for select
to authenticated
using (true);

create policy "authenticated insert games"
on public.games for insert
to authenticated
with check (true);

create policy "authenticated delete games"
on public.games for delete
to authenticated
using (true);
