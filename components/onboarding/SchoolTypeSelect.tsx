'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Dropdown } from '@/components/ui/dropdown'

export type SchoolType = 
  | 'preschool'
  | 'primary'
  | 'middle'
  | 'secondary'
  | 'senior_secondary'
  | 'integrated'

const schoolTypeOptions = [
  { value: 'preschool', label: 'Preschool / Early Learning' },
  { value: 'primary', label: 'Primary School (Class 1-5)' },
  { value: 'middle', label: 'Middle School (Class 6-8)' },
  { value: 'secondary', label: 'Secondary School (Class 9-10)' },
  { value: 'senior_secondary', label: 'Senior Secondary School (Class 11-12)' },
  { value: 'integrated', label: 'Integrated School (K-12)' },
]

interface SchoolTypeSelectProps {
  value: SchoolType | ''
  onChange: (value: SchoolType) => void
  visible: boolean
  error?: string
}

export const SchoolTypeSelect: React.FC<SchoolTypeSelectProps> = ({
  value,
  onChange,
  visible,
  error,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Label htmlFor="schoolType" required className="text-xs">
            School Type
          </Label>
          <Dropdown
            options={schoolTypeOptions}
            value={value}
            onChange={(val) => onChange(val as SchoolType)}
            placeholder="Select your school type"
            error={!!error}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

