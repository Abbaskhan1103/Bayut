-- Replace the config.toml schedule (which can't pass auth headers) with a
-- pg_cron job that calls the edge function with the CRON_SECRET.
--
-- IMPORTANT: Before running this migration:
-- 1. Set CRON_SECRET in Supabase Dashboard → Edge Functions → youtube-live-check → Secrets
-- 2. Copy that same secret value into the vault secret below, replacing 'your-cron-secret-here'
-- 3. Remove the `schedule` line from supabase/config.toml [functions.youtube-live-check]
--    (keep verify_jwt = false — the function still does its own auth check)

-- Enable pg_cron extension (may already be enabled)
create extension if not exists pg_cron;
grant usage on schema cron to postgres;

-- Store the secret in Supabase Vault so it's not hardcoded in cron SQL
-- Run this once manually in the SQL editor with your actual secret value:
--   select vault.create_secret('your-cron-secret-here', 'cron_secret', 'Secret for youtube-live-check edge function');

-- Schedule: every 10 minutes, 07:00–13:59 UTC (matches 17:00–23:59 AEST)
select cron.schedule(
  'youtube-live-check',
  '*/10 7-13 * * *',
  $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/youtube-live-check',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
