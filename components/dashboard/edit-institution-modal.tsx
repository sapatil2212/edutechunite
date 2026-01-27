'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Save, Building2, Mail, Globe, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'
import { indianStates, maharashtraDistricts } from '@/lib/data/location-data'

interface InstitutionData {
  id: string
  name: string
  email: string
  address: string
  city: string
  state: string
  district: string | null
  pincode: string | null
  phone: string
  website: string | null
  logo: string | null
}

interface EditInstitutionModalProps {
  isOpen: boolean
  onClose: () => void
  institution: InstitutionData | null
  onSuccess: () => void
}

export const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  isOpen,
  onClose,
  institution,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    district: '',
    pincode: '',
    phone: '',
    website: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Populate form data when institution changes
  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name || '',
        email: institution.email || '',
        address: institution.address || '',
        city: institution.city || '',
        state: institution.state || '',
        district: institution.district || '',
        pincode: institution.pincode || '',
        phone: institution.phone || '',
        website: institution.website || '',
      })
    }
  }, [institution])

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    // Basic validation
    if (!formData.name.trim()) {
      setError('Institution name is required')
      setIsSubmitting(false)
      return
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email address is required')
      setIsSubmitting(false)
      return
    }

    if (!formData.phone.trim() || formData.phone.replace(/^\+91/, '').length !== 10) {
      setError('Valid 10-digit phone number is required')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/institution/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state,
          district: formData.district || null,
          pincode: formData.pincode || null,
          phone: formData.phone,
          website: formData.website.trim() || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to update institution details')
      }
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update institution details')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showDistricts = formData.state === 'maharashtra'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Edit Institution Details
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Update your institution's complete information
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Institution Name */}
                <div>
                  <Label htmlFor="name" required className="text-xs">
                    Institution Name
                  </Label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter institution name"
                    required
                  />
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-100 dark:border-dark-700">
                    <Mail className="w-4 h-4 text-primary" />
                    Contact Information
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <Label htmlFor="email" required className="text-xs">
                        Email Address
                      </Label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="email@example.com"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone" required className="text-xs">
                        Phone Number
                      </Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 dark:bg-dark-700 border border-r-0 border-gray-200 dark:border-dark-700 rounded-l-lg">
                          +91
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone.replace(/^\+91/, '')}
                          onChange={(e) => updateFormData('phone', '+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-r-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="9876543210"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <Label htmlFor="website" className="text-xs">
                      Website (Optional)
                    </Label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-dark-700 border border-r-0 border-gray-200 dark:border-dark-700 rounded-l-lg">
                        <Globe className="w-4 h-4" />
                      </span>
                      <input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateFormData('website', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-r-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-100 dark:border-dark-700">
                    <MapPin className="w-4 h-4 text-primary" />
                    Address
                  </div>

                  {/* Full Address */}
                  <div>
                    <Label htmlFor="address" required className="text-xs">
                      Full Address
                    </Label>
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="Enter street address, building, area..."
                      required
                    />
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" required className="text-xs">
                        City
                      </Label>
                      <input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter city"
                        required
                      />
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
                          // Clear district if state changes from Maharashtra
                          if (val !== 'maharashtra') {
                            updateFormData('district', '')
                          }
                        }}
                        placeholder="Select state"
                        searchable
                      />
                    </div>
                  </div>

                  {/* District (for Maharashtra) & Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {showDistricts && (
                      <div>
                        <Label htmlFor="district" className="text-xs">
                          District
                        </Label>
                        <Dropdown
                          options={maharashtraDistricts}
                          value={formData.district}
                          onChange={(val) => updateFormData('district', val)}
                          placeholder="Select district"
                          searchable
                        />
                      </div>
                    )}
                    <div className={showDistricts ? '' : 'sm:col-span-1'}>
                      <Label htmlFor="pincode" className="text-xs">
                        Pincode
                      </Label>
                      <input
                        id="pincode"
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => updateFormData('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
