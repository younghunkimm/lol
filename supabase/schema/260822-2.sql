create or replace view public.session_game_counts as
select
  sessions.id as session_id,
  count(games.id)::integer as game_count
from public.sessions
left join public.games on games.session_id = sessions.id
group by sessions.id;

create or replace view public.friend_stats as
with game_stats as (
  select
    winner_id as friend_id,
    1::integer as wins,
    0::integer as losses,
    0::integer as paid,
    round(
      (sessions.price * cardinality(games.loser_ids))::numeric
      / nullif(cardinality(games.winner_ids), 0)
    )::integer as received
  from public.games
  join public.sessions on sessions.id = games.session_id
  cross join unnest(games.winner_ids) as winner_id

  union all

  select
    loser_id as friend_id,
    0::integer as wins,
    1::integer as losses,
    sessions.price::integer as paid,
    0::integer as received
  from public.games
  join public.sessions on sessions.id = games.session_id
  cross join unnest(games.loser_ids) as loser_id
),
friend_totals as (
  select
    friend_id,
    coalesce(sum(wins), 0)::integer as wins,
    coalesce(sum(losses), 0)::integer as losses,
    coalesce(sum(paid), 0)::integer as paid,
    coalesce(sum(received), 0)::integer as received
  from game_stats
  group by friend_id
)
select
  friends.id,
  friends.name,
  coalesce(friend_totals.wins, 0)::integer as wins,
  coalesce(friend_totals.losses, 0)::integer as losses,
  case
    when coalesce(friend_totals.wins, 0) + coalesce(friend_totals.losses, 0) = 0
      then 0
    else round(
      (coalesce(friend_totals.wins, 0)::numeric
      / (coalesce(friend_totals.wins, 0) + coalesce(friend_totals.losses, 0)))
      * 100
    )::integer
  end as win_rate,
  coalesce(friend_totals.paid, 0)::integer as paid,
  coalesce(friend_totals.received, 0)::integer as received,
  (
    coalesce(friend_totals.received, 0) - coalesce(friend_totals.paid, 0)
  )::integer as net
from public.friends
left join friend_totals on friend_totals.friend_id = friends.id;

grant select on table public.session_game_counts to authenticated;
grant select on table public.friend_stats to authenticated;

alter table public.friends replica identity full;
alter table public.sessions replica identity full;
alter table public.games replica identity full;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friends'
  ) then
    alter publication supabase_realtime add table public.friends;
  end if;

  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;

  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'games'
  ) then
    alter publication supabase_realtime add table public.games;
  end if;
end $$;