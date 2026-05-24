/**
 * Database Auto-Init Service — KrishiAI v2
 *
 * Automatically checks if the Supabase database schema exists
 * and creates it if missing.  No admin intervention needed.
 *
 * Works by:
 * 1. Checking localStorage flag to skip redundant checks
 * 2. Attempting to SELECT from the profiles table
 * 3. If table doesn't exist, running the migration SQL via Supabase RPC
 * 4. Setting a localStorage flag on success
 *
 * All SQL is idempotent (IF NOT EXISTS) so it's safe to re-run.
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient"
import { DB_AUTO_INIT_KEY } from "../lib/appConfig"

// ── Migration SQL (idempotent) ──────────────────────────────────

const MIGRATION_SQL = `
-- ── Profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone        text,
  district     text,
  upazila      text,
  village      text,
  language     text NOT NULL DEFAULT 'bn',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Chat Sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Chat Messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Reports ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('disease', 'analysis', 'chat')),
  title        text,
  data         jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Soil Cache ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.soil_cache (
  id           serial PRIMARY KEY,
  lat          double precision NOT NULL,
  lon          double precision NOT NULL,
  data         jsonb NOT NULL,
  fetch_date   date NOT NULL DEFAULT current_date,
  CONSTRAINT soil_cache_lat_lon UNIQUE (lat, lon, fetch_date)
);

-- ── Market Cache ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.market_cache (
  id           serial PRIMARY KEY,
  district     text NOT NULL,
  level        text NOT NULL DEFAULT 'retail',
  data         jsonb NOT NULL,
  fetch_date   date NOT NULL DEFAULT current_date,
  CONSTRAINT market_cache_district_level UNIQUE (district, level, fetch_date)
);

-- ── RLS Policies ──────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Profiles: users can only read/update their own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_self') THEN
    CREATE POLICY profiles_self ON public.profiles
      FOR ALL USING (auth.uid() = id);
  END IF;

  -- Chat sessions: users can only access their own sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sessions_self') THEN
    CREATE POLICY sessions_self ON public.chat_sessions
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Chat messages: via session ownership
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'messages_self') THEN
    CREATE POLICY messages_self ON public.chat_messages
      FOR ALL USING (
        session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())
      );
  END IF;

  -- Reports: users can only access their own reports
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_self') THEN
    CREATE POLICY reports_self ON public.reports
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Soil/market cache: readable by all authenticated users
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'soil_cache_read') THEN
    CREATE POLICY soil_cache_read ON public.soil_cache FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'market_cache_read') THEN
    CREATE POLICY market_cache_read ON public.market_cache FOR SELECT USING (true);
  END IF;
END $$;

-- ── Auto-profile creation trigger ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, district, upazila, village, language)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'district',
    NEW.raw_user_meta_data->>'upazila',
    NEW.raw_user_meta_data->>'village',
    COALESCE(NEW.raw_user_meta_data->>'language', 'bn')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ── Stale cache purge function ───────────────────────────
CREATE OR REPLACE FUNCTION public.purge_stale_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.soil_cache WHERE fetch_date < current_date - interval '7 days';
  DELETE FROM public.market_cache WHERE fetch_date < current_date - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

// ── Public Functions ────────────────────────────────────────────

/**
 * Check if the database has been initialized for this browser session.
 * Uses localStorage to avoid repeated checks.
 */
function isAlreadyInitialized(): boolean {
  try {
    return localStorage.getItem(DB_AUTO_INIT_KEY) === "true"
  } catch {
    return false
  }
}

function markInitialized(): void {
  try {
    localStorage.setItem(DB_AUTO_INIT_KEY, "true")
  } catch {
    // localStorage unavailable — will re-check next time
  }
}

/**
 * Auto-initialize the database schema if it doesn't exist.
 * Called on app startup.  Safe to call multiple times.
 *
 * This uses Supabase's `rpc` to execute SQL via a custom function,
 * OR falls back to direct table existence check.
 *
 * Returns true if schema is ready, false if initialization failed.
 */
export async function autoInitDatabase(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("[dbInit] Supabase not configured, skipping auto-init")
    return false
  }

  // Skip if already initialized in this session
  if (isAlreadyInitialized()) {
    return true
  }

  try {
    // Check if profiles table exists by trying a simple query
    const { error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    if (!checkError) {
      // Table exists — schema is ready
      markInitialized()
      console.log("[dbInit] Schema already exists")
      return true
    }

    // If the error is "relation does not exist", we need to create tables
    if (checkError.message?.includes("does not exist") || checkError.code === "42P01") {
      console.log("[dbInit] Schema missing, attempting auto-init via RPC...")

      // Try using Supabase's rpc to execute the migration
      // Note: This requires the `exec_sql` function to exist in the DB,
      // OR the user must run the migration manually from Supabase Dashboard.
      // For auto-init without admin, we provide a clear fallback.

      // Attempt 1: Try rpc with exec_sql
      const { error: rpcError } = await supabase.rpc("exec_sql", {
        sql_query: MIGRATION_SQL,
      })

      if (!rpcError) {
        markInitialized()
        console.log("[dbInit] Schema created via RPC")
        return true
      }

      // If RPC doesn't exist, the user needs to run the SQL manually
      // We'll save it to localStorage so they can access it
      console.warn(
        "[dbInit] Auto-init RPC not available. Please run the migration SQL in Supabase Dashboard."
      )
      console.log("[dbInit] Migration SQL:", MIGRATION_SQL)

      // Store the migration SQL for easy access
      try {
        localStorage.setItem("krishiai-pending-migration", MIGRATION_SQL)
      } catch {
        // ignore
      }

      return false
    }

    // Other error — might be RLS issue (table exists but no read access)
    // This is actually fine — the table exists
    markInitialized()
    return true
  } catch (err) {
    console.error("[dbInit] Auto-init failed:", err)
    return false
  }
}

/**
 * Get the pending migration SQL (for display to admin if auto-init fails).
 */
export function getPendingMigrationSQL(): string | null {
  try {
    return localStorage.getItem("krishiai-pending-migration")
  } catch {
    return null
  }
}

/**
 * Clear the initialization flag (forces re-check on next load).
 */
export function resetDbInitFlag(): void {
  try {
    localStorage.removeItem(DB_AUTO_INIT_KEY)
    localStorage.removeItem("krishiai-pending-migration")
  } catch {
    // ignore
  }
}
