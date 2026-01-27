'use client'

import React from 'react'
import { Users, BookOpen, Calendar, BarChart3, Shield, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export const Features: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Comprehensive student profiles, attendance tracking, and performance monitoring in one place.',
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Create, organize, and manage courses with ease. Track curriculum and learning outcomes.',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    {
      icon: Calendar,
      title: 'Scheduling & Timetables',
      description: 'Automated timetable generation, class scheduling, and event management system.',
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time insights and detailed reports to make data-driven decisions for your institution.',
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Enterprise-grade security with role-based access control and data encryption.',
      color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    },
    {
      icon: Zap,
      title: 'Fast Performance',
      description: 'Lightning-fast performance with optimized workflows and instant data synchronization.',
      color: 'bg-primary/20 text-primary-700 dark:text-primary-400',
    },
  ]

  return (
    <section id="features" className="py-12 lg:py-16">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Our Included Best Services
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to manage your educational institution efficiently and effectively.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <CardHeader>
                  <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-3`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
