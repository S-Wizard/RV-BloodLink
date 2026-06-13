"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Filter, MapPin, Droplet, Users, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { BloodGroup, getCompatibleDonors } from "@/utils/blood-compatibility"
import { LocalitySelector } from "@/components/LocalitySelector"

type Donor = {
  id: string
  full_name: string
  blood_group: BloodGroup
  locality: string
  city: string
  state: string
  availability: boolean
  donation_count: number
  last_active: string
}

export default function SearchPage() {
  const [loading, setLoading] = useState(false)
  const [donors, setDonors] = useState<Donor[]>([])
  
  // Filters
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("")
  const [locality, setLocality] = useState("")
  const [city, setCity] = useState("Bengaluru")
  const [state, setState] = useState("Karnataka")
  const [availabilityOnly, setAvailabilityOnly] = useState(false)
  const [sortBy, setSortBy] = useState("recently_active")

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    
    const supabase = createClient()
    let query = supabase.from("users").select("*").eq("role", "donor")

    // Filter by location
    if (locality.trim()) query = query.ilike("locality", `%${locality}%`)
    if (city.trim()) query = query.ilike("city", `%${city}%`)
    if (state.trim()) query = query.ilike("state", `%${state}%`)

    // Filter by availability
    if (availabilityOnly) query = query.eq("availability", true)

    // Execute query
    const { data, error } = await query

    if (error) {
      console.error("Search error:", error)
      setLoading(false)
      return
    }

    let results = data as Donor[]

    // Smart Matching & Blood Group Filtering
    if (bloodGroup) {
      const compatibleGroups = getCompatibleDonors(bloodGroup)
      results = results.filter(d => compatibleGroups.includes(d.blood_group))
      
      // Sort: exact match first, then compatible
      results.sort((a, b) => {
        if (a.blood_group === bloodGroup && b.blood_group !== bloodGroup) return -1
        if (a.blood_group !== bloodGroup && b.blood_group === bloodGroup) return 1
        return 0
      })
    }

    // Apply Sorting
    results.sort((a, b) => {
      // Primary sort based on exact matches is already done above.
      // We apply secondary sorting here.
      if (sortBy === "recently_active") {
        return new Date(b.last_active || 0).getTime() - new Date(a.last_active || 0).getTime()
      } else if (sortBy === "most_donations") {
        return (b.donation_count || 0) - (a.donation_count || 0)
      } else if (sortBy === "alphabetical") {
        return a.full_name.localeCompare(b.full_name)
      }
      return 0
    })

    setDonors(results)
    setLoading(false)
  }

  // Load initial donors
  useEffect(() => {
    handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bloodGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Donor Search</h1>
        <p className="text-muted-foreground mt-1">Find the exact match using our smart compatibility engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-none shadow-lg bg-white/80 dark:bg-card/80 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">Filters</h2>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-3">
                <Label className="font-semibold text-muted-foreground">Blood Group Required</Label>
                <div className="grid grid-cols-4 gap-2">
                  {bloodGroups.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bloodGroup === bg ? "" : bg)}
                      className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                        bloodGroup === bg 
                          ? "bg-primary text-white border-primary shadow-md shadow-red-500/20" 
                          : "bg-background border-border hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                {bloodGroup && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                    Smart Match enabled: Showing {bloodGroup} and compatible groups.
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <Label className="font-semibold text-muted-foreground">Location</Label>
                <div className="space-y-3">
                  <LocalitySelector 
                    value={locality}
                    onChange={(val) => setLocality(val)}
                  />
                  <div className="grid grid-cols-2 gap-2 opacity-70">
                    <Input 
                      placeholder="City" 
                      value={city} 
                      readOnly
                      className="rounded-xl bg-secondary/50 cursor-not-allowed"
                    />
                    <Input 
                      placeholder="State" 
                      value={state} 
                      readOnly
                      className="rounded-xl bg-secondary/50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="font-semibold text-muted-foreground flex items-center justify-between cursor-pointer">
                  <span>Available Donors Only</span>
                  <div 
                    onClick={() => setAvailabilityOnly(!availabilityOnly)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${availabilityOnly ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${availabilityOnly ? 'translate-x-6' : ''}`}></div>
                  </div>
                </Label>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="font-semibold text-muted-foreground">Sort By</Label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
                >
                  <option value="recently_active">Recently Active</option>
                  <option value="most_donations">Most Donations</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              <Button type="submit" className="w-full rounded-xl shadow-md mt-6">
                <Search className="w-4 h-4 mr-2" /> Apply Filters
              </Button>
            </form>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="p-6 border-none shadow-sm animate-pulse bg-gray-50 dark:bg-card/50">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-3 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{donors.length} Donors Found</h3>
              </div>

              {donors.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-card/50 rounded-3xl border border-dashed border-border">
                  <div className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No matches available</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or searching a different location.</p>
                  <Button variant="outline" className="mt-6 rounded-xl" onClick={() => {
                    setBloodGroup("")
                    setCity("")
                    setState("")
                    setAvailabilityOnly(false)
                    handleSearch()
                  }}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {donors.map((donor) => {
                    const isExactMatch = bloodGroup && donor.blood_group === bloodGroup;
                    return (
                      <Card key={donor.id} className="p-5 border-none shadow-md hover:shadow-lg transition-all bg-white dark:bg-card relative overflow-hidden group">
                        {isExactMatch && (
                          <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                            Exact Match
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 p-3 rounded-full shrink-0">
                            <Droplet className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold truncate pr-2">{donor.full_name}</h4>
                              <span className="font-black text-primary bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded text-sm shrink-0">
                                {donor.blood_group || "?"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[200px]" title={`${donor.locality ? `${donor.locality}, ` : ''}${donor.city}${donor.state ? `, ${donor.state}` : ''}`}>
                                {donor.locality ? `${donor.locality}, ` : ''}{donor.city}{donor.state ? `, ${donor.state}` : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${donor.availability ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs font-medium">{donor.availability ? 'Available' : 'Unavailable'}</span>
                              </div>
                              <Link href={`/donors/${donor.id}`}>
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary hover:bg-red-50 dark:hover:bg-red-950/30 group-hover:translate-x-1 transition-transform">
                                  View <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
