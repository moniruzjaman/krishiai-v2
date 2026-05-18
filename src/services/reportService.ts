import { supabase } from "./supabaseClient"

export interface Report {
  id: string
  type: "disease" | "analysis" | "chat"
  preview: string
  data: Record<string, unknown>
  image_url?: string | null
  district?: string | null
  upazila?: string | null
  created_at: string
}

export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, type, preview, data, image_url, district, upazila, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return (data ?? []) as Report[]
}

export async function saveReport(
  report: Omit<Report, "id" | "created_at">,
): Promise<void> {
  const { error } = await supabase.from("reports").insert(report)
  if (error) throw new Error(error.message)
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("reports").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
