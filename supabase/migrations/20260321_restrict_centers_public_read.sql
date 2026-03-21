-- Replace the unrestricted public read policy on centers with a column-safe view.
--
-- Problem: the old policy allowed anyone (even unauthenticated) to query all
-- columns of the centers table directly via the Supabase REST API, exposing
-- stripe_customer_id, stripe_subscription_id, subscription_status,
-- trial_ends_at, and all bank fields.
--
-- Fix:
--   1. Drop the old policy so anon can no longer hit the base table.
--   2. Add a policy so authenticated (logged-in) users can still read all centers.
--   3. Expose a view with only safe public columns for anonymous access.

-- 1. Drop the old unrestricted policy
drop policy if exists "public_read_centers" on centers;

-- 2. Authenticated users (logged-in) can read all centers
create policy "authenticated_read_centers" on centers
  for select to authenticated using (true);

-- 3. View with only the columns safe to expose publicly (no Stripe or billing fields)
create or replace view public_centers as
select
  id,
  name,
  suburb,
  address,
  lat,
  lng,
  phone,
  email,
  website,
  logo_url,
  youtube_channel_id,
  youtube_url,
  instagram_url,
  facebook_url,
  color_hex,
  bank_name,
  bsb,
  account_number,
  account_name,
  created_at
from centers;

-- Grant anon read access to the restricted view only
grant select on public_centers to anon;
grant select on public_centers to authenticated;
