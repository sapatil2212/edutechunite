'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Users, 
  BarChart3, 
  Shield,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

const features = [
  { icon: Users, text: 'Manage students & staff' },
  { icon: BarChart3, text: 'Real-time analytics' },
  { icon: Shield, text: 'Secure & compliant' },
]

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Visual Area (Hidden on mobile) */}
      <div className="relative lg:w-1/2 w-full lg:min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 overflow-hidden hidden lg:block">
        {/* Animated background patterns */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          
          {/* Gradient orbs */}
          <motion.div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-primary/30 to-emerald-500/20 blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl"
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-teal-400/10 to-primary/10 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center items-center px-8 py-16 lg:py-0 lg:px-12 xl:px-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-8 left-8 flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-dark-900" />
            </div>
            <span className="text-xl font-bold text-white">EduFlow</span>
          </motion.div>

          {/* Main content */}
          <div className="max-w-md text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white/90">
                Trusted by 2,500+ institutions
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight"
            >
              Build, Manage & Grow Your Institution{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
                Digitally
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-white/70 mb-8"
            >
              Transform your educational institution with our comprehensive ERP solution designed for the modern era.
            </motion.p>

            {/* Feature list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-3"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 justify-center lg:justify-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-white/80 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Decorative illustration elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute bottom-8 right-8 hidden lg:block"
          >
            <div className="relative">
              {/* Floating cards */}
              <motion.div
                className="absolute -top-20 -left-16 w-32 h-20 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-3"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-400/30" />
                  <div className="h-2 w-12 rounded bg-white/30" />
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded bg-white/20" />
                  <div className="h-1.5 w-3/4 rounded bg-white/20" />
                </div>
              </motion.div>

              <motion.div
                className="w-40 h-24 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-3"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-2 w-16 rounded bg-white/30" />
                  <ArrowRight className="w-4 h-4 text-primary/60" />
                </div>
                <div className="flex gap-1 mt-3">
                  {[40, 65, 45, 80, 55].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-emerald-400/40"
                      style={{ height: `${height}%` }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-16 -right-12 w-28 h-28 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 flex flex-col items-center justify-center"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-emerald-400/40 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-white/80" />
                </div>
                <div className="h-1.5 w-16 rounded bg-white/20" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Form Area (Full width on mobile) */}
      <div className="lg:w-1/2 w-full min-h-screen flex items-center justify-center p-6 lg:p-8 xl:p-12 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-dark-900 dark:via-dark-900 dark:to-emerald-950/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-lg"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-dark-900" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">EduFlow</span>
          </div>

          <OnboardingForm />

          {/* Footer text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            By continuing, you agree to our{' '}
            <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary underline underline-offset-2">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-primary underline underline-offset-2">
              Privacy Policy
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

