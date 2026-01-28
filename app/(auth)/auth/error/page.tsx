'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const errorMessages: Record<string, { title: string; message: string }> = {
  'missing-token': {
    title: 'Missing Verification Token',
    message: 'The verification link is incomplete. Please check your email and try again.',
  },
  'invalid-token': {
    title: 'Invalid Verification Token',
    message: 'The verification link is invalid or has already been used. Please request a new verification email.',
  },
  'token-expired': {
    title: 'Verification Link Expired',
    message: 'The verification link has expired. Please request a new verification email.',
  },
  'server-error': {
    title: 'Server Error',
    message: 'An unexpected error occurred. Please try again later.',
  },
  default: {
    title: 'Authentication Error',
    message: 'An error occurred during authentication. Please try again.',
  },
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error') || 'default'
  const errorInfo = errorMessages[errorCode] || errorMessages.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-soft-lg p-8 border border-gray-100 dark:border-dark-700 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-dark-900" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">EduFlow</span>
        </div>

        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {errorInfo.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {errorInfo.message}
        </p>

        <div className="space-y-3">
          <Link href="/auth/login">
            <Button className="w-full" size="lg">
              Go to Login
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full" size="lg" icon={ArrowLeft} iconPosition="left">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-3xl shadow-soft-lg p-8 border border-gray-100 dark:border-dark-700 flex justify-center items-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}

