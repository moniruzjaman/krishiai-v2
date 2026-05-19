-- ============================================================
-- KrishiAI v2 — Full Database Schema
-- Migration: 001_initial_schema
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for Bengali text search

-- ============================================================
-- TABLE: profiles
-- Extends auth.users with farmer-specific data
-- Created automatically on signup via trigger
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text,
  district    text,
  upazila     text,
  language    text not null default 'bn' check (language in ('bn', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone)
  values (
    new.id,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- TABLE: chat_sessions
-- Groups chat messages into conversations
-- ============================================================
create table public.chat_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,                        -- auto-generated from first message
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions: own all" on public.chat_sessions
  for all using (auth.uid() = user_id);

create index idx_chat_sessions_user on public.chat_sessions(user_id, updated_at desc);

create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();

-- ============================================================
-- TABLE: chat_messages
-- Individual messages within a chat session
-- ============================================================
create table public.chat_messages (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_messages: own all" on public.chat_messages
  for all using (auth.uid() = user_id);

create index idx_chat_messages_session on public.chat_messages(session_id, created_at asc);

-- ============================================================
-- TABLE: reports
-- Saved analysis/disease/chat reports shown in Profile page
-- Replaces the MOCK_REPORTS in Profile.tsx
-- ============================================================
create table public.reports (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('disease', 'analysis', 'chat')),
  preview     text not null,               -- short Bengali summary shown in list
  data        jsonb not null default '{}', -- full result payload
  image_url   text,                        -- optional stored image reference
  lat         double precision,
  lon         double precision,
  district    text,
  upazila     text,
  created_at  timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "reports: own all" on public.reports
  for all using (auth.uid() = user_id);

create index idx_reports_user on public.reports(user_id, created_at desc);
create index idx_reports_type  on public.reports(user_id, type);

-- ============================================================
-- TABLE: soil_cache
-- Persists SoilGrids results per GPS location (server-side)
-- Avoids re-fetching for same coordinates within 7 days
-- ============================================================
create table public.soil_cache (
  id          uuid primary key default uuid_generate_v4(),
  lat         double precision not null,
  lon         double precision not null,
  data        jsonb not null,              -- full SoilData object
  fetched_at  timestamptz not null default now(),
  unique (lat, lon)
);

-- Public read (no auth needed — soil data is not personal)
alter table public.soil_cache enable row level security;
create policy "soil_cache: public read"  on public.soil_cache for select using (true);
create policy "soil_cache: service write" on public.soil_cache
  for insert with check (true);           -- written by serverless function

create index idx_soil_cache_coords on public.soil_cache(lat, lon);

-- ============================================================
-- TABLE: market_cache
-- Caches DAM/WFP market price responses per district+date
-- ============================================================
create table public.market_cache (
  id          uuid primary key default uuid_generate_v4(),
  district    text not null,
  level       text not null default 'retail',
  data        jsonb not null,              -- full MarketData object
  fetched_at  timestamptz not null default now()
);

-- Unique constraint on (district, level, date) — must be a separate index
-- because PostgreSQL does not allow expressions in table-level UNIQUE constraints
create unique index idx_market_cache_unique on public.market_cache(district, level, (fetched_at::date));

alter table public.market_cache enable row level security;
create policy "market_cache: public read"   on public.market_cache for select using (true);
create policy "market_cache: service write" on public.market_cache for insert with check (true);

create index idx_market_cache_district on public.market_cache(district, fetched_at desc);

-- ============================================================
-- CLEANUP: remove stale cache rows automatically
-- Run via pg_cron or Supabase scheduled function
-- ============================================================
create or replace function public.purge_stale_cache()
returns void language sql security definer as $$
  delete from public.soil_cache   where fetched_at < now() - interval '7 days';
  delete from public.market_cache where fetched_at < now() - interval '1 day';
$$;
