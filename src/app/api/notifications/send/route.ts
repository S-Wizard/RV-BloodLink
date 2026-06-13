import { NextRequest, NextResponse } from "next/server"
import { adminMessaging } from "@/utils/firebase/admin"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { userId, title, message, link } = await req.json()

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Supabase Admin client to bypass RLS and fetch token + insert notification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // We use the service_role key to bypass RLS because this is a trusted server environment
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Get user's FCM token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Insert into notifications table for in-app history
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        link,
      })

    if (insertError) {
      console.error("Error inserting notification:", insertError)
      // We continue anyway to try to send the push notification
    }

    // 3. Send Firebase Push Notification if token exists
    let pushResult = null
    if (user.fcm_token) {
      try {
        pushResult = await adminMessaging.send({
          token: user.fcm_token,
          notification: {
            title,
            body: message,
          },
          data: {
            url: link || '/',
          },
          webpush: {
            fcmOptions: {
              link: link || '/',
            }
          }
        })
        console.log("Successfully sent message:", pushResult)
      } catch (fcmError) {
        console.error("Error sending FCM message:", fcmError)
        // Token might be invalid/expired, we could optionally remove it from DB here
      }
    } else {
      console.log("No FCM token found for user, skipped push notification.")
    }

    return NextResponse.json({ success: true, pushResult })
    
  } catch (error: any) {
    console.error("Error in /api/notifications/send:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
