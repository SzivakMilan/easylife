-- Naponta egyszer lefuttatja a send-daily-digest Edge Function-t.
--
-- FONTOS: ugyanaz a figyelmeztetés vonatkozik rá, mint a send-reminders
-- ütemezésére (lásd 20251111191000_schedule_reminders.sql) - a lenti
-- service_role kulcs a Supabase CLI nyilvános helyi demó kulcsa, éles
-- környezetben ezt a valódi kulccsal/URL-lel kell újra beállítani.
--
-- Az időpont (06:00 UTC) kb. reggel 7-8 órának felel meg Magyarországon
-- (CET/CEST) - nyári időszámításkor érdemes lehet élesben pontosítani.
select cron.schedule(
  'send-daily-digest',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'http://api.supabase.internal:8000/functions/v1/send-daily-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
