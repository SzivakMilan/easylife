-- Naponta egyszer (a napi digest előtt fél órával) lefuttatja a fetch-news
-- Edge Function-t, ami lekéri és eltárolja a legfrissebb Telex cikkeket.
--
-- FONTOS: ugyanaz a figyelmeztetés vonatkozik rá, mint a többi cronra (lásd
-- 20251111191000_schedule_reminders.sql) - a lenti service_role kulcs a
-- Supabase CLI nyilvános helyi demó kulcsa, éles környezetben ezt a valódi
-- kulccsal/URL-lel kell újra beállítani (lásd DEPLOY.md).
select cron.schedule(
  'fetch-news',
  '30 5 * * *',
  $$
  select net.http_post(
    url := 'http://api.supabase.internal:8000/functions/v1/fetch-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
