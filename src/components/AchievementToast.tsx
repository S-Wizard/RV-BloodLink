"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Trophy, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import confetti from "canvas-confetti"

type Achievement = {
  id: string
  achievement_name: string
}

export function AchievementToast() {
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let channel: any

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase.channel(`achievements_${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'achievements', filter: `user_id=eq.${user.id}` }, (payload) => {
          const achievement = payload.new as Achievement
          triggerCelebration(achievement)
        })
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerCelebration = (achievement: Achievement) => {
    setActiveAchievement(achievement)

    // Fire confetti
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ef4444', '#3b82f6', '#10b981'] // Red, Blue, Green
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ef4444', '#3b82f6', '#10b981']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()

    // Auto-hide toast
    setTimeout(() => {
      setActiveAchievement(null)
    }, 5000)
  }

  return (
    <AnimatePresence>
      {activeAchievement && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
        >
          <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 p-1 rounded-2xl shadow-2xl">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-start gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Trophy className="w-24 h-24 text-yellow-500" />
              </div>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full shrink-0 z-10">
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              
              <div className="z-10 flex-1 pr-6">
                <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider mb-0.5">Achievement Unlocked!</p>
                <h4 className="text-lg font-black leading-tight text-foreground">{activeAchievement.achievement_name}</h4>
              </div>

              <button 
                onClick={() => setActiveAchievement(null)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
