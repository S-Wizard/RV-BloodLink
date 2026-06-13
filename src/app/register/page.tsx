"use client"

import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Droplet, ArrowRight, ArrowLeft, Loader2, Heart, Activity, MapPin } from "lucide-react"
import { LocalitySelector } from "@/components/LocalitySelector"
import Link from "next/link"
import { createUserRecord } from "@/app/actions/register"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") || "donor"
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: defaultRole,
    bloodGroup: "",
    phone: "",
    gender: "",
    locality: "",
    city: "Bengaluru",
    state: "Karnataka",
    age: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRoleSelect = (role: "donor" | "seeker") => {
    setFormData(prev => ({ ...prev, role }))
  }

  const handleBloodGroupSelect = (bg: string) => {
    setFormData(prev => ({ ...prev, bloodGroup: bg }))
  }

  const handleNext = () => {
    setError(null)
    if (step === 1 && (!formData.fullName || !formData.email || !formData.password)) {
      return setError("Please fill all fields")
    }
    if (step === 2 && !formData.role) {
      return setError("Please select a role")
    }
    if (step === 3 && !formData.bloodGroup) {
      return setError("Please select your blood group")
    }
    if (step === 4 && (!formData.phone || !formData.gender || !formData.age)) {
      return setError("Please fill all demographics")
    }
    if (step === 5 && !formData.locality) {
      return setError("Please select your locality")
    }
    setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Insert into public.users using server action to bypass RLS when session is null
        const result = await createUserRecord({
          id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          role: formData.role,
          blood_group: formData.bloodGroup,
          phone: formData.phone,
          gender: formData.gender,
          age: parseInt(formData.age),
          locality: formData.locality,
          city: formData.city,
          state: formData.state,
          availability: true
        })

        if (result.error) throw new Error(result.error)

        // Redirect to dashboard or verify-email
        if (!authData.session) {
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }

  const steps = [
    { title: "Account Details", desc: "Start your journey" },
    { title: "Select Role", desc: "How will you participate?" },
    { title: "Blood Group", desc: "Crucial for matching" },
    { title: "Demographics", desc: "A bit about you" },
    { title: "Location", desc: "To find nearby matches" },
    { title: "Review", desc: "Confirm your details" }
  ]

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-white dark:from-background dark:to-red-950/20">
      <Card className="w-full max-w-xl p-8 border-none shadow-2xl bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2rem]">
        
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl">
              <Droplet className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl">RV-BloodLink</span>
          </Link>
          <div className="text-sm font-medium text-muted-foreground">
            Step {step} of 6
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{steps[step - 1].title}</h2>
          <p className="text-muted-foreground">{steps[step - 1].desc}</p>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-secondary mt-4 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 6) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-xl font-medium border border-destructive/20">
            {error}
          </div>
        )}

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Account */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="h-12 rounded-xl" />
                  </div>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button type="button" variant="outline" onClick={handleGoogleAuth} className="w-full h-12 rounded-xl font-medium">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                </div>
              )}

              {/* Step 2: Role */}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleRoleSelect("donor")}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${formData.role === "donor" ? "border-primary bg-red-50 dark:bg-red-950/30" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                      <Heart className="text-primary w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Blood Donor</h3>
                    <p className="text-sm text-muted-foreground">I want to donate blood and save lives.</p>
                  </div>
                  <div 
                    onClick={() => handleRoleSelect("seeker")}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${formData.role === "seeker" ? "border-primary bg-red-50 dark:bg-red-950/30" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                      <Activity className="text-blue-600 w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Blood Seeker</h3>
                    <p className="text-sm text-muted-foreground">I am looking for blood donors.</p>
                  </div>
                </div>
              )}

              {/* Step 3: Blood Group */}
              {step === 3 && (
                <div className="grid grid-cols-4 gap-3">
                  {bloodGroups.map((bg) => (
                    <div 
                      key={bg}
                      onClick={() => handleBloodGroupSelect(bg)}
                      className={`p-4 rounded-xl border-2 text-center font-bold text-lg cursor-pointer transition-all ${formData.bloodGroup === bg ? "border-primary bg-primary text-white shadow-lg shadow-red-500/30" : "border-border hover:border-primary/50"}`}
                    >
                      {bg}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 4: Demographics */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" className="h-12 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleChange}
                        className="w-full h-12 px-3 rounded-xl border border-input bg-background"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input name="age" type="number" min="18" value={formData.age} onChange={handleChange} placeholder="18+" className="h-12 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Location */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Locality / Area</Label>
                    <LocalitySelector 
                      value={formData.locality} 
                      onChange={(val) => setFormData(prev => ({ ...prev, locality: val }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 opacity-70">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input name="city" value={formData.city} readOnly className="h-12 rounded-xl bg-secondary/50 cursor-not-allowed font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input name="state" value={formData.state} readOnly className="h-12 rounded-xl bg-secondary/50 cursor-not-allowed font-medium" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1.5 bg-secondary/30 p-3 rounded-lg">
                    <MapPin className="w-4 h-4 shrink-0" />
                    RV-BloodLink currently serves Bengaluru, Karnataka.
                  </p>
                </div>
              )}

              {/* Step 6: Review */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="bg-secondary p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium capitalize">{formData.role}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Blood Group</span>
                      <span className="font-medium text-primary font-bold">{formData.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-right">{formData.locality}, {formData.city}, {formData.state}</span>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack} className="rounded-full px-6" disabled={loading}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : (
            <div></div> // Spacer
          )}

          {step < 6 ? (
            <Button onClick={handleNext} className="rounded-full px-8 shadow-md">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="rounded-full px-8 shadow-md">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Complete Registration
            </Button>
          )}
        </div>
        
        {step === 1 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        )}
      </Card>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
