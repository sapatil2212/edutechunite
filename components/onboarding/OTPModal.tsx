'use client'

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OTPModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onSuccess: (data: { schoolId: string; institutionName: string }) => void
}

export const OTPModal: React.FC<OTPModalProps> = ({ isOpen, onClose, email, onSuccess }) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [isOpen])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    pastedData.split('').forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char
      }
    })
    setOtp(newOtp)

    const lastFilledIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastFilledIndex]?.focus()
  }

  const handleVerify = async () => {
    const otpValue = otp.join('')
    
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpValue,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Verification failed. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      onSuccess({
        schoolId: data.data.schoolId,
        institutionName: data.data.institutionName,
      })
    } catch (error) {
      console.error('OTP verification error:', error)
      setError('An unexpected error occurred. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const isOtpComplete = otp.every(digit => digit !== '')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Verify Your Email
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We've sent a 6-digit OTP to
                </p>
                <p className="text-sm font-semibold text-primary mt-1">
                  {email}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                </motion.div>
              )}

              <div className="mb-6">
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-2xl font-bold bg-white dark:bg-dark-700 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        error
                          ? 'border-red-500'
                          : digit
                          ? 'border-primary'
                          : 'border-gray-200 dark:border-dark-600'
                      } text-gray-900 dark:text-gray-100`}
                      disabled={isVerifying}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleVerify}
                disabled={!isOtpComplete || isVerifying}
                className="w-full"
                size="sm"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify OTP
                  </>
                )}
              </Button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Didn't receive the code?{' '}
                  <button
                    onClick={() => {
                      setOtp(['', '', '', '', '', ''])
                      setError('')
                    }}
                    className="text-primary hover:underline font-medium"
                    disabled={isVerifying}
                  >
                    Clear & retry
                  </button>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                  ⏱️ OTP expires in 10 minutes
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
