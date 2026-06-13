"use server"

import { createClient } from "@supabase/supabase-js"

export async function createUserRecord(userData: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  // Use service_role to bypass RLS for initial user record creation
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { error } = await supabaseAdmin.from('users').insert(userData)
  
  if (error) {
    console.error("Error creating user record:", error)
    return { error: error.message }
  }

  return { success: true }
}
