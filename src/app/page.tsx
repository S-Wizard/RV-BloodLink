"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Droplet, Heart, Activity, Users, ArrowRight, ShieldCheck, Clock, MapPin, Search, PhoneCall } from "lucide-react"
import Link from "next/link"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/80 to-white dark:from-red-950/20 dark:to-background overflow-x-hidden selection:bg-primary/20">

      {/* Navigation Bar */}
      <nav className="w-full p-4 md:px-8 md:py-6 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-md sticky top-0 z-50 bg-white/70 dark:bg-background/70">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-primary to-red-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-red-500/20">
            <Droplet className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="font-extrabold text-xl md:text-2xl tracking-tight text-foreground">RV-BloodLink</span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors hidden sm:block">
            Log in
          </Link>
          <Link href="/register">
            <Button className="rounded-full px-5 md:px-7 font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Join Now
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-24 md:pb-32 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 md:gap-16">
        <motion.div
          className="flex-1 text-center lg:text-left z-10 w-full"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-primary font-bold text-xs sm:text-sm mb-6 sm:mb-8 border border-red-200 dark:border-red-800/50 shadow-sm">
            <Heart className="w-4 h-4 animate-pulse text-red-500" />
            <span>Every drop counts</span>
          </motion.div>
          <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground mb-6 leading-[1.1]">
            Donate Blood. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-rose-400">
              Save Lives.
            </span>
          </motion.h1>
          <motion.p variants={fadeIn} className="text-lg sm:text-xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
            Connect blood donors and seekers instantly within your community. Your single donation can save up to three lives.
          </motion.p>
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-5 w-full sm:w-auto">
            <Link href="/register?role=donor" className="w-full sm:w-auto">
              <Button size="lg" className="rounded-full px-8 py-7 text-lg font-bold w-full shadow-xl shadow-red-500/20 hover:-translate-y-1 transition-all">
                Become a Donor <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/register?role=seeker" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-7 text-lg font-bold w-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border-2">
                Find Blood
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex-1 w-full max-w-md lg:max-w-none relative perspective-1000"
          initial={{ opacity: 0, x: 50, rotateY: 20 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
        >
          {/* Mockup Style UI Card */}
          <div className="relative w-full aspect-[4/3] mx-auto lg:ml-auto group">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-400 to-primary rounded-[2rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-white/10 shadow-2xl p-6 flex flex-col gap-4 transform-gpu hover:rotate-1 transition-transform duration-500">
              
              {/* Fake App Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Live Matching</h3>
                    <p className="text-xs text-muted-foreground">Bengaluru, India</p>
                  </div>
                </div>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>

              {/* Abstract Request Card */}
              <div className="bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-border/50 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2">
                    <div className="h-5 w-16 bg-red-100 dark:bg-red-900/30 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                    <Droplet className="w-5 h-5 text-red-500" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Abstract Donor Matched */}
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-200 dark:border-green-900/30 animate-in slide-in-from-bottom-4 duration-1000 delay-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1.5 w-full">
                    <h4 className="font-bold text-green-800 dark:text-green-300 text-sm">Match Found</h4>
                    <div className="h-3 w-3/4 bg-green-200 dark:bg-green-800/50 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-4 md:px-8 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Why RV-BloodLink?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Designed for speed, built for trust. We eliminate the friction of finding blood donors in critical emergencies.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: Activity, title: "Real-time Matching", desc: "Our algorithm instantly connects urgent requests with nearby eligible donors via push notifications.", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { icon: ShieldCheck, title: "Verified Donors", desc: "A robust 2-way QR code verification ensures every donation is genuine and builds a trusted community.", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
              { icon: Search, title: "Smart Locality Search", desc: "Find donors exactly where you need them with our precise Bengaluru locality filtering system.", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="flex flex-col items-center text-center p-8 rounded-[2rem] hover:bg-gray-50 dark:hover:bg-card/50 transition-colors border border-transparent hover:border-border"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 md:py-32 px-4 md:px-8 bg-gray-50 dark:bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Three simple steps to save a life.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Desktop Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-red-200 dark:via-red-900/50 to-transparent -translate-y-1/2 z-0"></div>

            {[
              { step: "01", title: "Register Instantly", desc: "Create an account in 60 seconds as a donor or a seeker.", icon: Users },
              { step: "02", title: "Connect & Communicate", desc: "Post a request or accept one. Call or WhatsApp securely.", icon: PhoneCall },
              { step: "03", title: "Verify & Save Lives", desc: "Meet up, donate blood, and scan the QR code to verify.", icon: Heart }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-white dark:bg-card border-4 border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center shadow-xl mb-6 text-primary relative">
                  <item.icon className="w-8 h-8" />
                  <span className="absolute -top-3 -right-3 w-8 h-8 bg-foreground text-background font-bold rounded-full flex items-center justify-center text-sm shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-20 md:py-32 px-4 md:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-primary"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6"
          >
            Ready to make a difference?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-2xl text-red-100/90 mb-10 max-w-2xl mx-auto font-medium"
          >
            Join our growing community today. Every single donor counts.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="rounded-full px-12 py-7 text-lg font-extrabold w-full hover:scale-105 transition-transform text-primary shadow-2xl">
                Join the Community
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-card py-12 md:py-16 text-center border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Droplet className="w-5 h-5 text-primary" />
            </div>
            <span className="font-extrabold text-xl text-foreground">RV-BloodLink</span>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            A real-time platform designed to eliminate the friction of finding blood donors in critical emergencies.
          </p>
          <div className="h-px bg-border/50 max-w-xs mx-auto mb-8"></div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} RV-BloodLink. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
