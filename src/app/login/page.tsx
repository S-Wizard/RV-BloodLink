"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Droplet, Loader2 } from "lucide-react"
import Link from "next/link"

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("email not confirmed")) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        setError(err.message || "Invalid login credentials")
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-white dark:from-background dark:to-red-950/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 border-none shadow-2xl bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2rem]">
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="bg-primary p-3 rounded-2xl shadow-lg shadow-red-500/20 mb-4 inline-block">
              <Droplet className="text-white w-8 h-8" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-xl font-medium border border-destructive/20 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email"
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="john@example.com" 
                required
                className="h-12 rounded-xl" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</Link>
              </div>
              <Input 
                id="password"
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                required
                className="h-12 rounded-xl" 
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-md font-bold shadow-md hover:shadow-lg transition-all mt-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleAuth} className="w-full h-12 rounded-xl font-medium border-2 hover:bg-secondary/50">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account? <Link href="/register" className="text-primary font-medium hover:underline">Sign up for free</Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
