alter table public.sessions
add column if not exists is_locked boolean not null default true;

grant update (is_locked) on table public.sessions to authenticated;

drop policy if exists "authenticated update session lock" on public.sessions;

create policy "authenticated update session lock"
on public.sessions for update
to authenticated
using (true)
with check (true);

create or replace function public.prevent_locked_session_delete()
returns trigger
language plpgsql
as $$
begin
  if old.is_locked then
    raise exception '잠긴 세션은 삭제할 수 없습니다.';
  end if;

  return old;
end;
$$;

create or replace function public.prevent_locked_game_delete()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.sessions
    where id = old.session_id
      and is_locked
  ) then
    raise exception '잠긴 세션의 승패 기록은 삭제할 수 없습니다.';
  end if;

  return old;
end;
$$;

drop trigger if exists prevent_locked_session_delete on public.sessions;

create trigger prevent_locked_session_delete
before delete on public.sessions
for each row
execute function public.prevent_locked_session_delete();

drop trigger if exists prevent_locked_game_delete on public.games;

create trigger prevent_locked_game_delete
before delete on public.games
for each row
execute function public.prevent_locked_game_delete();
