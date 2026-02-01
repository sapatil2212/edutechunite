'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  color?: string
}

interface SearchableDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
  searchPlaceholder?: string
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  required = false,
  disabled = false,
  error,
  className = '',
  searchPlaceholder = 'Search...',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white dark:bg-dark-900 border rounded-lg transition-all duration-200 ${
          error
            ? 'border-red-500 dark:border-red-500'
            : isOpen
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.color && (
            <span 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 dark:border-dark-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-800 border-0 rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-dark-900"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${
                    option.value === value ? 'bg-primary/5' : ''
                  }`}
                >
                  {option.color && (
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.icon && (
                    <span className="flex-shrink-0 text-gray-500">{option.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      option.value === value 
                        ? 'font-semibold text-primary' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {option.label}
                    </p>
                    {option.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableDropdown
