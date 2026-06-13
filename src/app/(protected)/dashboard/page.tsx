import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Fetch user role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.role) {
    // If no profile or role, default to a fallback or handle error
    redirect("/profile")
  }

  if (profile.role === "donor") {
    redirect("/dashboard/donor")
  } else if (profile.role === "seeker") {
    redirect("/dashboard/seeker")
  }

  return null
}
