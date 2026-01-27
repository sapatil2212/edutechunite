'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Building2, 
  School, 
  BookOpen,
  Check
} from 'lucide-react'

export type InstitutionType = 'school' | 'institute' | 'college' | 'coaching'

interface InstitutionOption {
  id: InstitutionType
  title: string
  description: string
  icon: React.ReactNode
}

const institutionOptions: InstitutionOption[] = [
  {
    id: 'school',
    title: 'School',
    description: 'K-12 education institutions',
    icon: <School className="w-4 h-4" />,
  },
  {
    id: 'institute',
    title: 'Institute',
    description: 'Technical & vocational training',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: 'college',
    title: 'College',
    description: 'Higher education & universities',
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    id: 'coaching',
    title: 'Coaching Center',
    description: 'Test prep & skill development',
    icon: <BookOpen className="w-4 h-4" />,
  },
]

interface InstitutionTypeSelectorProps {
  value: InstitutionType | null
  onChange: (type: InstitutionType) => void
}

export const InstitutionTypeSelector: React.FC<InstitutionTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select your institution type <span className="text-red-500">*</span>
      </label>
      
      <div className="grid grid-cols-2 gap-2.5">
        {institutionOptions.map((option, index) => {
          const isSelected = value === option.id
          
          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => onChange(option.id)}
              className={`
                relative p-3 rounded-lg border-2 text-left
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                group
                ${isSelected 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                  : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-800/50'
                }
              `}
              role="radio"
              aria-checked={isSelected}
            >
              {/* Selection indicator */}
              <div className={`
                absolute top-2.5 right-2.5 w-4 h-4 rounded-full border-2 
                flex items-center justify-center
                transition-all duration-200
                ${isSelected 
                  ? 'border-primary bg-primary' 
                  : 'border-gray-300 dark:border-dark-600 group-hover:border-gray-400'
                }
              `}>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-2.5 h-2.5 text-dark-900" strokeWidth={3} />
                  </motion.div>
                )}
              </div>

              {/* Icon */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center mb-2
                transition-all duration-200
                ${isSelected 
                  ? 'bg-primary text-dark-900' 
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-dark-600'
                }
              `}>
                {option.icon}
              </div>

              {/* Text content */}
              <h3 className={`
                font-semibold text-sm mb-0.5
                transition-colors duration-200
                ${isSelected 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-800 dark:text-gray-200'
                }
              `}>
                {option.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

