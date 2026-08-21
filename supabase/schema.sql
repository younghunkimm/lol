create table public.friends (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id text primary key,
  title text not null,
  price integer not null check (price >= 0),
  friend_ids text[] not null check (array_length(friend_ids, 1) between 2 and 5),
  created_at timestamptz not null default now()
);

create table public.games (
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

create policy "public read friends" on public.friends for select to anon using (true);
create policy "public insert friends" on public.friends for insert to anon with check (true);
create policy "public delete friends" on public.friends for delete to anon using (true);

create policy "public read sessions" on public.sessions for select to anon using (true);
create policy "public insert sessions" on public.sessions for insert to anon with check (true);
create policy "public delete sessions" on public.sessions for delete to anon using (true);

create policy "public read games" on public.games for select to anon using (true);
create policy "public insert games" on public.games for insert to anon with check (true);
create policy "public delete games" on public.games for delete to anon using (true);
