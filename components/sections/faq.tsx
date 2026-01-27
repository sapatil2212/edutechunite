'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'How do I get started with EduManage?',
      answer: 'Getting started is easy! Simply sign up for a free 14-day trial, and our onboarding team will guide you through the setup process. No credit card required.',
    },
    {
      question: 'What kind of support do you offer?',
      answer: 'We offer 24/7 customer support via email, chat, and phone. Our dedicated support team is always ready to help you with any questions or issues.',
    },
    {
      question: 'Can I migrate my existing data to EduManage?',
      answer: 'Yes! We provide comprehensive data migration services to help you seamlessly transfer your existing data from other systems to EduManage.',
    },
    {
      question: 'Is my data secure with EduManage?',
      answer: 'Absolutely. We use enterprise-grade encryption, regular security audits, and comply with all major data protection regulations including GDPR and FERPA.',
    },
    {
      question: 'Can I customize the platform for my institution?',
      answer: 'Yes, EduManage is highly customizable. You can configure workflows, create custom fields, and tailor the platform to match your institution\'s specific needs.',
    },
  ]

  return (
    <section id="faq" className="py-12 lg:py-16 bg-gray-50 dark:bg-dark-800/50">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            FAQ's
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers to commonly asked questions about EduManage.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors duration-200"
                >
                  <span className="text-base font-semibold text-gray-900 dark:text-white pr-3">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-4 pb-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-dark-700 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
