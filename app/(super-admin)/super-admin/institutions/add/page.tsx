'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'

// Indian states
const indianStates = [
  { value: 'andhra_pradesh', label: 'Andhra Pradesh' },
  { value: 'arunachal_pradesh', label: 'Arunachal Pradesh' },
  { value: 'assam', label: 'Assam' },
  { value: 'bihar', label: 'Bihar' },
  { value: 'chhattisgarh', label: 'Chhattisgarh' },
  { value: 'goa', label: 'Goa' },
  { value: 'gujarat', label: 'Gujarat' },
  { value: 'haryana', label: 'Haryana' },
  { value: 'himachal_pradesh', label: 'Himachal Pradesh' },
  { value: 'jharkhand', label: 'Jharkhand' },
  { value: 'karnataka', label: 'Karnataka' },
  { value: 'kerala', label: 'Kerala' },
  { value: 'madhya_pradesh', label: 'Madhya Pradesh' },
  { value: 'maharashtra', label: 'Maharashtra' },
  { value: 'manipur', label: 'Manipur' },
  { value: 'meghalaya', label: 'Meghalaya' },
  { value: 'mizoram', label: 'Mizoram' },
  { value: 'nagaland', label: 'Nagaland' },
  { value: 'odisha', label: 'Odisha' },
  { value: 'punjab', label: 'Punjab' },
  { value: 'rajasthan', label: 'Rajasthan' },
  { value: 'sikkim', label: 'Sikkim' },
  { value: 'tamil_nadu', label: 'Tamil Nadu' },
  { value: 'telangana', label: 'Telangana' },
  { value: 'tripura', label: 'Tripura' },
  { value: 'uttar_pradesh', label: 'Uttar Pradesh' },
  { value: 'uttarakhand', label: 'Uttarakhand' },
  { value: 'west_bengal', label: 'West Bengal' },
  { value: 'delhi', label: 'Delhi (NCT)' },
  { value: 'jammu_kashmir', label: 'Jammu & Kashmir' },
  { value: 'ladakh', label: 'Ladakh' },
  { value: 'puducherry', label: 'Puducherry' },
  { value: 'chandigarh', label: 'Chandigarh' },
  { value: 'andaman_nicobar', label: 'Andaman & Nicobar Islands' },
  { value: 'dadra_nagar_haveli', label: 'Dadra & Nagar Haveli and Daman & Diu' },
  { value: 'lakshadweep', label: 'Lakshadweep' },
]

// Maharashtra districts
const maharashtraDistricts = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'mumbai_suburban', label: 'Mumbai Suburban' },
  { value: 'pune', label: 'Pune' },
  { value: 'nagpur', label: 'Nagpur' },
  { value: 'thane', label: 'Thane' },
  { value: 'nashik', label: 'Nashik' },
  { value: 'aurangabad', label: 'Aurangabad' },
  { value: 'solapur', label: 'Solapur' },
  { value: 'kolhapur', label: 'Kolhapur' },
  { value: 'sangli', label: 'Sangli' },
  { value: 'satara', label: 'Satara' },
  { value: 'ratnagiri', label: 'Ratnagiri' },
  { value: 'sindhudurg', label: 'Sindhudurg' },
  { value: 'ahmednagar', label: 'Ahmednagar' },
  { value: 'jalgaon', label: 'Jalgaon' },
  { value: 'dhule', label: 'Dhule' },
  { value: 'nandurbar', label: 'Nandurbar' },
  { value: 'latur', label: 'Latur' },
  { value: 'osmanabad', label: 'Osmanabad' },
  { value: 'beed', label: 'Beed' },
  { value: 'nanded', label: 'Nanded' },
  { value: 'parbhani', label: 'Parbhani' },
  { value: 'hingoli', label: 'Hingoli' },
  { value: 'jalna', label: 'Jalna' },
  { value: 'buldhana', label: 'Buldhana' },
  { value: 'akola', label: 'Akola' },
  { value: 'washim', label: 'Washim' },
  { value: 'amravati', label: 'Amravati' },
  { value: 'yavatmal', label: 'Yavatmal' },
  { value: 'wardha', label: 'Wardha' },
  { value: 'chandrapur', label: 'Chandrapur' },
  { value: 'gadchiroli', label: 'Gadchiroli' },
  { value: 'bhandara', label: 'Bhandara' },
  { value: 'gondia', label: 'Gondia' },
  { value: 'raigad', label: 'Raigad' },
  { value: 'palghar', label: 'Palghar' },
]

