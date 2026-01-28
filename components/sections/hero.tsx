'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { DashboardPreview } from './dashboard-preview'

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
            <DashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
