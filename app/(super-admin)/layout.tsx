'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'
import { SuperAdminSidebar } from '@/components/super-admin/sidebar'
import { SuperAdminNavbar } from '@/components/super-admin/navbar'

interface User {
  name: string
  email: string
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/super-admin/verify')
        const data = await response.json()

        if (data.success) {
          setIsAuthenticated(true)
          setUser(data.data.user)
        } else {
          router.push('/auth/super-admin')
        }
      } catch {
        router.push('/auth/super-admin')
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/super-admin/logout', { method: 'POST' })
    router.push('/auth/super-admin')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <SuperAdminSidebar user={user} onLogout={handleLogout} />
      <div className="ml-64 min-h-screen transition-all duration-300 flex flex-col">
        <SuperAdminNavbar user={user} onLogout={handleLogout} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
