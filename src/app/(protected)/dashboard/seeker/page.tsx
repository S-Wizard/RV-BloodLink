import { createClient } from "@/utils/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplet, MapPin, Search, Activity, PlusCircle, User as UserIcon, Phone, Star, ClipboardList, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { LiveActivityFeed } from "@/components/LiveActivityFeed"
import { formatDistanceToNow } from "date-fns"

export const dynamic = 'force-dynamic'

export default async function SeekerDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single()

  if (!profile) return null

  // Fetch active requests count
  const { count: activeRequestsCount } = await supabase
    .from("blood_requests")
    .select("*", { count: 'exact', head: true })
    .eq("created_by", profile.id)
    .in("status", ["Pending", "In Progress"])

  // Fetch Nearby Donors (same city, prioritize locality)
  const { data: nearbyDonorsData } = await supabase
    .from("users")
    .select("id, full_name, blood_group, availability, locality, city")
    .eq("role", "donor")
    .eq("city", profile.city || "Bengaluru")

  const nearbyDonors = nearbyDonorsData?.sort((a, b) => {
    if (profile.locality && a.locality === profile.locality && b.locality !== profile.locality) return -1
    if (profile.locality && b.locality === profile.locality && a.locality !== profile.locality) return 1
    return 0
  }).slice(0, 3)

  // Fetch Request History
  const { data: requestHistory } = await supabase
    .from("blood_requests")
    .select(`
      id,
      blood_group,
      units_required,
      status,
      created_at,
      request_responses(donor_id, users(full_name))
    `)
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile.full_name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Manage your blood requests and find donors.</p>
        </div>
        <Link href="/search">
          <Button className="rounded-full px-6 shadow-lg shadow-red-500/20 hover:scale-105 transition-transform">
            <Search className="w-5 h-5 mr-2" /> Find Donors Now
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card border-none shadow-xl shadow-blue-500/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" /> Profile Summary
            </h2>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                Edit
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Patient Blood Group</p>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-md">
                  <Droplet className="w-4 h-4 text-primary" />
                </div>
                <span className="font-bold text-lg text-primary">{profile.blood_group || "N/A"}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium truncate max-w-[100px]" title={`${profile.locality ? `${profile.locality}, ` : ''}${profile.city || "N/A"}`}>
                  {profile.locality ? `${profile.locality}, ` : ''}{profile.city || "N/A"}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Contact</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium truncate">{profile.phone || "N/A"}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-xl bg-blue-600 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-blue-100 font-medium text-sm mb-1">My Active Requests</h3>
            <p className="text-4xl font-black">{activeRequestsCount || 0}</p>
          </div>
          <div className="relative z-10 mt-6 flex gap-2">
            <Link href="/requests" className="flex-1">
              <Button variant="secondary" className="w-full text-blue-600 font-bold">
                View All
              </Button>
            </Link>
            <Link href="/requests/create">
              <Button variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/20 px-3">
                <PlusCircle className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Request History Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-500" /> My Request History
        </h2>
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-card">
          {(!requestHistory || requestHistory.length === 0) ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
              <h3 className="font-bold text-lg mb-2">No Blood Requests Yet</h3>
              <p className="text-muted-foreground text-sm max-w-[250px] mb-6">
                If you or your loved ones need blood, you can create a request here to notify nearby donors.
              </p>
              <Link href="/requests/create">
                <Button className="rounded-xl shadow-md">Create Your First Request</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requestHistory.map((req: any) => {
                const acceptedResponse = req.request_responses?.find((r: any) => r.status === 'Accepted' || req.status === 'Completed')
                const donorName = acceptedResponse?.users?.full_name
                
                return (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-card/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-sm">
                        {req.blood_group}
                      </div>
                      <div>
                        <p className="font-bold text-base flex items-center gap-2">
                          {req.units_required} Units
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            req.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            req.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.status}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {donorName ? `Donor: ${donorName}` : 'Waiting for donors...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
                        <div className="mt-1">
                          <Link href={`/requests/${req.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-md text-primary">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Nearby Donors Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> Nearby Donors
            </h2>
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">Advanced Search</Link>
          </div>
          <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-card">
            {(!nearbyDonors || nearbyDonors.length === 0) ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-red-500 opacity-50" />
                </div>
                <h3 className="font-bold text-md mb-1">No Nearby Donors</h3>
                <p className="text-muted-foreground text-xs max-w-[200px]">
                  We couldn't find any donors in {profile.locality || profile.city || "your area"}. Try expanding your search.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {nearbyDonors.map(donor => (
                  <div key={donor.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-card/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-primary font-bold text-sm">
                        {donor.blood_group || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{donor.full_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${donor.availability ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {donor.availability ? 'Available' : 'Unavailable'}
                          {donor.locality && <span className="ml-1 text-primary/70">• {donor.locality}</span>}
                        </p>
                      </div>
                    </div>
                    <Link href={`/donors/${donor.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary">Contact</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

      <div className="pt-4">
        <LiveActivityFeed />
      </div>
    </div>
  )
}
