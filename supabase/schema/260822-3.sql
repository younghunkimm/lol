create or replace function public.prevent_friend_delete_with_records()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.sessions
    where old.id = any(friend_ids)
  ) or exists (
    select 1
    from public.games
    where old.id = any(winner_ids)
       or old.id = any(loser_ids)
  ) then
    raise exception '이미 세션 또는 승패 기록에 포함된 프로게이머는 삭제할 수 없습니다.';
  end if;

  return old;
end;
$$;

drop trigger if exists prevent_friend_delete_with_records on public.friends;

create trigger prevent_friend_delete_with_records
before delete on public.friends
for each row
execute function public.prevent_friend_delete_with_records();
