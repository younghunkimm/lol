alter table public.sessions
  add column if not exists is_inhouse boolean not null default false,
  add column if not exists team_a_ids text[] not null default '{}',
  add column if not exists team_b_ids text[] not null default '{}';

alter table public.sessions
  drop constraint if exists sessions_friend_ids_check;

alter table public.sessions
  add constraint sessions_roster_check check (
    (
      not is_inhouse
      and cardinality(friend_ids) between 2 and 5
      and cardinality(team_a_ids) = 0
      and cardinality(team_b_ids) = 0
    )
    or (
      is_inhouse
      and cardinality(friend_ids) between 4 and 10
      and cardinality(team_a_ids) between 2 and 5
      and cardinality(team_a_ids) = cardinality(team_b_ids)
      and cardinality(friend_ids) = cardinality(team_a_ids) + cardinality(team_b_ids)
      and friend_ids @> team_a_ids
      and friend_ids @> team_b_ids
      and not (team_a_ids && team_b_ids)
    )
  );

alter table public.games
  add column if not exists winner_team text check (winner_team in ('A', 'B'));
