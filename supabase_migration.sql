-- ============================================================
-- Event Table — Phase 1 Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  primary_contact_name text,
  primary_contact_email text,
  billing_email text,
  brand_logo_url text,
  brand_primary_color text,
  plan_name text default 'launch',
  plan_status text default 'active',
  default_timezone text default 'America/Los_Angeles',
  ghl_connection_id text,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- USERS (links to auth.users)
-- ============================================================
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CUSTOMER_USERS
-- ============================================================
create table if not exists customer_users (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text default 'admin',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(customer_id, user_id)
);

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  name text not null,
  slug text not null,
  event_type text default 'Conference',
  description text,
  venue_name text,
  address_1 text,
  address_2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  timezone text default 'America/Los_Angeles',
  start_at timestamptz not null,
  end_at timestamptz not null,
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  payment_mode text default 'free',
  planner_enabled boolean default true,
  sessions_enabled boolean default true,
  expo_enabled boolean default false,
  mycard_enabled boolean default false,
  wallet_enabled boolean default true,
  qr_enabled boolean default true,
  nfc_enabled boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- EVENT_ROOMS
-- ============================================================
create table if not exists event_rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  code text,
  capacity integer,
  location_type text default 'indoor',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PEOPLE
-- ============================================================
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  company text,
  title text,
  city text,
  state text,
  country text,
  notes text,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(email)
);

-- ============================================================
-- EVENT_PEOPLE (registration + attendance junction)
-- ============================================================
create table if not exists event_people (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  attendee_type text default 'attendee',
  registration_status text default 'pending',
  approval_status text,
  checkin_status text default 'not_arrived',
  credential_status text default 'not_issued',
  payment_status text default 'pending',
  payment_reference_id uuid,
  linked_mycard_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, person_id)
);

-- ============================================================
-- ACCESS_POLICIES
-- ============================================================
create table if not exists access_policies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  description text,
  valid_from timestamptz,
  valid_until timestamptz,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CREDENTIALS (Event Table is the sole authority)
-- ============================================================
create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  event_person_id uuid references event_people(id) on delete cascade,
  issuer text default 'event_table',
  role_label text,
  badge_type text default 'standard',
  status text default 'active',
  valid_from timestamptz,
  valid_until timestamptz,
  version integer default 1,
  signature text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CREDENTIAL_PERMISSIONS
-- ============================================================
create table if not exists credential_permissions (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid references credentials(id) on delete cascade,
  permission_type text not null,
  permission_key text not null,
  permission_value text,
  created_at timestamptz default now()
);

-- ============================================================
-- CARDS
-- ============================================================
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  event_id uuid references events(id),
  card_uid text unique not null,
  batch_id uuid,
  card_type text default 'standard pvc nfc',
  card_material text default 'pvc',
  print_status text default 'not_started',
  encode_status text default 'not_started',
  shipment_status text default 'not_shipped',
  assignment_status text default 'unassigned',
  status text default 'in_inventory',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CARD_ASSIGNMENTS
