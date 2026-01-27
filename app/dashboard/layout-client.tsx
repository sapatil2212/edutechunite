'use client'

import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget'
import { VoiceAssistantWidget } from '@/components/ai/VoiceAssistantWidget'

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <VoiceAssistantWidget />
      <AIAssistantWidget />
    </>
  )
}
