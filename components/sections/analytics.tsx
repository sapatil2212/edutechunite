'use client'

import React from 'react'
import { ArrowRight, TrendingUp, PieChart, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export const Analytics: React.FC = () => {
  return (
    <section className="py-12 lg:py-16 bg-gray-50 dark:bg-dark-800/50">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <div className="aspect-[4/3] bg-white dark:bg-dark-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Performance Overview</h3>
                  <Badge variant="success">+12.5%</Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary-700 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Student Enrollment</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">85%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Course Completion</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">92%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Active Users</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">78%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '78%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">2.5K</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Students</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">150</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Courses</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">98%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <Badge variant="primary" className="mb-3">Analytics & Insights</Badge>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced Report And Analytics
            </h2>

            <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
              Get comprehensive insights into your institution's performance with our advanced analytics dashboard. 
              Track student progress, monitor course effectiveness, and make data-driven decisions.
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Real-time Data Visualization</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Monitor key metrics with interactive charts and graphs updated in real-time.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Custom Report Generation</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Create customized reports tailored to your specific needs and requirements.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Predictive Analytics</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Leverage AI-powered insights to predict trends and optimize outcomes.</p>
                </div>
              </li>
            </ul>

            <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
              Explore Analytics
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
