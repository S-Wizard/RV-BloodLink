import { createClient } from "@/utils/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplet, MapPin, Activity, Phone, MessageCircle, User as UserIcon, CheckCircle2, Award, ShieldCheck } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DonorsPage() {
  const supabase = await createClient()

  const { data: donors, error } = await supabase
    .from("users")
    .select("*, verifications(status), achievements(achievement_name)")
    .eq("role", "donor")
    .order("donation_count", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching donors:", error)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Donor Directory</h1>
        <p className="text-muted-foreground mt-1">Browse all registered blood donors in the community.</p>
      </div>

      {(!donors || donors.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-full mb-6">
            <UserIcon className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Donors Found</h2>
          <p className="text-muted-foreground max-w-md">We couldn't find any registered donors yet. Check back soon or spread the word!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donors.map((donor) => (
            <Card key={donor.id} className="p-6 border-none shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-card overflow-hidden relative">
              {/* Availability Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${donor.availability ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${donor.availability ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="bg-primary/10 p-4 rounded-full flex-shrink-0 relative">
                  <UserIcon className="w-8 h-8 text-primary" />
                  {((donor as any).verifications?.some((v: any) => v.status === 'verified') || donor.profile_verified) && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full border-2 border-white dark:border-background" title="Verified Profile">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight line-clamp-1">{donor.full_name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{donor.city}{donor.state ? `, ${donor.state}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[24px]">
                {((donor as any).verifications?.some((v: any) => v.status === 'verified') || donor.profile_verified) && (
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
                {(donor as any).achievements?.some((a: any) => a.achievement_name === 'Trusted Donor') && (
                  <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Award className="w-3 h-3" /> Trusted Donor
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-card/50 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Blood Group</p>
                  <div className="flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary">{donor.blood_group || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Donations</p>
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="font-bold">{donor.donation_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/donors/${donor.id}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl hover:bg-red-50 hover:text-primary dark:hover:bg-red-950/30">
                    View Profile
                  </Button>
                </Link>
                {donor.phone && (
                  <>
                    <a href={`tel:${donor.phone}`} title="Call Donor">
                      <Button size="icon" variant="secondary" className="rounded-xl shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </a>
                    <a href={`https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp Donor">
                      <Button size="icon" variant="secondary" className="rounded-xl shrink-0 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
