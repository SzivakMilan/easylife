-- Lehetővé teszi, hogy egy háztartás tagja átnevezze a saját háztartását
-- (Beállítások → Háztartás). Eddig a households táblán nem volt UPDATE policy,
-- így ez RLS miatt mindig elutasítva jött volna vissza.
create policy households_update_self on households
  for update using (id = my_household_id()) with check (id = my_household_id());
