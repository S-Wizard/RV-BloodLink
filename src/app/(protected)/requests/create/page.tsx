"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Loader2, AlertTriangle, Droplet, MapPin } from "lucide-react"
import { LocalitySelector } from "@/components/LocalitySelector"

export default function CreateRequestPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    blood_group: "",
    units_required: "1",
    patient_name: "",
    patient_age: "",
    patient_gender: "",
    hospital_name: "",
    hospital_address: "",
    locality: "",
    city: "Bengaluru",
    state: "Karnataka",
    contact_name: "",
    contact_number: "",
    alternate_contact: "",
    priority: "Normal",
    notes: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleNext = () => {
    setError(null)
    if (step === 1 && (!formData.blood_group || !formData.units_required)) {
      return setError("Please fill all required fields")
    }
    if (step === 2 && (!formData.patient_name || !formData.patient_age || !formData.patient_gender)) {
      return setError("Please fill all patient details")
    }
    if (step === 3 && (!formData.hospital_name || !formData.hospital_address || !formData.locality)) {
      return setError("Please fill all hospital details and select locality")
    }
    if (step === 4 && (!formData.contact_name || !formData.contact_number)) {
      return setError("Please fill primary contact details")
    }
    setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to create a request")

      const { data, error: insertError } = await supabase.from('blood_requests').insert({
        created_by: user.id,
        blood_group: formData.blood_group,
        units_required: parseInt(formData.units_required),
        patient_name: formData.patient_name,
        patient_age: parseInt(formData.patient_age),
        patient_gender: formData.patient_gender,
        hospital_name: formData.hospital_name,
        hospital_address: formData.hospital_address,
        locality: formData.locality,
        city: formData.city,
        state: formData.state,
        contact_name: formData.contact_name,
        contact_number: formData.contact_number,
        alternate_contact: formData.alternate_contact,
        priority: formData.priority,
        notes: formData.notes,
        status: "Pending"
      }).select().single()

      if (insertError) throw insertError

      router.push(`/requests/${data.id}`)
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the request")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { title: "Blood Requirement", desc: "What blood group is needed?" },
    { title: "Patient Details", desc: "Who is receiving the blood?" },
    { title: "Hospital Info", desc: "Where should the donor go?" },
    { title: "Contact Info", desc: "How can donors reach you?" },
    { title: "Emergency Details", desc: "How urgent is this request?" },
    { title: "Review", desc: "Confirm the details" }
  ]

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Blood Request</h1>
        <p className="text-muted-foreground mt-1">Submit a request to notify nearby compatible donors.</p>
      </div>

      <Card className="w-full p-6 md:p-8 border-none shadow-xl bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2rem]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-xl">
              <Droplet className="text-primary w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">{steps[step - 1].title}</h2>
              <p className="text-sm text-muted-foreground">{steps[step - 1].desc}</p>
            </div>
          </div>
          <div className="text-sm font-medium text-muted-foreground bg-gray-100 dark:bg-card px-3 py-1 rounded-full">
            Step {step} of 6
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-secondary mb-8 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-xl font-medium border border-destructive/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Requirement */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base">Required Blood Group</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {bloodGroups.map((bg) => (
                        <div 
                          key={bg}
                          onClick={() => setFormData(prev => ({ ...prev, blood_group: bg }))}
                          className={`p-4 rounded-xl border-2 text-center font-bold text-lg cursor-pointer transition-all ${formData.blood_group === bg ? "border-primary bg-primary text-white shadow-lg shadow-red-500/30 scale-105" : "border-border hover:border-primary/50 bg-background"}`}
                        >
                          {bg}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>Number of Units Required</Label>
                    <Input name="units_required" type="number" min="1" value={formData.units_required} onChange={handleChange} className="h-12 rounded-xl text-lg font-bold" />
                  </div>
                </div>
              )}

              {/* Step 2: Patient */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Patient Full Name</Label>
                    <Input name="patient_name" value={formData.patient_name} onChange={handleChange} className="h-12 rounded-xl" placeholder="e.g. John Doe" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input name="patient_age" type="number" min="0" value={formData.patient_age} onChange={handleChange} className="h-12 rounded-xl" placeholder="e.g. 45" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <select 
                        name="patient_gender" 
                        value={formData.patient_gender} 
                        onChange={handleChange}
                        className="w-full h-12 px-3 rounded-xl border border-input bg-background"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Hospital */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hospital Name</Label>
                    <Input name="hospital_name" value={formData.hospital_name} onChange={handleChange} className="h-12 rounded-xl" placeholder="e.g. City General Hospital" />
                  </div>
                  <div className="space-y-2">
                    <Label>Complete Hospital Address</Label>
                    <Input name="hospital_address" value={formData.hospital_address} onChange={handleChange} className="h-12 rounded-xl" placeholder="Street name, ward/room number" />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Hospital Locality / Area</Label>
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
                </div>
              )}

              {/* Step 4: Contact */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Contact Person Name</Label>
                    <Input name="contact_name" value={formData.contact_name} onChange={handleChange} className="h-12 rounded-xl" placeholder="Who should donors contact?" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Phone Number</Label>
                    <Input name="contact_number" value={formData.contact_number} onChange={handleChange} className="h-12 rounded-xl" placeholder="+1 234 567 8900" />
                  </div>
                  <div className="space-y-2">
                    <Label>Alternate Phone Number <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input name="alternate_contact" value={formData.alternate_contact} onChange={handleChange} className="h-12 rounded-xl" placeholder="+1 098 765 4321" />
                  </div>
                </div>
              )}

              {/* Step 5: Emergency Details */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base">Priority Level</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { level: "Normal", color: "border-blue-200 hover:border-blue-500", bg: "bg-blue-50 text-blue-700" },
                        { level: "Urgent", color: "border-orange-200 hover:border-orange-500", bg: "bg-orange-50 text-orange-700" },
                        { level: "Critical", color: "border-red-200 hover:border-red-500", bg: "bg-red-50 text-red-700 font-bold" }
                      ].map((p) => (
                        <div 
                          key={p.level}
                          onClick={() => setFormData(prev => ({ ...prev, priority: p.level }))}
                          className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                            formData.priority === p.level 
                              ? `border-opacity-100 shadow-md ${p.bg}` 
                              : `border-border ${p.color} bg-background`
                          }`}
                        >
                          {p.level}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label>Additional Information / Notes <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <textarea 
                      name="notes" 
                      value={formData.notes} 
                      onChange={handleChange} 
                      className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background resize-y" 
                      placeholder="Any specific requirements, exact ward numbers, or instructions for the donor." 
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Review */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border-2 ${
                    formData.priority === 'Critical' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50' : 
                    formData.priority === 'Urgent' ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/50' : 
                    'bg-secondary border-transparent'
                  }`}>
                    
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Requirement</p>
                        <h3 className="text-3xl font-black text-primary">{formData.blood_group}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Units</p>
                        <h3 className="text-3xl font-black">{formData.units_required}</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Patient</span>
                        <span className="font-semibold text-sm text-right">{formData.patient_name} ({formData.patient_age}, {formData.patient_gender})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Hospital</span>
                        <span className="font-semibold text-sm text-right max-w-[200px]">{formData.hospital_name}<br/>{formData.locality}, {formData.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Contact</span>
                        <span className="font-semibold text-sm text-right">{formData.contact_name}<br/>{formData.contact_number}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border/50">
                        <span className="text-muted-foreground text-sm font-medium mt-1">Priority</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          formData.priority === 'Critical' ? 'bg-red-100 text-red-700' : 
                          formData.priority === 'Urgent' ? 'bg-orange-100 text-orange-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {formData.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    By submitting this request, nearby donors with compatible blood types will be instantly notified.
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack} className="rounded-full px-6" disabled={loading}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : (
            <div></div> // Spacer
          )}

          {step < 6 ? (
            <Button onClick={handleNext} className="rounded-full px-8 shadow-md">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="rounded-full px-8 shadow-md shadow-red-500/20 hover:scale-105 transition-transform">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post Request
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
