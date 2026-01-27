'use client'

import React from 'react'
import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Principal, Greenwood Academy',
      image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=E5F33C&color=0A0A0A',
      content: 'EduManage has transformed how we manage our institution. The intuitive interface and powerful features have saved us countless hours.',
      rating: 5,
      color: 'from-primary/20 to-yellow-100 dark:from-primary/10 dark:to-yellow-900/20',
    },
    {
      name: 'Michael Chen',
      role: 'IT Director, Riverside School',
      image: 'https://ui-avatars.com/api/?name=Michael+Chen&background=3B82F6&color=FFFFFF',
      content: 'The analytics and reporting features are outstanding. We can now make data-driven decisions that truly impact student success.',
      rating: 5,
      color: 'from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Administrator, Summit College',
      image: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=8B5CF6&color=FFFFFF',
      content: 'Outstanding support and continuous updates. The team truly understands the needs of educational institutions.',
      rating: 5,
      color: 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
    },
  ]

  return (
    <section id="testimonials" className="py-12 lg:py-16">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            See Our Clients What Say About Us
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied institutions that trust EduManage for their management needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card hover className="h-full relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.color} opacity-50`} />
                <CardContent className="relative z-10 pt-4">
                  <Quote className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
                  
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
