-- Bekapcsolja a Supabase Realtime-ot a megosztott háztartás-adatokra, hogy
-- amikor valaki felvesz/módosít/töröl egy tételt, a többi nyitva lévő kliens
-- azonnal (nem csak appújraindításkor) frissüljön - eddig semmilyen tábla
-- nem volt feliratkoztatva, a kliens csak egyszer, betöltéskor olvasott.
alter publication supabase_realtime add table deadlines;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table bills;
alter publication supabase_realtime add table budget_categories;
alter publication supabase_realtime add table budget_items;
alter publication supabase_realtime add table savings_goals;
alter publication supabase_realtime add table savings_contributions;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table health_entries;
alter publication supabase_realtime add table household_members;
