"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Save, CheckCircle2, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { LocalitySelector } from "@/components/LocalitySelector"

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  
  const [formData, setFormData] = useState({
    email: "",
    role: "donor", // Default for new users
    full_name: "",
    blood_group: "",
    phone: "",
    gender: "",
    age: "",
    locality: "",
    city: "Bengaluru",
    state: "Karnataka",
  })

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()
          
        if (data) {
          setFormData({
            email: data.email || user.email || "",
            role: data.role || "donor",
            full_name: data.full_name || "",
            blood_group: data.blood_group || "",
            phone: data.phone || "",
            gender: data.gender || "",
            age: data.age?.toString() || "",
            locality: data.locality || "",
            city: data.city || "Bengaluru",
            state: data.state || "Karnataka",
          })
          setIsNewUser(false)
        } else {
          // User exists in auth but not in public.users (Google Auth case)
          setIsNewUser(true)
          setFormData(prev => ({
            ...prev,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || "",
          }))
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Upsert inserts a new row if it doesn't exist (using the ID), or updates it if it does
      const { error } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          email: formData.email,
          role: formData.role,
          full_name: formData.full_name,
          blood_group: formData.blood_group,
          phone: formData.phone,
          gender: formData.gender,
          age: parseInt(formData.age),
          locality: formData.locality,
          city: formData.city,
          state: formData.state,
          // Only set availability if it's a new row, otherwise let it keep existing value. 
          // Supabase upsert will overwrite unless we're careful, but for MVP it's okay to just push these fields.
          ...(isNewUser ? { availability: true } : {})
        })
        
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        if (isNewUser) {
          // If they were new and just completed profile, redirect them to dashboard to break the loop!
          router.push("/dashboard")
          router.refresh()
        }
      }
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNewUser ? "Complete Your Profile" : "Profile Management"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isNewUser 
            ? "Welcome! Since you logged in with Google, we just need a few more details to set up your account." 
            : "Update your personal information and contact details."}
        </p>
      </div>

      <Card className="p-6 md:p-8 border-none shadow-xl bg-white/80 dark:bg-card/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl font-medium border border-destructive/20">
              {error}
            </div>
          )}

          {success && !isNewUser && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-xl font-medium border border-green-200 dark:border-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Profile updated successfully
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input name="full_name" value={formData.full_name} onChange={handleChange} className="h-12 rounded-xl" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="h-12 rounded-xl bg-gray-50 dark:bg-card/50" />
            </div>
          </div>

          {isNewUser && (
            <div className="space-y-2">
              <Label>Account Role</Label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="w-full h-12 px-3 rounded-xl border border-primary/50 bg-red-50 dark:bg-red-950/20 text-primary font-semibold shadow-sm"
                required
              >
                <option value="donor">Blood Donor (I want to donate blood)</option>
                <option value="seeker">Blood Seeker (I am looking for blood)</option>
              </select>
              <p className="text-xs text-muted-foreground">Select your primary role in the community.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <select 
                name="blood_group" 
                value={formData.blood_group} 
                onChange={handleChange}
                className="w-full h-12 px-3 rounded-xl border border-input bg-background"
                required
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} className="h-12 rounded-xl" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Gender</Label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange}
                className="w-full h-12 px-3 rounded-xl border border-input bg-background"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input name="age" type="number" min="18" value={formData.age} onChange={handleChange} className="h-12 rounded-xl" required />
            </div>
          </div>

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
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={saving} className="rounded-full px-8 shadow-md">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isNewUser ? "Complete Registration" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
