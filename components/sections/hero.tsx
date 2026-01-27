'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export const Hero: React.FC = () => {
  const features = [
    'No credit card required',
    'Free 14-day trial',
    '24/7 Support',
  ]

  return (
    <section className="relative pt-20 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-50 dark:from-primary/10 dark:via-transparent dark:to-dark-900" />
      
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/20 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trusted by 10,000+ institutions
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              The <span className="text-primary">Easiest</span> Way To Manage Your Projects.
            </h1>

            <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-xl">
              Streamline your educational institution with our comprehensive ERP solution. 
              Manage students, staff, courses, and operations all in one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href="/onboarding">
                <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                  Get Started Free
                </Button>
              </Link>
              <Button variant="outline" size="lg" icon={Play} iconPosition="left">
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-blue-100 dark:from-primary/10 dark:to-dark-800 flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-dark-800 rounded-2xl m-4 p-8 shadow-soft-lg">
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded-lg w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-full animate-pulse animation-delay-200" />
                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-5/6 animate-pulse animation-delay-400" />
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="h-24 bg-primary/20 rounded-xl animate-pulse" />
                      <div className="h-24 bg-blue-100 dark:bg-blue-900/20 rounded-xl animate-pulse animation-delay-200" />
                      <div className="h-24 bg-purple-100 dark:bg-purple-900/20 rounded-xl animate-pulse animation-delay-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary rounded-2xl rotate-12 opacity-20" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500 rounded-2xl -rotate-12 opacity-20" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
