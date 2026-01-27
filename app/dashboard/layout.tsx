import type { Metadata } from 'next'
import { DashboardLayoutClient } from './layout-client'

export const metadata: Metadata = {
  title: 'Dashboard - EduManage',
  description: 'Manage your educational institution with EduManage',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
