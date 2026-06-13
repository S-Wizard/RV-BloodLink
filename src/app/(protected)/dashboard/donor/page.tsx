import { createClient } from "@/utils/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplet, Heart, MapPin, Activity, Bell, Edit, Phone, Star, User as UserIcon, ShieldCheck, Trophy, CheckCircle2, ScanLine, Search, Medal } from "lucide-react"
import Link from "next/link"
import { LiveActivityFeed } from "@/components/LiveActivityFeed"
import { formatDistanceToNow } from "date-fns"

export const dynamic = 'force-dynamic'

export default async function DonorDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single()

  if (!profile) return null

  // Fetch accepted requests count
  const { count: acceptedRequestsCount } = await supabase
    .from("request_responses")
    .select("*", { count: 'exact', head: true })
    .eq("donor_id", profile.id)
    .in("status", ["Accepted", "Completed"])

  // Fetch Nearby Donors (same city, prioritize locality)
  const { data: nearbyDonorsData } = await supabase
    .from("users")
    .select("id, full_name, blood_group, availability, locality, city")
    .eq("role", "donor")
    .eq("city", profile.city || "Bengaluru")
    .neq("id", profile.id)

  const nearbyDonors = nearbyDonorsData?.sort((a, b) => {
    if (profile.locality && a.locality === profile.locality && b.locality !== profile.locality) return -1
    if (profile.locality && b.locality === profile.locality && a.locality !== profile.locality) return 1
    return 0
  }).slice(0, 3)

  // Fetch Featured Donors (top donation count)
  const { data: featuredDonors } = await supabase
    .from("users")
    .select("id, full_name, blood_group, donation_count")
    .eq("role", "donor")
    .order("donation_count", { ascending: false })
    .limit(3)

  // PHASE 4 STATS
  const { count: verifiedDonationsCount } = await supabase
    .from("donation_verifications")
    .select("*", { count: 'exact', head: true })
    .eq("donor_id", profile.id)
    .eq("verification_status", "verified")

  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", profile.id)

  const isTrusted = achievements?.some(a => a.achievement_name === 'Trusted Donor')

  const { data: donationHistory } = await supabase
    .from("donation_verifications")
    .select(`
      id,
      verification_status,
      created_at,
      request:blood_requests(
        hospital_name,
        city,
        blood_group
      )
    `)
    .eq("donor_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Welcome back, {profile.full_name?.split(' ')[0]}
            {isTrusted && (
              <span className="bg-yellow-100 text-yellow-700 text-sm px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm border border-yellow-200">
                <Trophy className="w-4 h-4" /> Trusted Donor
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Here's your personal impact overview.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border border-border">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${profile.availability ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${profile.availability ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
          <span className="font-medium text-sm">
            {profile.availability ? "Available to donate" : "Unavailable to donate"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-card border-none shadow-xl shadow-red-500/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" /> Profile Summary
            </h2>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-primary hover:bg-red-100 dark:hover:bg-red-900/50">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Blood Group</p>
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

        <Card className="p-6 border-none shadow-xl bg-primary text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Heart className="w-24 h-24" />
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-red-100 font-medium text-xs mb-1 uppercase tracking-wider">Verified Donations</h3>
              <p className="text-4xl font-black">{verifiedDonationsCount || 0}</p>
            </div>
            <div>
              <h3 className="text-red-100 font-medium text-xs mb-1 uppercase tracking-wider">Achievements</h3>
              <p className="text-4xl font-black">{achievements?.length || 0}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-red-400/30">
              <h3 className="text-red-100 font-medium text-xs mb-1 uppercase tracking-wider">Active Responses</h3>
              <p className="text-xl font-bold">{acceptedRequestsCount || 0}</p>
            </div>
          </div>
          <div className="relative z-10 mt-4 bg-white/20 p-3 rounded-xl backdrop-blur-md flex items-center justify-between">
            <p className="text-xs text-red-50 font-medium">
              Ready to help?
            </p>
            <Link href="/requests">
              <Button size="sm" variant="secondary" className="text-primary font-bold h-7 text-xs">
                Find Requests
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Donation History Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" /> Donation History
        </h2>
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-card">
          {(!donationHistory || donationHistory.length === 0) ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <ScanLine className="w-10 h-10 text-green-500 opacity-50" />
              </div>
              <h3 className="font-bold text-lg mb-2">No Verified Donations Yet</h3>
              <p className="text-muted-foreground text-sm max-w-[250px] mb-6">
                Complete a blood request and ask the requester to scan your QR code to verify your donation.
              </p>
              <Link href="/requests">
                <Button className="rounded-xl shadow-md">Find Requests to Help</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {donationHistory.map((verif: any) => (
                <div key={verif.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-black text-sm">
                      {verif.request?.blood_group || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-base">{verif.request?.hospital_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {verif.request?.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDistanceToNow(new Date(verif.created_at), { addSuffix: true })}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {verif.verification_status === 'verified' ? (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-yellow-600 flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">View map</Link>
          </div>
          <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-card">
            {(!nearbyDonors || nearbyDonors.length === 0) ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
                <h3 className="font-bold text-md mb-1">No Nearby Donors</h3>
                <p className="text-muted-foreground text-xs max-w-[200px]">
                  Be the first active donor in {profile.locality || profile.city || "your area"} and invite others!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {nearbyDonors.map(donor => (
                  <div key={donor.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-card/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
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
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Featured Donors Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" /> Top Contributors
            </h2>
            <Link href="/donors" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-card">
            {(!featuredDonors || featuredDonors.length === 0) ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
                  <Medal className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
                <h3 className="font-bold text-md mb-1">Leaderboard Empty</h3>
                <p className="text-muted-foreground text-xs max-w-[200px]">
                  Start donating to claim your spot at the top of the leaderboard.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {featuredDonors.map((donor, index) => (
                  <div key={donor.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-card/50 transition-colors">
                    <div className="w-6 text-center font-black text-muted-foreground/50">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        {donor.full_name} 
                        {index === 0 && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">MVP</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{donor.donation_count || 0} Donations</p>
                    </div>
                    <div className="font-bold text-primary bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded text-sm">
                      {donor.blood_group || "?"}
                    </div>
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
