"use client"

import { useState, useEffect, useId } from "react"
import { createClient } from "@/utils/supabase/client"
import { Bell, CheckCircle2 } from "lucide-react"
import { buttonVariants } from "./ui/button"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { requestNotificationPermission } from "@/utils/firebase/client"

type Notification = {
  id: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const componentId = useId()

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  useEffect(() => {
    fetchNotifications()

    let isMounted = true
    let channel: any

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isMounted) return

      channel = supabase.channel(`notifications_${user.id}_${componentId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10))
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()
    }
    
    setupRealtime()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, componentId])

  // Request FCM token when user logs in and save to DB
  useEffect(() => {
    const registerFCM = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const token = await requestNotificationPermission()
      if (token) {
        // Save token to Supabase users table
        await supabase
          .from('users')
          .update({ fcm_token: token })
          .eq('id', user.id)
      }
    }

    // Small delay to ensure smooth loading before prompting
    const timer = setTimeout(() => {
      registerFCM()
    }, 2000)

    return () => clearTimeout(timer)
  }, [supabase])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <Popover>
      <PopoverTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer")}>
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background animate-pulse" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-2xl shadow-xl overflow-hidden border-none bg-white/95 dark:bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/30">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-primary font-medium hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">All Caught Up</h3>
              <p className="text-xs">
                You have no new notifications.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-border/50 transition-colors last:border-0 ${notif.is_read ? 'opacity-70' : 'bg-red-50/50 dark:bg-red-950/10'}`}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${notif.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-0.5">{notif.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug mb-2">{notif.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                        {notif.link && (
                          <Link href={notif.link}>
                            <span className="text-[10px] font-bold text-primary hover:underline" onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}>
                              View Details
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
