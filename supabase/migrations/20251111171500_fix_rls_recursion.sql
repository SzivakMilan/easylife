-- A household_members / household_links RLS szabályai egymást hívó segédfüggvényeken
-- (my_household_id, my_connected_household_ids) keresztül hivatkoznak egymásra. Mivel
-- ezek egyszerű LANGUAGE SQL STABLE függvények voltak, a lekérdezéstervező beágyazta
-- (inline-olta) a törzsüket a policy kifejezésbe, ami megkerülte a SECURITY DEFINER
-- jogosultság-váltást és végtelen rekurziót okozott ("infinite recursion detected in
-- policy for relation ..."). A plpgsql nyelv nem engedi a beágyazást, ezzel megszűnik
-- a probléma.

create or replace function my_household_id()
returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  return (select household_id from household_members where user_id = auth.uid() limit 1);
end;
$$;

create or replace function my_connected_household_ids()
returns setof uuid
language plpgsql stable security definer set search_path = public as $$
begin
  return query
    select household_id from household_members where user_id = auth.uid()
    union
    select household_b_id from household_links
      where household_a_id = (select household_id from household_members where user_id = auth.uid())
      and status = 'accepted'
    union
    select household_a_id from household_links
      where household_b_id = (select household_id from household_members where user_id = auth.uid())
      and status = 'accepted';
end;
$$;
