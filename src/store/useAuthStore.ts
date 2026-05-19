import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase, isSupabaseConfigured } from "../services/supabaseClient"

// ── Types ───────────────────────────────────────────────────────

export interface User {
  id: string
  email: string | null
  phone: string | null
  createdAt: string
}

interface AuthState {
  user: User | null
  loading: boolean
  supabaseAvailable: boolean

  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, phone?: string) => Promise<void>
  signInWithPhone: (phone: string) => Promise<void>
  verifyOtp: (phone: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
}

// ── Helpers ─────────────────────────────────────────────────────

function mapUser(authUser: Record<string, unknown> | null): User | null {
  if (!authUser) return null
  return {
    id: (authUser as { id: string }).id ?? "",
    email: (authUser as { email?: string | null }).email ?? null,
    phone: (authUser as { phone?: string | null }).phone ?? null,
    createdAt:
      (authUser as { created_at?: string }).created_at ?? new Date().toISOString(),
  }
}

/** Error thrown when Supabase is not configured */
class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.")
    this.name = "SupabaseNotConfiguredError"
  }
}

// ── Store ───────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
  user: null,
  loading: false,
  supabaseAvailable: isSupabaseConfigured(),

  signIn: async (email: string, password: string) => {
    if (!supabase) throw new SupabaseNotConfiguredError()
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      set({ user: mapUser(data.user as unknown as Record<string, unknown>) })
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string, phone?: string) => {
    if (!supabase) throw new SupabaseNotConfiguredError()
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { phone },
        },
      })
      if (error) throw error
      set({ user: mapUser(data.user as unknown as Record<string, unknown>) })
    } finally {
      set({ loading: false })
    }
  },

  signInWithPhone: async (phone: string) => {
    if (!supabase) throw new SupabaseNotConfiguredError()
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      })
      if (error) throw error
      // User is not set yet — they must verify OTP first
    } finally {
      set({ loading: false })
    }
  },

  verifyOtp: async (phone: string, token: string) => {
    if (!supabase) throw new SupabaseNotConfiguredError()
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      })
      if (error) throw error
      set({ user: mapUser(data.user as unknown as Record<string, unknown>) })
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    if (!supabase) {
      // Just clear local state if Supabase isn't configured
      set({ user: null })
      return
    }
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null })
    } finally {
      set({ loading: false })
    }
  },

    setUser: (user) => set({ user }),
  }),
  {
    name: "krishiai-auth",
    partialize: (s) => ({ user: s.user }),
  }
))