-- ============================================================
create table if not exists card_assignments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  event_person_id uuid references event_people(id) on delete cascade,
  credential_id uuid references credentials(id),
  assigned_at timestamptz default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  replaced_by_card_id uuid references cards(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SESSIONS
-- ============================================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  room_id uuid references event_rooms(id),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer,
  status text default 'open',
  upgrade_enabled boolean default false,
  upgrade_external_url text,
  required_access_policy_id uuid references access_policies(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SESSION_ENTITLEMENTS
-- ============================================================
create table if not exists session_entitlements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  event_person_id uuid references event_people(id) on delete cascade,
  source_type text default 'ticket',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(session_id, event_person_id)
);

-- ============================================================
-- PLANNER_ITEMS
-- ============================================================
create table if not exists planner_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  planner_type text default 'session',
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  room_id uuid references event_rooms(id),
  owner_user_id uuid references auth.users(id),
  owner_event_person_id uuid references event_people(id),
  priority text default 'normal',
  status text default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAYMENT_REFERENCES
-- ============================================================
create table if not exists payment_references (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  event_person_id uuid references event_people(id),
  external_system text,
  external_order_id text,
  external_checkout_url text,
  amount_expected numeric(10,2),
  currency text default 'USD',
  payment_state text default 'pending',
  raw_payload_json jsonb,
  confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- FULFILLMENT_ORDERS
-- ============================================================
create table if not exists fulfillment_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  event_id uuid references events(id),
  order_type text,
  quantity integer,
  order_status text default 'pending',
  shipping_method text,
  tracking_number text,
  destination_name text,
  destination_address_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INTEGRATIONS
-- ============================================================
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  integration_type text not null,
  status text default 'inactive',
  config_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MYCARD_CLAIMS
-- ============================================================
create table if not exists mycard_claims (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid references credentials(id) on delete cascade,
  event_person_id uuid references event_people(id),
  external_mycard_user_id text,
  claim_token text unique,
  claim_status text default 'pending',
  claimed_at timestamptz,
  refreshed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TAP_LOGS (immutable)
-- ============================================================
create table if not exists tap_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  credential_id uuid references credentials(id),
  card_id uuid references cards(id),
  event_person_id uuid references event_people(id),
  tap_source text not null,
  tap_location text,
  tap_type text default 'entry',
  decision text not null,
  message text,
  occurred_at timestamptz not null,
  created_at timestamptz default now()
);

-- ============================================================
-- AUDIT_LOGS (immutable)
-- ============================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  event_id uuid references events(id),
  actor_user_id uuid references auth.users(id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- ONBOARDING_STATES
-- ============================================================
create table if not exists onboarding_states (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade unique,
  current_step text default 'welcome',
  percent_complete integer default 0,
  last_completed_step text,
  status text default 'in_progress',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  stripe_subscription_id text unique,
  plan_name text,
  status text default 'active',
  renews_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- updated_at trigger function
-- ============================================================
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all mutable tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'customers','users','customer_users','events','event_rooms',
    'people','event_people','access_policies','credentials',
    'cards','card_assignments','sessions','session_entitlements',
    'planner_items','payment_references','fulfillment_orders',
    'integrations','mycard_claims','onboarding_states','subscriptions'
  ] loop
    execute format(
      'create trigger set_updated_at before update on %I
       for each row execute function handle_updated_at()', t
    );
  end loop;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table customers enable row level security;
alter table events enable row level security;
alter table people enable row level security;
alter table event_people enable row level security;
alter table credentials enable row level security;
alter table cards enable row level security;
alter table sessions enable row level security;
alter table planner_items enable row level security;
alter table tap_logs enable row level security;
alter table audit_logs enable row level security;
alter table mycard_claims enable row level security;

-- Authenticated users can read and write their own data
-- (Tighten per role in production — this is development-permissive)
create policy "auth_all" on customers for all to authenticated using (true);
create policy "auth_all" on events for all to authenticated using (true);
create policy "auth_all" on people for all to authenticated using (true);
create policy "auth_all" on event_people for all to authenticated using (true);
create policy "auth_all" on credentials for all to authenticated using (true);
create policy "auth_all" on cards for all to authenticated using (true);
create policy "auth_all" on sessions for all to authenticated using (true);
create policy "auth_all" on planner_items for all to authenticated using (true);
create policy "auth_all" on tap_logs for all to authenticated using (true);
create policy "auth_all" on audit_logs for all to authenticated using (true);
create policy "auth_all" on mycard_claims for all to authenticated using (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_events_customer on events(customer_id);
create index if not exists idx_event_people_event on event_people(event_id);
create index if not exists idx_event_people_person on event_people(person_id);
create index if not exists idx_credentials_event on credentials(event_id);
create index if not exists idx_credentials_event_person on credentials(event_person_id);
create index if not exists idx_cards_event on cards(event_id);
create index if not exists idx_tap_logs_event on tap_logs(event_id);
create index if not exists idx_tap_logs_occurred on tap_logs(occurred_at desc);
create index if not exists idx_sessions_event on sessions(event_id);
create index if not exists idx_planner_event on planner_items(event_id);
create index if not exists idx_people_email on people(email);
