"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplet, MapPin, Clock, AlertTriangle, User, Phone, CheckCircle2, Loader2, Hospital, HeartHandshake, ShieldCheck, Check, Info, BellRing, Award, MessageCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { receiveFromMap } from "@/utils/blood-compatibility"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

type Profile = {
  id: string
  full_name: string
  role: string
  locality: string
  city: string
  blood_group: string
}

type BloodRequest = {
  id: string
  created_by: string
  patient_name: string
  patient_age: number
  patient_gender: string
  blood_group: string
  units_required: number
  hospital_name: string
  hospital_address: string
  locality: string
  city: string
  state: string
  contact_name: string
  contact_number: string
  alternate_contact: string
  priority: string
  notes: string
  status: string
  created_at: string
}

type DonorMatch = {
  id: string
  full_name: string
  blood_group: string
  locality: string
  city: string
  donation_count: number
}

type AcceptedDonor = {
  id: string
  user_id: string
  full_name: string
  blood_group: string
  locality: string
  city: string
  phone: string
  accepted_at: string
  is_verified: boolean
  is_trusted: boolean
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>()
  const [request, setRequest] = useState<BloodRequest | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [matches, setMatches] = useState<DonorMatch[]>([])
  const [acceptedDonors, setAcceptedDonors] = useState<AcceptedDonor[]>([])
  const [hasAccepted, setHasAccepted] = useState(false)
  const [showToast, setShowToast] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [hasAnyAcceptedDonor, setHasAnyAcceptedDonor] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Load User Profile
        const { data: profData } = await supabase.from('users').select('*').eq('id', user.id).single()
        setProfile(profData)

        // Load Request
        const { data: reqData } = await supabase.from('blood_requests').select('*').eq('id', params.id).single()
        setRequest(reqData)

        if (reqData) {
          // If the user is a donor, check if they already accepted
          if (profData?.role === 'donor') {
            const { data: responseData } = await supabase
              .from('request_responses')
              .select('*')
              .eq('request_id', reqData.id)
              .eq('donor_id', user.id)
              .maybeSingle()
              
            if (responseData) setHasAccepted(true)
          }

          // If the user is the creator, find matches
          if (reqData.created_by === user.id) {
            const compatibleGroups = receiveFromMap[reqData.blood_group as keyof typeof receiveFromMap] || [reqData.blood_group]
            
            const { data: matchData } = await supabase
              .from('users')
              .select('id, full_name, blood_group, locality, city, donation_count')
              .eq('role', 'donor')
              .eq('availability', true)
              .in('blood_group', compatibleGroups)
              .limit(5)
              
            if (matchData) {
              // Sort exact matches first, then same locality, then same city
              matchData.sort((a, b) => {
                if (a.blood_group === reqData.blood_group && b.blood_group !== reqData.blood_group) return -1
                if (b.blood_group === reqData.blood_group && a.blood_group !== reqData.blood_group) return 1
                if (a.locality === reqData.locality && b.locality !== reqData.locality) return -1
                if (b.locality === reqData.locality && a.locality !== reqData.locality) return 1
                if (a.city === reqData.city && b.city !== reqData.city) return -1
                if (b.city === reqData.city && a.city !== reqData.city) return 1
                return 0
              })
              setMatches(matchData)
            }

            // Check accepted donors
            const { data: acceptedResp } = await supabase
              .from('request_responses')
              .select('*, users(*, verifications(status), achievements(achievement_name))')
              .eq('request_id', reqData.id)
              .eq('status', 'Accepted')
            
            if (acceptedResp && acceptedResp.length > 0) {
              setHasAnyAcceptedDonor(true)
              
              const mappedDonors: AcceptedDonor[] = acceptedResp.map(r => {
                const u = r.users as any
                return {
                  id: r.id,
                  user_id: u.id,
                  full_name: u.full_name,
                  blood_group: u.blood_group,
                  locality: u.locality,
                  city: u.city,
                  phone: u.phone,
                  accepted_at: r.created_at,
                  is_verified: u.verifications?.some((v: any) => v.status === 'verified') || u.profile_verified,
                  is_trusted: u.achievements?.some((a: any) => a.achievement_name === 'Trusted Donor')
                }
              })

              // Sort: Trusted first, then Verified, then Time
              mappedDonors.sort((a, b) => {
                if (a.is_trusted && !b.is_trusted) return -1
                if (!a.is_trusted && b.is_trusted) return 1
                if (a.is_verified && !b.is_verified) return -1
                if (!a.is_verified && b.is_verified) return 1
                return new Date(a.accepted_at).getTime() - new Date(b.accepted_at).getTime()
              })

              setAcceptedDonors(mappedDonors)
              
              // If it has an accepted donor but the status is still Pending, the creator can self-heal the status
              if (reqData.status === 'Pending') {
                await supabase.from('blood_requests').update({ status: 'In Progress' }).eq('id', reqData.id)
                setRequest(prev => prev ? { ...prev, status: 'In Progress' } : null)
              }
            }
          }
        }
      }
      setLoading(false)
    }
    
    loadData()
    
    // Realtime subscription for this specific request
    const channel = supabase.channel(`request_${params.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'blood_requests', filter: `id=eq.${params.id}` }, (payload) => {
        setRequest(payload.new as BloodRequest)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_responses', filter: `request_id=eq.${params.id}` }, (payload) => {
        if (payload.new.status === 'Accepted') {
          setShowToast(true)
          setTimeout(() => setShowToast(false), 5000)
          loadData() // Refresh to get the new donor's details
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id, supabase])

  const handleAcceptRequest = async () => {
    if (!profile || !request) return
    setAccepting(true)

    // 1. Create response record
    const { error: responseError } = await supabase.from('request_responses').insert({
      request_id: request.id,
      donor_id: profile.id,
      status: 'Accepted'
    })

    if (!responseError) {
      setHasAccepted(true)
      
      // 2. Send push and in-app notification to creator
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: request.created_by,
          title: "Request Accepted!",
          message: `${profile.full_name} (${profile.blood_group}) has accepted your blood request at ${request.hospital_name}.`,
          link: `/requests/${request.id}`
        })
      })
      
      // 3. Try to update Request Status to 'In Progress' (may fail due to RLS if donor is not creator)
      if (request.status === 'Pending') {
        try {
          await supabase.from('blood_requests').update({ status: 'In Progress' }).eq('id', request.id)
        } catch (e) {
          // May fail due to RLS if donor is not creator
        }
      }
    }
    setAccepting(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!request) return <div className="text-center py-20">Request not found.</div>

  const isCreator = profile?.id === request.created_by
  const isEmergency = request.priority === 'Critical' || request.priority === 'Urgent'
  
  // Progress Timeline Logic
  const getTimelineSteps = () => {
    const hasAcceptedDonor = request.status === 'In Progress' || request.status === 'Accepted' || request.status === 'Completed' || hasAnyAcceptedDonor;
    const isCompleted = request.status === 'Completed';
    return [
      { label: "Request Created", done: true },
      { label: "Donor Accepted", done: hasAcceptedDonor },
      { label: "Donation In Progress", done: hasAcceptedDonor && !isCompleted },
      { label: "Donation Verified", done: isCompleted },
      { label: "Completed", done: isCompleted }
    ]
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-10 relative">
      
      {/* Real-time Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-6 left-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3"
          >
            <BellRing className="w-5 h-5 animate-bounce" />
            A Donor Accepted Your Request!
          </motion.div>
        )}
      </AnimatePresence>

      {request.priority === 'Critical' && (
        <div className="bg-red-500 text-white p-4 rounded-2xl flex items-center gap-3 font-bold shadow-lg shadow-red-500/20 animate-pulse">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          This is a Critical Emergency request. Immediate assistance is required.
        </div>
      )}

      {/* Progress Timeline */}
      <Card className="p-6 border-none shadow-md bg-white dark:bg-card">
        <h3 className="font-bold mb-6 text-sm text-muted-foreground uppercase tracking-wider">Request Progress</h3>
        <div className="flex flex-col sm:flex-row justify-between relative">
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-secondary -translate-y-1/2 hidden sm:block z-0 rounded-full" />
          <div className="absolute top-4 bottom-4 left-4 w-1 bg-secondary sm:hidden z-0 rounded-full" />
          
          {getTimelineSteps().map((step, idx) => (
            <div key={idx} className="relative z-10 flex sm:flex-col items-center gap-4 sm:gap-2 mb-4 sm:mb-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
                step.done 
                  ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {step.done ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-xs font-semibold sm:text-center max-w-[80px] ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Header Card */}
      <Card className={`p-8 border-none shadow-xl ${isEmergency ? 'bg-red-50/30 dark:bg-red-950/10' : 'bg-white dark:bg-card'}`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center shadow-inner ${
              isEmergency ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              <span className="text-2xl font-black leading-none">{request.blood_group}</span>
              <span className="text-[10px] font-bold uppercase mt-1">Required</span>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{request.hospital_name}</h1>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                  request.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                  request.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {request.status}
                </span>
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 shrink-0" /> {request.hospital_address}, {request.locality}, {request.city}, {request.state}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Posted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 min-w-[200px]">
            <div className="text-center w-full bg-secondary/50 rounded-xl p-3">
              <p className="text-sm text-muted-foreground mb-1 font-medium">Units Required</p>
              <p className="text-3xl font-black">{request.units_required}</p>
            </div>

            {profile?.role === 'donor' && !isCreator && (
              <div className="w-full">
                {hasAccepted ? (
                  <Link href={`/requests/${params.id}/verify`} className="block w-full">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 shadow-md">
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Verify Donation
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={handleAcceptRequest} 
                    disabled={accepting || request.status === 'Completed' || request.status === 'Cancelled'}
                    className={`w-full rounded-xl h-12 font-bold shadow-lg ${
                      isEmergency ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30 animate-bounce' : ''
                    }`}
                  >
                    {accepting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <HeartHandshake className="w-5 h-5 mr-2" />}
                    Accept Request
                  </Button>
                )}
              </div>
            )}
            {isCreator && (request.status === 'In Progress' || request.status === 'Accepted' || hasAnyAcceptedDonor) && (
              <div className="w-full">
                <Link href={`/requests/${params.id}/verify`} className="block w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 shadow-lg animate-pulse">
                    <ShieldCheck className="w-5 h-5 mr-2" /> Verify Donation
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          
          {/* Patient Details */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Patient Details</h3>
            <Card className="p-6 border-none shadow-md bg-white/50 dark:bg-card/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-semibold">{request.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Age</p>
                  <p className="font-semibold">{request.patient_age} Years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gender</p>
                  <p className="font-semibold">{request.patient_gender}</p>
                </div>
              </div>
              {request.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Additional Notes / Instructions</p>
                  <p className="text-sm leading-relaxed">{request.notes}</p>
                </div>
              )}
            </Card>
          </section>

          {/* Accepted Donors Section for Creator */}
          {isCreator && acceptedDonors.length > 0 && (
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-green-500" /> Accepted Donors</h3>
              <div className="space-y-4">
                {acceptedDonors.map((donor) => (
                  <Card key={donor.id} className="p-5 border border-green-500/20 shadow-lg shadow-green-500/5 bg-gradient-to-r from-green-50/50 to-white dark:from-green-950/10 dark:to-card overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <CheckCircle2 className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex flex-col items-center justify-center font-black">
                          {donor.blood_group}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            {donor.full_name}
                          </h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" /> {donor.locality ? `${donor.locality}, ` : ''}{donor.city} • Accepted {formatDistanceToNow(new Date(donor.accepted_at), { addSuffix: true })}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {donor.is_verified && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                            {donor.is_trusted && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded flex items-center gap-1">
                                <Award className="w-3 h-3" /> Trusted Donor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                      <a href={`tel:${donor.phone}`} className="w-full">
                        <Button variant="secondary" className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30">
                          <Phone className="w-4 h-4 mr-2" /> Call Donor
                        </Button>
                      </a>
                      <a href={`https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="secondary" className="w-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/30">
                          <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Matches Section for Creator */}
          {isCreator && matches.length > 0 && acceptedDonors.length === 0 && (
            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Droplet className="w-5 h-5 text-primary" /> Recommended Donors</h3>
              <div className="space-y-3">
                {matches.map((match) => {
                  const isExact = match.blood_group === request.blood_group;
                  return (
                    <Card key={match.id} className="p-4 border-none shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                          isExact ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                        }`}>
                          {match.blood_group}
                        </div>
                        <div>
                          <p className="font-semibold">{match.full_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {match.locality ? `${match.locality}, ` : ''}{match.city}
                            {isExact && <span className="ml-2 text-red-500 font-medium">• Exact Match</span>}
                          </p>
                        </div>
                      </div>
                      <Link href={`/donors/${match.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full">View Profile</Button>
                      </Link>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

        </div>

        <div className="space-y-8">
          {/* Contact Details */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Contact Person</h3>
            <Card className="p-6 border-none shadow-md bg-secondary/50 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg mb-1">{request.contact_name}</h4>
              <p className="text-muted-foreground text-sm mb-6">Primary Contact</p>
              
              <div className="space-y-3">
                <a href={`tel:${request.contact_number}`}>
                  <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">
                    <Phone className="w-4 h-4 mr-2" /> Call {request.contact_number}
                  </Button>
                </a>
                {request.alternate_contact && (
                  <a href={`tel:${request.alternate_contact}`}>
                    <Button variant="outline" className="w-full rounded-xl">
                      <Phone className="w-4 h-4 mr-2" /> Alternate: {request.alternate_contact}
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          </section>

        </div>
      </div>

      {/* Mobile Sticky Action Bar for Emergencies */}
      {isEmergency && !isCreator && !hasAccepted && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-t shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-40">
          <Button 
            onClick={handleAcceptRequest} 
            disabled={accepting || request.status === 'Completed' || request.status === 'Cancelled'}
            className="w-full rounded-xl h-14 font-bold shadow-lg bg-red-600 hover:bg-red-700 text-white shadow-red-500/30 animate-pulse text-lg"
          >
            {accepting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <HeartHandshake className="w-6 h-6 mr-2" />}
            Accept Emergency Request
          </Button>
        </div>
      )}

    </div>
  )
}
