"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const router = useRouter()
  
  const [resending, setResending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const supabase = createClient()

  const checkStatus = async () => {
    setChecking(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.push("/dashboard")
    } else {
      setMessage({ type: "info", text: "We're still waiting for verification. Check your inbox!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    }
    setChecking(false)
  }

  // Auto-check periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        clearInterval(interval)
        router.push("/dashboard")
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [router, supabase])

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setMessage({ type: "", text: "" })
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Verification email resent successfully!" })
    }
    setResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-white dark:from-background dark:to-red-950/20">
      <Card className="w-full max-w-md p-8 border-none shadow-2xl bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2rem] text-center relative overflow-hidden">
        
        {/* Background Decorative Rings */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full border-[20px] border-primary/5 opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full border-[20px] border-primary/5 opacity-50 pointer-events-none" />

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-12 shadow-inner"
        >
          <Mail className="w-12 h-12 -rotate-12" />
        </motion.div>

        <h1 className="text-3xl font-black mb-3">Confirm Your Email</h1>
        
        <p className="text-muted-foreground mb-2">
          We've sent a secure verification link to:
        </p>
        <p className="font-bold text-lg mb-8 text-foreground break-all px-4 py-2 bg-secondary/50 rounded-xl inline-block">
          {email || "your email address"}
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          Please click the link in that email to verify your account and gain access to RV-BloodLink.
        </p>

        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-sm font-medium mb-6 flex items-center justify-center gap-2 ${
              message.type === 'error' ? 'bg-red-50 text-red-600' : 
              message.type === 'success' ? 'bg-green-50 text-green-600' : 
              'bg-blue-50 text-blue-600'
            }`}
          >
            {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {message.type === 'info' && <RefreshCw className="w-4 h-4 animate-spin" />}
            {message.text}
          </motion.div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={checkStatus} 
            disabled={checking}
            className="w-full rounded-xl h-12 font-bold shadow-lg shadow-red-500/20"
          >
            {checking ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
            I have verified my email
          </Button>

          <Button 
            variant="outline" 
            onClick={handleResend} 
            disabled={resending || !email}
            className="w-full rounded-xl h-12"
          >
            {resending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
            Resend Verification Email
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <Link href="/register">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground w-full">
              Change Email Address <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  )
}
