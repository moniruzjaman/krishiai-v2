import { supabase } from "./supabaseClient"

export interface Profile {
  id: string
  phone: string | null
  district: string | null
  upazila: string | null
  language: "bn" | "en"
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, phone, district, upazila, language")
    .single()

  if (error) return null
  return data as Profile
}

export async function updateProfile(
  updates: Partial<Omit<Profile, "id">>,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")

  if (error) throw new Error(error.message)
}
