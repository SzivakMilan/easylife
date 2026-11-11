-- Határidőknél és számláknál eddig nem lehetett beállítani, mikor érkezzen az
-- emlékeztető push (mindig kőkeményen 24 órával előtte, a send-reminders
-- Edge Function kódjába égetve). Az időpontoknál már meglévő mintát követve
-- (events.reminder_offset_minutes) ugyanezt a mezőt adjuk hozzá itt is.
alter table deadlines add column reminder_offset_minutes integer;
alter table bills add column reminder_offset_minutes integer;

-- A meglévő tételek eddig mindig egy kőkeményen beégetett 24 órás emlékeztetőt
-- kaptak (lásd send-reminders Edge Function). Mostantól a NULL azt jelenti,
-- hogy nincs emlékeztető - hogy ez a meglévő tételeknél ne változzon meg
-- némán, explicit 1440-re állítjuk őket.
update deadlines set reminder_offset_minutes = 1440 where reminder_offset_minutes is null;
update bills set reminder_offset_minutes = 1440 where reminder_offset_minutes is null;
