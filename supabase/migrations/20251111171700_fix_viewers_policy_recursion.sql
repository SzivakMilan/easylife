-- A deadlines/events/bills tábla SELECT policy-ja a saját *_viewers táblájára hivatkozik
-- (van-e benne egy rám mutató sor), a *_viewers tábla SELECT policy-ja pedig visszahivatkozott
-- magára a tulajdonos táblára (deadlines/events/bills) a háztartás-egyezés ellenőrzéséhez.
-- Ez közvetlen kör: A policy-ja lekérdezi B-t, B policy-ja lekérdezi A-t -> végtelen rekurzió.
-- A tulajdonos háztartásának lekérdezését egy RLS-t megkerülő (security definer) függvénybe
-- emeljük ki, hogy a *_viewers policy ne váltsa ki újra az A tábla RLS-ét.

create or replace function deadline_owner_household(p_deadline_id uuid)
returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  return (select household_id from deadlines where id = p_deadline_id);
end;
$$;

create or replace function event_owner_household(p_event_id uuid)
returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  return (select household_id from events where id = p_event_id);
end;
$$;

create or replace function bill_owner_household(p_bill_id uuid)
returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  return (select household_id from bills where id = p_bill_id);
end;
$$;

drop policy if exists deadline_viewers_select on deadline_viewers;
create policy deadline_viewers_select on deadline_viewers
  for select using (
    deadline_owner_household(deadline_viewers.deadline_id) = my_household_id()
    or exists (select 1 from household_members hm where hm.id = deadline_viewers.member_id and hm.user_id = auth.uid())
  );

drop policy if exists deadline_viewers_write on deadline_viewers;
create policy deadline_viewers_write on deadline_viewers
  for all
  using (deadline_owner_household(deadline_viewers.deadline_id) = my_household_id())
  with check (deadline_owner_household(deadline_viewers.deadline_id) = my_household_id());

drop policy if exists event_viewers_select on event_viewers;
create policy event_viewers_select on event_viewers
  for select using (
    event_owner_household(event_viewers.event_id) = my_household_id()
    or exists (select 1 from household_members hm where hm.id = event_viewers.member_id and hm.user_id = auth.uid())
  );

drop policy if exists event_viewers_write on event_viewers;
create policy event_viewers_write on event_viewers
  for all
  using (event_owner_household(event_viewers.event_id) = my_household_id())
  with check (event_owner_household(event_viewers.event_id) = my_household_id());

drop policy if exists bill_viewers_select on bill_viewers;
create policy bill_viewers_select on bill_viewers
  for select using (
    bill_owner_household(bill_viewers.bill_id) = my_household_id()
    or exists (select 1 from household_members hm where hm.id = bill_viewers.member_id and hm.user_id = auth.uid())
  );

drop policy if exists bill_viewers_write on bill_viewers;
create policy bill_viewers_write on bill_viewers
  for all
  using (bill_owner_household(bill_viewers.bill_id) = my_household_id())
  with check (bill_owner_household(bill_viewers.bill_id) = my_household_id());
