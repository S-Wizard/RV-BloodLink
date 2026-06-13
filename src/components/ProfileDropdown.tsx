"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { User, Settings, LogOut, Clock } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors border-2 border-primary/20 shadow-sm"
      >
        <User className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/50 shadow-2xl bg-white/80 dark:bg-card/80 backdrop-blur-xl overflow-hidden z-50"
          >
            <div className="p-2 space-y-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4 text-primary" /> View Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-sm font-medium transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" /> Settings
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-sm font-medium transition-colors"
              >
              </Link>

              <div className="h-px bg-border/50 my-1 mx-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30 text-sm font-medium transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-destructive" /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
