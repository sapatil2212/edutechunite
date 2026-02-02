'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget'
import { VoiceAssistantWidget } from '@/components/ai/VoiceAssistantWidget'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
    // Only students can access student portal
    if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/dashboard')
    }


  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <DashboardSidebar />
      <DashboardHeader />
      <main className="ml-64 pt-16">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      <VoiceAssistantWidget />
      <AIAssistantWidget />
    </div>
  )
}
