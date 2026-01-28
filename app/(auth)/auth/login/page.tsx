'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Users,
  BarChart3,
  Shield,
  Sparkles,
  ArrowRight,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const features = [
  { icon: Users, text: 'Manage students & staff' },
  { icon: BarChart3, text: 'Real-time analytics' },
  { icon: Shield, text: 'Secure & compliant' },
]

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'success') {
      setSuccessMessage('Email verified successfully! You can now log in.')
    } else if (verified === 'already') {
      setSuccessMessage('Email already verified. Please log in.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        // Fetch session to get role and redirect accordingly
        const res = await fetch('/api/auth/session')
        const session = await res.json()
        
        if (session?.user?.role === 'TEACHER') {
          router.push('/teacher')
        } else if (session?.user?.role === 'STUDENT') {
          router.push('/student')
        } else if (session?.user?.role === 'PARENT') {
          router.push('/parent')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = identifier.trim() !== '' && password.trim() !== ''

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Visual Area (Hidden on mobile) */}
      <div className="relative lg:w-1/2 w-full lg:min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 overflow-hidden hidden lg:block">
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
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/20 blur-3xl"
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
            className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl"
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
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/10 to-primary/10 blur-2xl"
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
                Welcome back to EduFlow
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight"
            >
              Access Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300">
                Dashboard
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-white/70 mb-8"
            >
              Sign in to manage your institution, track performance, and unlock powerful insights.
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
                  <div className="w-6 h-6 rounded-full bg-blue-400/30" />
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
                      className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-blue-400/40"
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-blue-400/40 flex items-center justify-center mb-2">
                  <LogIn className="w-5 h-5 text-white/80" />
                </div>
                <div className="h-1.5 w-16 rounded bg-white/20" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Login Form (Full width on mobile) */}
      <div className="lg:w-1/2 w-full min-h-screen flex items-center justify-center p-6 lg:p-8 xl:p-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-dark-900 dark:via-dark-900 dark:to-blue-950/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-dark-900" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">EduFlow</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="identifier" required>
                Admission Number / Email
              </Label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Admission No. or Email"
                  className="pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" required className="mb-0">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Enter your password"
                  className="pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                Keep me signed in
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full"
              size="lg"
              icon={isLoading ? Loader2 : LogIn}
              iconPosition="right"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-dark-700" />
            <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-dark-700" />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Don't have an account yet?
            </p>
            <Link href="/onboarding">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                icon={ArrowRight}
                iconPosition="right"
              >
                Create an Account
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            By signing in, you agree to our{' '}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-dark-900 dark:via-dark-900 dark:to-blue-950/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
