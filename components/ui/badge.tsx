import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const variants = {
    primary: 'bg-primary/10 text-primary-700 dark:text-primary-400 border-primary/20',
    secondary: 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-600',
    success: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  }
  
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 
        rounded-full text-xs font-medium 
        border
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
