-- A trips tábla felvétele a realtime publikációba (a meglévő
-- 20261114140000_realtime.sql mintájára), hogy az utazások élőben
-- szinkronizáljanak a háztartás tagjai között. A csomaglista/költség/
-- dokumentum gyerektáblákra tudatosan nem teszünk realtime-ot, ugyanaz a
-- korlát, mint a deadline_assignees-nél.
alter publication supabase_realtime add table trips;
