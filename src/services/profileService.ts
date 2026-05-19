import { supabase, isSupabaseConfigured } from "./supabaseClient"

export interface Profile {
  id: string
  phone: string | null
  district: string | null
  upazila: string | null
  language: "bn" | "en"
}

export async function getProfile(): Promise<Profile | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, phone, district, upazila, language")
      .single()

    if (error) return null
    return data as Profile
  } catch {
    return null
  }
}

export async function updateProfile(
  updates: Partial<Omit<Profile, "id">>,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured")
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userData.user?.id ?? "")

  if (error) throw new Error(error.message)
}

export { isSupabaseConfigured }
