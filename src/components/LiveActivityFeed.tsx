"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Activity, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

type FeedItem = {
  id: string
  type: 'request' | 'response'
  title: string
  subtitle: string
  time: string
  link: string
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<FeedItem[]>([])
  const supabase = createClient()

  const loadInitialFeed = async () => {
    // Fetch latest requests
    const { data: requests } = await supabase
      .from('blood_requests')
      .select('id, hospital_name, blood_group, created_at')
      .order('created_at', { ascending: false })
      .limit(3)

    // Fetch latest responses
    const { data: responses } = await supabase
      .from('request_responses')
      .select('id, request_id, created_at, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(3)

    const formatted: FeedItem[] = []
    
    requests?.forEach(req => {
      formatted.push({
        id: `req_${req.id}`,
        type: 'request',
        title: `New Request: ${req.blood_group}`,
        subtitle: `At ${req.hospital_name}`,
        time: req.created_at,
        link: `/requests/${req.id}`
      })
    })

    responses?.forEach(res => {
      formatted.push({
        id: `res_${res.id}`,
        type: 'response',
        title: `Donor Accepted`,
        subtitle: `A donor has accepted a request`,
        time: res.created_at,
        link: `/requests/${res.request_id}`
      })
    })

    // Sort combined by time descending
    formatted.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    setActivities(formatted.slice(0, 5))
  }

  useEffect(() => {
    loadInitialFeed()

    const channel = supabase.channel('live_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blood_requests' }, (payload) => {
        const req = payload.new
        setActivities(prev => [{
          id: `req_${req.id}`,
          type: 'request' as const,
          title: `New Request: ${req.blood_group}`,
          subtitle: `At ${req.hospital_name}`,
          time: req.created_at,
          link: `/requests/${req.id}`
        }, ...prev].slice(0, 5))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_responses' }, (payload) => {
        const res = payload.new
        setActivities(prev => [{
          id: `res_${res.id}`,
          type: 'response' as const,
          title: `Donor Accepted`,
          subtitle: `A donor just responded to a request`,
          time: res.created_at,
          link: `/requests/${res.request_id}`
        }, ...prev].slice(0, 5))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card className="p-6 border-none shadow-md bg-white dark:bg-card">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-lg font-bold">Live Activity</h3>
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Waiting for new activity...</p>
        ) : (
          activities.map((item) => (
            <Link key={item.id} href={item.link}>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-card/50 transition-colors group">
                <div className={`w-2 h-2 mt-1.5 rounded-full ${item.type === 'request' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <div className="flex-1">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(item.time))}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  )
}
