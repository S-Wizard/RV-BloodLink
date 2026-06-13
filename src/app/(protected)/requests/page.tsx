"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplet, MapPin, Clock, AlertTriangle, PlusCircle, Filter } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

type BloodRequest = {
  id: string
  blood_group: string
  units_required: number
  hospital_name: string
  city: string
  priority: string
  status: string
  created_at: string
}

export default function RequestsFeedPage() {
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState<string>("All")
  const supabase = createClient()

  const fetchRequests = async () => {
    setLoading(true)
    let query = supabase
      .from('blood_requests')
      .select('id, blood_group, units_required, hospital_name, city, priority, status, created_at')
      .in('status', ['Pending', 'In Progress']) // Only show active
      .order('created_at', { ascending: false })
      
    if (filterPriority !== "All") {
      query = query.eq('priority', filterPriority)
    }

    const { data, error } = await query

    if (!error && data) {
      // Sort to ensure Critical is on top if filter is "All"
      if (filterPriority === "All") {
        data.sort((a, b) => {
          if (a.priority === 'Critical' && b.priority !== 'Critical') return -1
          if (a.priority !== 'Critical' && b.priority === 'Critical') return 1
          return 0
        })
      }
      setRequests(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()

    // Subscribe to realtime updates
    const channel = supabase.channel('blood_requests_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_requests' },
        (payload) => {
          console.log('Realtime change received!', payload)
          // Simply refetch to ensure sorting/filtering is perfectly applied
          // In a heavily scaled app, you'd mutate the state directly to save queries
          fetchRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPriority])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blood Requests</h1>
          <p className="text-muted-foreground mt-1">Live feed of community blood requirements.</p>
        </div>
        <Link href="/requests/create">
          <Button className="rounded-full px-6 shadow-lg shadow-red-500/20 hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5 mr-2" /> Post Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 text-muted-foreground mr-2 font-medium text-sm">
          <Filter className="w-4 h-4" /> Priority:
        </div>
        {["All", "Critical", "Urgent", "Normal"].map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border whitespace-nowrap ${
              filterPriority === p 
                ? 'bg-primary text-white border-primary shadow-sm' 
                : 'bg-white dark:bg-card border-border hover:bg-gray-50 dark:hover:bg-card/50 text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="p-6 border-none shadow-sm animate-pulse bg-gray-50 dark:bg-card/50 h-40"></Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white/50 dark:bg-card/50 rounded-3xl border border-dashed border-border">
          <div className="bg-green-50 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Droplet className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">No active requests</h3>
          <p className="text-muted-foreground">The community is fully supplied at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map(req => {
            const isEmergency = req.priority === 'Critical' || req.priority === 'Urgent';
            return (
              <Card 
                key={req.id} 
                className={`p-0 overflow-hidden border-none transition-all hover:shadow-xl group ${
                  req.priority === 'Critical' 
                    ? 'shadow-lg shadow-red-500/10 dark:shadow-red-900/20' 
                    : 'shadow-md bg-white dark:bg-card'
                }`}
              >
                {req.priority === 'Critical' && (
                  <div className="bg-red-500 text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-2 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> CRITICAL EMERGENCY
                  </div>
                )}
                
                <div className={`p-6 ${req.priority === 'Critical' ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                        isEmergency ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {req.blood_group}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{req.hospital_name}</h3>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{req.city}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-gray-100 dark:bg-card px-2.5 py-1 rounded text-xs font-semibold text-muted-foreground">
                        {req.units_required} {req.units_required === 1 ? 'Unit' : 'Units'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Posted {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </div>
                    
                    <Link href={`/requests/${req.id}`}>
                      <Button size="sm" className={`rounded-lg ${isEmergency ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
