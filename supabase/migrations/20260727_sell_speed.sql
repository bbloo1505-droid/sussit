-- SussIt sell-speed / listing lifecycle schema
-- Collect from day one. Never treat disappearance as confirmed sale.

create extension if not exists "pgcrypto";

create table if not exists products (
  id text primary key,
  category text not null,
  brand text not null,
  model text not null,
  variant text,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists listing_observations (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('ebay', 'fixture', 'manual', 'user')),
  external_id text not null,
  product_id text references products(id),
  title text not null,
  price numeric not null,
  currency text not null default 'AUD',
  condition text,
  availability text check (availability in ('AVAILABLE', 'UNAVAILABLE', 'UNKNOWN')),
  estimated_sold_quantity integer,
  estimated_available_quantity integer,
  item_created_at timestamptz,
  item_end_at timestamptz,
  observed_at timestamptz not null default now(),
  url text,
  raw jsonb,
  unique (source, external_id, observed_at)
);

create index if not exists listing_observations_product_idx
  on listing_observations (product_id, observed_at desc);

create index if not exists listing_observations_external_idx
  on listing_observations (source, external_id, observed_at desc);

-- One row per tracked listing lifecycle
create table if not exists listing_lifecycles (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  product_id text references products(id),
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  first_price numeric not null,
  last_price numeric not null,
  min_price numeric not null,
  max_price numeric not null,
  observation_count integer not null default 1,
  outcome text not null default 'ACTIVE'
    check (outcome in ('ACTIVE', 'DISAPPEARED', 'CONFIRMED_SOLD', 'WITHDRAWN', 'EXPIRED', 'UNKNOWN')),
  outcome_confidence text not null default 'LOW'
    check (outcome_confidence in ('HIGH', 'MEDIUM', 'LOW')),
  outcome_at timestamptz,
  duration_hours numeric,
  confirmed_sale_price numeric,
  notes text,
  unique (source, external_id)
);

create index if not exists listing_lifecycles_product_outcome_idx
  on listing_lifecycles (product_id, outcome, last_price);

-- Aggregated sell-speed by product + price band (materialized by job)
create table if not exists sell_speed_bands (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id),
  price_band_low numeric not null,
  price_band_high numeric not null,
  sample_count integer not null default 0,
  confirmed_sale_count integer not null default 0,
  disappeared_count integer not null default 0,
  median_days numeric,
  p25_days numeric,
  p75_days numeric,
  speed_label text check (speed_label in ('VERY_FAST', 'FAST', 'MODERATE', 'SLOW', 'UNKNOWN')),
  updated_at timestamptz not null default now(),
  unique (product_id, price_band_low, price_band_high)
);

-- User-confirmed transactions (highest quality signal)
create table if not exists user_transactions (
  id uuid primary key default gen_random_uuid(),
  analysis_id text,
  product_id text references products(id),
  purchase_price numeric,
  purchase_at timestamptz,
  sale_price numeric,
  sale_at timestamptz,
  days_to_sell numeric,
  fees numeric,
  channel text,
  created_at timestamptz not null default now()
);

comment on table listing_lifecycles is
  'DISAPPEARED != sold. Only CONFIRMED_SOLD from quantity signals or user reports.';
