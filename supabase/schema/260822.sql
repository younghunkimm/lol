grant select, insert, delete on table public.friends to authenticated;
grant select, insert, delete on table public.sessions to authenticated;
grant select, insert, delete on table public.games to authenticated;

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