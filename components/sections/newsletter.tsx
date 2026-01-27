'use client'

import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Newsletter signup:', email)
    setEmail('')
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-primary/10 via-blue-50 to-purple-50 dark:from-primary/5 dark:via-dark-800 dark:to-dark-800 rounded-3xl p-6 lg:p-8 shadow-soft-lg border border-gray-200 dark:border-dark-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Subscribe To Our Newsletter
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Stay updated with the latest features, tips, and news from EduManage. 
                Join our community of educators and administrators.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" variant="primary" size="md" icon={Send} iconPosition="right">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
