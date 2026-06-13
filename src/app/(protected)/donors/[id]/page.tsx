import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Droplet, Phone, MessageCircle, Activity, Calendar, ShieldCheck, User as UserIcon, Trophy, CheckCircle2, Award } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DonorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: donor, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !donor || donor.role !== "donor") {
    notFound()
  }

  // Fetch verifications and achievements
  const { data: verifications } = await supabase.from('verifications').select('*').eq('user_id', id).eq('status', 'verified')
  const { data: achievements } = await supabase.from('achievements').select('*').eq('user_id', id)

  const isVerified = verifications && verifications.length > 0
  const isTrusted = achievements?.some(a => a.achievement_name === 'Trusted Donor')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <Link href="/donors" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Directory
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column - Main Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-8 border-none shadow-xl bg-white dark:bg-card text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-red-100 to-white dark:from-red-950/40 dark:to-background z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white dark:bg-background p-2 rounded-full shadow-md mb-4 mt-8 relative">
                <div className="bg-primary/10 p-6 rounded-full">
                  <UserIcon className="w-12 h-12 text-primary" />
                </div>
                {(donor.profile_verified || isVerified) && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full border-2 border-white dark:border-background" title="Verified Profile">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {donor.full_name}
              </h1>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-2">
                {(donor.profile_verified || isVerified) && (
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
                {isTrusted && (
                  <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Award className="w-3 h-3" /> Trusted Donor
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground mt-1 mb-6">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[250px]" title={`${donor.locality ? `${donor.locality}, ` : ''}${donor.city}${donor.state ? `, ${donor.state}` : ''}`}>
                  {donor.locality ? `${donor.locality}, ` : ''}{donor.city}{donor.state ? `, ${donor.state}` : ''}
                </span>
              </div>

              <div className="flex flex-col gap-3 w-full">
                {donor.phone && (
                  <>
                    <a href={`tel:${donor.phone}`} className="w-full">
                      <Button className="w-full rounded-xl h-12 text-md font-bold shadow-md hover:shadow-lg transition-all">
                        <Phone className="w-5 h-5 mr-2" /> Call Donor
                      </Button>
                    </a>
                    <a href={`https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full rounded-xl h-12 text-md font-bold text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 border-green-200 dark:border-green-900">
                        <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-none shadow-md">
            <h3 className="font-bold text-lg mb-4">Availability</h3>
            <div className={`p-4 rounded-xl flex items-center gap-3 ${donor.availability ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${donor.availability ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${donor.availability ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="font-semibold text-sm">
                {donor.availability ? "Currently Available" : "Not Available"}
              </span>
            </div>
            {donor.last_active && (
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                <ClockIcon /> Last active: {new Date(donor.last_active).toLocaleDateString()}
              </p>
            )}
            {donor.phone && (
                <div className="flex items-start gap-3 mt-4 p-4 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/30">
                  <div className="bg-white dark:bg-card p-2 rounded-lg shadow-sm">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Phone Number</p>
                    <p className="font-semibold">{donor.phone}</p>
                  </div>
                </div>
            )}
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 border-none shadow-md bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" /> Medical Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Blood Group</p>
                <p className="text-3xl font-black text-primary">{donor.blood_group || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Gender</p>
                <p className="text-lg font-semibold">{donor.gender || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Age</p>
                <p className="text-lg font-semibold">{donor.age ? `${donor.age} yrs` : "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Donations</p>
                <p className="text-3xl font-black text-green-500">{donor.donation_count || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8 border-none shadow-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Donation History
            </h2>
            {donor.donation_count === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-card/50 rounded-xl border border-dashed border-border">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-muted-foreground">No donations recorded yet.</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Placeholder for future donation history phase */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-card/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-primary font-bold text-sm">
                      {donor.blood_group}
                    </div>
                    <div>
                      <p className="font-semibold">Whole Blood Donation</p>
                      <p className="text-xs text-muted-foreground">Local Blood Bank</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'Recent'}</p>
                    <p className="text-xs text-green-500 font-semibold mt-1">Successful</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Achievements Section */}
          <Card className="p-6 md:p-8 border-none shadow-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Achievements
            </h2>
            {(!achievements || achievements.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No achievements unlocked yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className="bg-secondary/50 p-4 rounded-2xl flex flex-col items-center text-center hover:bg-secondary transition-colors">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-3">
                      <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="font-bold text-sm leading-tight">{ach.achievement_name}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{new Date(ach.earned_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
