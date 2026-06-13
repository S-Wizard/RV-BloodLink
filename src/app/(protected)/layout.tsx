"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, User, Settings, Droplet, LogOut, Users, Search, Activity } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Notifications } from "@/components/Notifications"
import { ProfileDropdown } from "@/components/ProfileDropdown"
import { AchievementToast } from "@/components/AchievementToast"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Donors", href: "/donors", icon: Users },
    { name: "Search", href: "/search", icon: Search },
    { name: "Blood Requests", href: "/requests", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-white dark:bg-card px-4 py-8">
        <div className="flex items-center justify-between mb-12 px-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl">
              <Droplet className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl">RV-BloodLink</span>
          </Link>
          <div className="flex items-center gap-3">
            <Notifications />
            <ProfileDropdown />
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-red-50 text-primary font-semibold dark:bg-red-950/30" 
                    : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-card/50"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30 transition-all mt-auto"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-white dark:bg-card sticky top-0 z-10">
          <Link href="/" className="flex items-center gap-2">
            <Droplet className="text-primary w-5 h-5 fill-primary" />
            <span className="font-bold text-lg">RV-BloodLink</span>
          </Link>
          <div className="flex items-center gap-3">
            <Notifications />
            <ProfileDropdown />
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex-1">
          {children}
        </div>

        {/* Global Footer */}
        <footer className="w-full text-center py-6 text-sm text-muted-foreground mt-auto border-t border-border/50 bg-white/30 dark:bg-card/10">
          <p>Made with ❤️ to help save lives through blood donation.</p>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-card border-t border-border flex justify-around p-3 z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <AchievementToast />
    </div>
  )
}
