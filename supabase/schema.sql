-- =============================================
-- Bayt — Melbourne Shia Islamic Hub
-- Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Centers
create table if not exists centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  suburb text,
  address text,
  lat numeric,
  lng numeric,
  phone text,
  email text,
  website text,
  logo_url text,
  youtube_channel_id text,
  youtube_url text,
  instagram_url text,
  facebook_url text,
  color_hex text,
  -- Donations
  bank_name text,
  bsb text,
  account_number text,
  account_name text,
  -- Subscriptions
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing',
  -- values: trialing | active | past_due | canceled
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

-- Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  center_id uuid references centers(id) on delete cascade,
  title text not null,
  description text,
  date date,
  time time,
  poster_image_url text,
  youtube_stream_url text,
  is_live boolean default false,
  booking_type text default 'none',
  -- values: rsvp | external | contact | none
  booking_url text,
  capacity integer,
  created_at timestamptz default now()
);

-- RSVPs
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  email text,
  attendees integer default 1,
  created_at timestamptz default now()
);

-- Center roles (links Supabase auth users to centers)
create table if not exists center_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  center_id uuid references centers(id) on delete cascade,
  role text default 'manager',
  unique(user_id, center_id)
);

-- =============================================
-- Row Level Security
-- =============================================

alter table centers enable row level security;
alter table events enable row level security;
alter table rsvps enable row level security;
alter table center_roles enable row level security;

-- Public can read all centers
create policy "public_read_centers" on centers
  for select using (true);

-- Public can read all events
create policy "public_read_events" on events
  for select using (true);

-- Center managers can insert/update/delete their own center's events
create policy "managers_insert_events" on events
  for insert with check (
    center_id in (
      select center_id from center_roles where user_id = auth.uid()
    )
  );

create policy "managers_update_events" on events
  for update using (
    center_id in (
      select center_id from center_roles where user_id = auth.uid()
    )
  );

create policy "managers_delete_events" on events
  for delete using (
    center_id in (
      select center_id from center_roles where user_id = auth.uid()
    )
  );

-- Managers can update their own center
create policy "managers_update_center" on centers
  for update using (
    id in (
      select center_id from center_roles where user_id = auth.uid()
    )
  );

-- Anyone can insert an RSVP (no auth required for public RSVP)
create policy "public_insert_rsvps" on rsvps
  for insert with check (true);

-- Managers can read RSVPs for their events
create policy "managers_read_rsvps" on rsvps
  for select using (
    event_id in (
      select id from events where center_id in (
        select center_id from center_roles where user_id = auth.uid()
      )
    )
  );

-- Users can read their own center roles
create policy "own_roles_select" on center_roles
  for select using (user_id = auth.uid());

-- =============================================
-- Realtime: enable for events table
-- Run in Supabase dashboard: Database > Replication
-- Or via SQL:
-- =============================================
-- alter publication supabase_realtime add table events;

-- =============================================
-- Storage: create posters bucket
-- Run in Supabase dashboard: Storage > New Bucket
-- Name: posters, Public: true
-- Or via SQL:
-- =============================================
-- insert into storage.buckets (id, name, public) values ('posters', 'posters', true);
