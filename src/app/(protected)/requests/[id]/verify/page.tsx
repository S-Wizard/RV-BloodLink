"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Loader2, QrCode, Scan, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { Html5QrcodeScanner } from "html5-qrcode"

export default function VerificationPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'requester' | 'donor' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Verification status
  const [requesterConfirmed, setRequesterConfirmed] = useState(false)
  const [donorConfirmed, setDonorConfirmed] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<string>("pending")
  const [updating, setUpdating] = useState(false)

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Get request details
      const { data: req } = await supabase.from('blood_requests').select('*').eq('id', params.id).single()
      if (!req) return

      if (req.created_by === user.id) {
        setRole('requester')
      } else {
        // Check if user is the accepted donor
        const { data: resp } = await supabase.from('request_responses')
          .select('*')
          .eq('request_id', params.id)
          .eq('donor_id', user.id)
          .eq('status', 'Accepted')
          .maybeSingle()
        if (resp) setRole('donor')
      }

      // Load existing verification
      const { data: verif } = await supabase.from('donation_verifications').select('*').eq('request_id', params.id).maybeSingle()
      if (verif) {
        setRequesterConfirmed(verif.requester_confirmed)
        setDonorConfirmed(verif.donor_confirmed)
        setVerificationStatus(verif.verification_status)
      }

      setLoading(false)
    }
    loadData()

    // Realtime updates
    const channel = supabase.channel(`verification_${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_verifications', filter: `request_id=eq.${params.id}` }, (payload) => {
        const newVerif = payload.new as any
        if (newVerif) {
          setRequesterConfirmed(newVerif.requester_confirmed)
          setDonorConfirmed(newVerif.donor_confirmed)
          setVerificationStatus(newVerif.verification_status)
          
          if (newVerif.verification_status === 'verified') {
            checkAndAwardAchievements(newVerif.donor_id)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Initialize QR Scanner for Requester
  useEffect(() => {
    if (role === 'requester' && verificationStatus === 'pending' && !requesterConfirmed) {
      // Delay initialization to ensure DOM is ready
      const timer = setTimeout(() => {
        if (!document.getElementById("qr-reader")) return
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          /* verbose= */ false
        )
        scannerRef.current.render(onScanSuccess, onScanFailure)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [role, verificationStatus, requesterConfirmed])

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear()
    }
    try {
      const data = JSON.parse(decodedText)
      if (data.request_id === params.id && data.action === 'verify_donation') {
        await handleConfirm('requester')
      } else {
        alert("Invalid QR Code for this request.")
      }
    } catch (e) {
      alert("Invalid QR format.")
    }
  }

  const onScanFailure = (error: any) => {
    // ignore background scan errors
  }

  const handleConfirm = async (actor: 'requester' | 'donor') => {
    setUpdating(true)
    
    // Check if record exists
    const { data: existing } = await supabase.from('donation_verifications').select('*').eq('request_id', params.id).maybeSingle()
    
    let isBothConfirmed = false

    if (existing) {
      const updates: any = {}
      if (actor === 'requester') updates.requester_confirmed = true
      if (actor === 'donor') updates.donor_confirmed = true
      
      isBothConfirmed = (actor === 'requester' ? true : existing.requester_confirmed) && 
                        (actor === 'donor' ? true : existing.donor_confirmed)
      
      if (isBothConfirmed) updates.verification_status = 'verified'
      
      await supabase.from('donation_verifications').update(updates).eq('id', existing.id)
    } else {
      // Need donor_id to insert. If actor is donor, userId is donor_id.
      // If actor is requester, we need to fetch the accepted donor_id.
      let donorId = userId
      if (actor === 'requester') {
        const { data: resp } = await supabase.from('request_responses').select('donor_id').eq('request_id', params.id).eq('status', 'Accepted').single()
        donorId = resp?.donor_id
      }
      
      if (donorId) {
        await supabase.from('donation_verifications').insert({
          request_id: params.id,
          donor_id: donorId,
          requester_confirmed: actor === 'requester',
          donor_confirmed: actor === 'donor'
        })
      }
    }

    // If verified, update request status and users stats
    if (isBothConfirmed) {
      await supabase.from('blood_requests').update({ status: 'Completed' }).eq('id', params.id)
      
      // Update donor stats (donation_count++)
      // Find donor_id
      const { data: dVerif } = await supabase.from('donation_verifications').select('donor_id').eq('request_id', params.id).single()
      if (dVerif) {
        const { data: donorData } = await supabase.from('users').select('donation_count').eq('id', dVerif.donor_id).single()
        await supabase.from('users').update({ 
          donation_count: (donorData?.donation_count || 0) + 1,
          last_donation_date: new Date().toISOString()
        }).eq('id', dVerif.donor_id)
        
        // Notification
        await supabase.from('notifications').insert({
          user_id: dVerif.donor_id,
          title: "Donation Verified!",
          message: "Thank you for saving a life. Your donation has been verified.",
          link: "/dashboard/donor"
        })
      }
    }
    
    setUpdating(false)
  }

  const checkAndAwardAchievements = async (donorId: string) => {
    // Done server-side or via triggers ideally, but simulating here for the frontend MVP
    const { data: donor } = await supabase.from('users').select('donation_count').eq('id', donorId).single()
    const count = donor?.donation_count || 0
    
    const achievementsToAward = []
    if (count === 1) achievementsToAward.push('First Donation')
    if (count === 5) achievementsToAward.push('5 Donations')
    if (count >= 1) achievementsToAward.push('Trusted Donor') // Simple logic for trusted donor

    for (const badge of achievementsToAward) {
      try {
        await supabase.from('achievements').insert({
          user_id: donorId,
          achievement_name: badge
        })
      } catch (e) {
        console.log('Achievement likely exists', e)
      }
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!role) return <div className="text-center py-20">You are not authorized to view this page.</div>

  const isVerified = verificationStatus === 'verified'

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <Link href={`/requests/${params.id}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Request Details
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Donation Verification</h1>
        <p className="text-muted-foreground">Secure 2-way confirmation system</p>
      </div>

      {isVerified ? (
        <Card className="p-8 border-none shadow-xl bg-green-50 dark:bg-green-950/20 text-center space-y-6">
          <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30 animate-in zoom-in duration-500">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Successfully Verified</h2>
            <p className="text-green-600/80 dark:text-green-500 mt-2">This donation is complete and recorded.</p>
          </div>
          <Button onClick={() => router.push(role === 'donor' ? '/dashboard/donor' : '/dashboard/seeker')} className="w-full rounded-xl bg-green-600 hover:bg-green-700">
            Return to Dashboard
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-md space-y-6 bg-white dark:bg-card">
            
            {role === 'donor' && (
              <div className="text-center space-y-6">
                <div className="bg-primary/5 text-primary p-4 rounded-xl flex items-center gap-3 text-left">
                  <QrCode className="w-8 h-8 shrink-0" />
                  <p className="text-sm font-medium">Show this QR code to the patient or their contact person to verify your donation.</p>
                </div>
                
                <div className="bg-white p-6 rounded-3xl inline-block shadow-sm border border-border">
                  <QRCodeSVG 
                    value={JSON.stringify({ request_id: params.id, donor_id: userId, action: 'verify_donation' })} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4">Or confirm manually if scanner is unavailable:</p>
                  <Button 
                    onClick={() => handleConfirm('donor')} 
                    disabled={donorConfirmed || updating}
                    className={`w-full rounded-xl h-12 font-bold ${donorConfirmed ? 'bg-green-600 text-white' : ''}`}
                    variant={donorConfirmed ? 'default' : 'outline'}
                  >
                    {donorConfirmed ? <><CheckCircle2 className="w-5 h-5 mr-2" /> You Confirmed</> : 'I Have Donated Blood'}
                  </Button>
                </div>
              </div>
            )}

            {role === 'requester' && (
              <div className="text-center space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl flex items-center gap-3 text-left">
                  <Scan className="w-8 h-8 shrink-0" />
                  <p className="text-sm font-medium">Scan the Donor's QR code to securely verify this donation.</p>
                </div>
                
                {!requesterConfirmed && (
                  <div className="overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 p-2 bg-black/5">
                    <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border-none"></div>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4">Or confirm manually if unable to scan:</p>
                  <Button 
                    onClick={() => handleConfirm('requester')} 
                    disabled={requesterConfirmed || updating}
                    className={`w-full rounded-xl h-12 font-bold ${requesterConfirmed ? 'bg-green-600 text-white' : ''}`}
                    variant={requesterConfirmed ? 'default' : 'outline'}
                  >
                    {requesterConfirmed ? <><CheckCircle2 className="w-5 h-5 mr-2" /> You Confirmed</> : 'Donor Has Given Blood'}
                  </Button>
                </div>
              </div>
            )}

          </Card>

          {/* Status Tracker */}
          <Card className="p-6 border-none shadow-md bg-secondary/50">
            <h3 className="font-bold mb-4">Verification Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${requesterConfirmed ? 'bg-green-500 text-white' : 'bg-background border-2 border-muted'}`}>
                    {requesterConfirmed && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <span className="font-medium text-sm">Requester Confirmation</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{requesterConfirmed ? 'Done' : 'Waiting'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${donorConfirmed ? 'bg-green-500 text-white' : 'bg-background border-2 border-muted'}`}>
                    {donorConfirmed && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <span className="font-medium text-sm">Donor Confirmation</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{donorConfirmed ? 'Done' : 'Waiting'}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
