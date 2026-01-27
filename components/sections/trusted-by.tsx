'use client'

import React from 'react'
import { motion } from 'framer-motion'

export const TrustedBy: React.FC = () => {
  const companies = [
    { name: 'Harvard', logo: 'H' },
    { name: 'Oxford', logo: 'O' },
    { name: 'Stanford', logo: 'S' },
    { name: 'Cambridge', logo: 'C' },
    { name: 'MIT', logo: 'M' },
  ]

  return (
    <section className="py-8 bg-gray-50 dark:bg-dark-800/50">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
            Trusted By
          </h3>
        </motion.div>

        <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-12">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                <span className="text-base font-bold text-gray-600 dark:text-gray-400">
                  {company.logo}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {company.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
