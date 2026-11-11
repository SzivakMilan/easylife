-- 15 percenként lefuttatja a send-reminders Edge Function-t, ami elküldi a push
-- emlékeztetőket a közeledő határidőkről/időpontokról/számlákról.
--
-- FONTOS: a lenti service_role kulcs a Supabase CLI jól ismert, nyilvános HELYI
-- fejlesztői demó kulcsa (minden supabase local projektnél ugyanaz, nem titok).
-- Éles (cloud) Supabase projektre költözéskor ezt a migrációt NE így futtasd le -
-- helyette a Dashboard "Cron Jobs" felületén vagy a Vault-ban tárolt, valódi
-- service_role kulccsal hozd létre újra az ütemezést.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'http://api.supabase.internal:8000/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
