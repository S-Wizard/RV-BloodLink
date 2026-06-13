"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Moon, Sun, Shield, LogOut, Info, Mail, Code } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export default function SettingsPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    // Check local storage or system preference for dark mode
    if (document.documentElement.classList.contains('dark')) {
      setDarkMode(true)
    }
  }, [])

  const toggleDarkMode = () => {
    const isDark = !darkMode
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your app preferences and account settings.</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 border-none shadow-md">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" /> Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Adjust the appearance of the application.</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${darkMode ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" /> Notifications
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive alerts for urgent blood requests.</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${notifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${notifications ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" /> Account Security
          </h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start h-12 rounded-xl">
              Change Password
            </Button>
            <Button variant="destructive" className="w-full justify-start h-12 rounded-xl bg-red-50 text-destructive hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50">
              Delete Account
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-md border-t-4 border-t-destructive">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Sign Out</p>
              <p className="text-sm text-muted-foreground">Log out of your current session.</p>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="rounded-full">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </Button>
          </div>
        </Card>

        {/* Developer Information Section */}
        <Card className="p-6 md:p-8 border-none shadow-xl bg-gradient-to-br from-red-50 to-white dark:from-card dark:to-red-950/10 overflow-hidden relative">
          {/* Decorative Background Icon */}
          <Code className="absolute -right-10 -bottom-10 w-48 h-48 text-primary/5 -rotate-12 pointer-events-none" />

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Info className="w-6 h-6 text-primary" /> About RV-BloodLink
          </h2>

          <div className="space-y-6 relative z-10">
            <div className="bg-white/60 dark:bg-black/20 p-5 rounded-2xl backdrop-blur-sm border border-border/50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">RV-BloodLink</h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">Version 1.0.0</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A real-time blood donor and blood request platform designed to connect donors and recipients quickly and efficiently.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-black/20 p-5 rounded-2xl backdrop-blur-sm border border-border/50">
              <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4 tracking-wider">Developer Details</h3>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-white text-2xl font-bold">SS</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-xl">Sudhakar S</h4>
                  <p className="text-sm font-medium text-primary">Developer</p>
                  <p className="text-sm text-muted-foreground">CSE Student</p>
                  <p className="text-sm text-muted-foreground">RV College of Engineering</p>

                  <div className="flex gap-3 pt-3">
                    <a href="mailto:sudhakars3492@gmail.com" className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-primary hover:bg-primary hover:text-white transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                    <a href="https://www.linkedin.com/in/sudhakar117/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                      <LinkedinIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