// School types
const schoolTypes = [
  { value: 'preschool', label: 'Preschool / Early Learning' },
  { value: 'primary', label: 'Primary School' },
  { value: 'middle', label: 'Middle School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'senior_secondary', label: 'Senior Secondary School' },
  { value: 'integrated', label: 'Integrated School (K-12)' },
]

type InstitutionType = 'school' | 'institute' | 'college' | 'coaching'

interface FormData {
  institutionType: InstitutionType | null
  schoolType: string
  institutionName: string
  address: string
  city: string
  state: string
  district: string
  pincode: string
  website: string
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  sendWelcomeEmail: boolean
  autoVerify: boolean
}

interface FormErrors {
  institutionType?: string
  schoolType?: string
  institutionName?: string
  address?: string
  city?: string
  state?: string
  fullName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

const initialFormData: FormData = {
  institutionType: null,
  schoolType: '',
  institutionName: '',
  address: '',
  city: '',
  state: '',
  district: '',
  pincode: '',
  website: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  sendWelcomeEmail: true,
  autoVerify: true,
}

// Institution type cards config
const institutionTypes: { type: InstitutionType; label: string; description: string; icon: React.ElementType }[] = [
  { type: 'school', label: 'School', description: 'K-12, Primary, Secondary', icon: GraduationCap },
  { type: 'institute', label: 'Institute', description: 'Training, Technical', icon: BookOpen },
  { type: 'college', label: 'College', description: 'Higher Education', icon: Building2 },
  { type: 'coaching', label: 'Coaching Center', description: 'Test Prep, Tutoring', icon: Briefcase },
]

// Password strength
const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

  if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' }
  if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' }
  if (strength <= 4) return { strength, label: 'Strong', color: 'bg-emerald-500' }
  return { strength, label: 'Very Strong', color: 'bg-green-600' }
}

export default function AddInstitutionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successData, setSuccessData] = useState<{ schoolId: string; institutionName: string; email: string } | null>(null)

  const totalSteps = 2
  const passwordStrength = getPasswordStrength(formData.password)

  const getInstitutionLabel = () => {
    switch (formData.institutionType) {
      case 'school': return 'School'
      case 'institute': return 'Institute'
      case 'college': return 'College'
      case 'coaching': return 'Coaching Center'
      default: return 'Institution'
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.institutionType) {
      newErrors.institutionType = 'Please select an institution type'
    }
    
    if (formData.institutionType === 'school' && !formData.schoolType) {
      newErrors.schoolType = 'Please select a school type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = `${getInstitutionLabel()} name is required`
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state) {
      newErrors.state = 'State is required'
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian phone number'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setErrors({})
      setApiError('')
    }
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setIsSubmitting(true)
    setApiError('')

    try {
      const response = await fetch('/api/super-admin/institutions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institutionType: formData.institutionType,
          schoolType: formData.schoolType || undefined,
          institutionName: formData.institutionName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          district: formData.district || undefined,
          pincode: formData.pincode || undefined,
          website: formData.website || undefined,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          sendWelcomeEmail: formData.sendWelcomeEmail,
          autoVerify: formData.autoVerify,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setApiError(data.message || 'Failed to create institution. Please try again.')
        return
      }

      // Success
      setSuccessData({
        schoolId: data.data.schoolId,
        institutionName: data.data.institutionName,
        email: data.data.email,
      })

    } catch (error) {
      console.error('Create institution error:', error)
      setApiError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    
    // Clear error when user starts typing
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
    if (apiError) {
      setApiError('')
    }
  }

  const isStep1Valid = useMemo(() => {
    if (!formData.institutionType) return false
    if (formData.institutionType === 'school' && !formData.schoolType) return false
    return true
  }, [formData.institutionType, formData.schoolType])

  const isStep2Valid = useMemo(() => {
    return (
      formData.institutionName.trim() !== '' &&
      formData.address.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.state !== '' &&
      formData.fullName.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      /^[6-9]\d{9}$/.test(formData.phone) &&
      formData.password.length >= 8 &&
      /[A-Z]/.test(formData.password) &&
      /[a-z]/.test(formData.password) &&
      /[0-9]/.test(formData.password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) &&
      formData.password === formData.confirmPassword
    )
  }, [formData])

  const showDistricts = formData.state === 'maharashtra'

  // Success Screen
  if (successData) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-6 text-center"
        >
          <div className="mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-14 h-14 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1"
          >
            Institution Created! 🎉
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-600 dark:text-gray-400 mb-4"
          >
            The institution has been added to the platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-4"
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Institution ID</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
              {successData.schoolId}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Institution</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{successData.institutionName}</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Admin Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{successData.email}</p>
            </div>
          </motion.div>

          {formData.sendWelcomeEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-5 flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                A welcome email has been sent to the admin.
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-3"
          >
            <Button
              onClick={() => {
                setSuccessData(null)
                setFormData(initialFormData)
                setStep(1)
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Add Another
            </Button>
            <Link href="/super-admin/institutions" className="flex-1">
              <Button className="w-full" size="sm">
                View All Institutions
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/super-admin/institutions"
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Institutions
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Institution</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manually add a new institution to the platform.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-5">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {step === 1 ? 'Institution Type' : 'Details & Admin Account'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* API Error */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{apiError}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Select Institution Type
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Choose the type of institution you want to add.
                </p>
              </div>

              {/* Institution Type Cards */}
              <div className="grid grid-cols-2 gap-3">
                {institutionTypes.map((item) => (
                  <motion.button
                    key={item.type}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      updateFormData('institutionType', item.type)
                      if (item.type !== 'school') {
                        updateFormData('schoolType', '')
                      }
                    }}
                    className={`
                      relative p-4 rounded-lg border-2 text-left transition-all duration-200
                      ${formData.institutionType === item.type
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                      }
                    `}
                  >
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center mb-2.5
                      ${formData.institutionType === item.type
                        ? 'bg-primary/20'
                        : 'bg-gray-100 dark:bg-dark-800'
                      }
                    `}>
                      <item.icon className={`w-4.5 h-4.5 ${
                        formData.institutionType === item.type
                          ? 'text-primary'
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                    <h3 className={`text-sm font-semibold mb-0.5 ${
                      formData.institutionType === item.type
                        ? 'text-primary'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {item.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                    {formData.institutionType === item.type && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3"
                      >
                        <CheckCircle2 className="w-4.5 h-4.5 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              {errors.institutionType && (
                <p className="text-xs text-red-500">{errors.institutionType}</p>
              )}

              {/* School Type Dropdown */}
              {formData.institutionType === 'school' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="schoolType" required className="text-xs">
                    School Type
                  </Label>
                  <Dropdown
                    options={schoolTypes}
                    value={formData.schoolType}
                    onChange={(val) => updateFormData('schoolType', val)}
                    placeholder="Select school type"
                    error={!!errors.schoolType}
                  />
                  {errors.schoolType && (
                    <p className="mt-1 text-xs text-red-500">{errors.schoolType}</p>
                  )}
                </motion.div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="w-full"
                  size="sm"
                >
                  Continue to Details
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {getInstitutionLabel()} Details
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Enter the institution information and admin account details.
                </p>
              </div>

              {/* Institution Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">1</span>
                  </div>
                  Institution Information
                </div>

                <div>
                  <Label htmlFor="institutionName" required className="text-xs">
                    Name of {getInstitutionLabel()}
                  </Label>
                  <input
                    id="institutionName"
                    value={formData.institutionName}
                    onChange={(e) => updateFormData('institutionName', e.target.value)}
                    placeholder={`Enter ${getInstitutionLabel().toLowerCase()} name`}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.institutionName ? 'border-red-500' : ''}`}
                  />
                  {errors.institutionName && <p className="mt-1 text-xs text-red-500">{errors.institutionName}</p>}
                </div>

                <div>
                  <Label htmlFor="address" required className="text-xs">
                    Address
                  </Label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="Enter complete address"
                    rows={2}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" required className="text-xs">
                      City
                    </Label>
                    <input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Enter city"
                      className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.city ? 'border-red-500' : ''}`}
                    />
                    {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                  </div>

                  <div>
                    <Label htmlFor="state" required className="text-xs">
                      State
                    </Label>
                    <Dropdown
                      options={indianStates}
                      value={formData.state}
                      onChange={(val) => {
                        updateFormData('state', val)
                        updateFormData('district', '')
                      }}
                      placeholder="Select state"
                      searchable
                      error={!!errors.state}
                    />
                    {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                  </div>
                </div>

                {showDistricts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="district" className="text-xs">
                      District (Optional)
                    </Label>
                    <Dropdown
                      options={maharashtraDistricts}
                      value={formData.district}
                      onChange={(val) => updateFormData('district', val)}
                      placeholder="Select district"
                      searchable
                    />
                  </motion.div>
                )}

                {/* Pincode & Website */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pincode" className="text-xs">
                      Pincode (Optional)
                    </Label>
                    <input
                      id="pincode"
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        updateFormData('pincode', value)
                      }}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-xs">
                      Website (Optional)
                    </Label>
                    <input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Details Section */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">2</span>
                  </div>
                  Admin / Owner Details
                </div>

                <div>
                  <Label htmlFor="fullName" required className="text-xs">
                    Admin Full Name
                  </Label>
                  <input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateFormData('fullName', e.target.value)}
                    placeholder="Enter admin's full name"
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.fullName ? 'border-red-500' : ''}`}
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email" required className="text-xs">
                      Email ID
                    </Label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="admin@institution.com"
                      className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.email ? 'border-red-500' : ''}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" required className="text-xs">
                      Phone Number
                    </Label>
                    <div className="flex gap-1.5">
                      <div className="flex items-center px-2.5 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-400 text-xs font-medium">
                        +91
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          updateFormData('phone', value)
                        }}
                        placeholder="9876543210"
                        className={`flex-1 px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">3</span>
                  </div>
                  Admin Password
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="password" required className="text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        placeholder="Create a strong password"
                        className={`w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    {/* Password strength indicator */}
                    {formData.password && !errors.password && (
                      <div className="mt-1.5">
                        <div className="flex gap-0.5 mb-0.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-0.5 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.strength
                                  ? passwordStrength.color
                                  : 'bg-gray-200 dark:bg-dark-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] ${
                          passwordStrength.strength <= 2 ? 'text-red-500' :
                          passwordStrength.strength <= 3 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" required className="text-xs">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        placeholder="Confirm the password"
                        className={`w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Password must be 8+ characters with uppercase, lowercase, number & special character.
                </p>
              </div>

              {/* Options Section */}
              <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">4</span>
                  </div>
                  Options
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoVerify}
                      onChange={(e) => updateFormData('autoVerify', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-dark-600 dark:bg-dark-800"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-verify institution</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Skip email verification and activate immediately</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sendWelcomeEmail}
                      onChange={(e) => updateFormData('sendWelcomeEmail', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-dark-600 dark:bg-dark-800"
                    />
                    <div className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Send welcome email</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Notify admin with login credentials</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-5">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                  className="w-28"
                  icon={ArrowLeft}
                  iconPosition="left"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isStep2Valid || isSubmitting}
                  size="sm"
                  className="flex-1"
                  icon={isSubmitting ? Loader2 : CheckCircle2}
                  iconPosition="left"
                >
                  {isSubmitting ? 'Creating...' : 'Create Institution'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

