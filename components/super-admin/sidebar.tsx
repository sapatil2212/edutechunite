'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BarChart3, 
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
  Database,
  CreditCard,
  FileText,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  Activity,
} from 'lucide-react'

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: string | number | null
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/super-admin', badge: null },
  { icon: Building2, label: 'Institutions', href: '/super-admin/institutions', badge: null },
  { icon: Users, label: 'All Users', href: '/super-admin/users', badge: null },
  { icon: Activity, label: 'Activity Logs', href: '/super-admin/activity', badge: null },
  { icon: BarChart3, label: 'Analytics', href: '/super-admin/analytics', badge: null },
  { icon: CreditCard, label: 'Subscriptions', href: '/super-admin/subscriptions', badge: null },
  { icon: FileText, label: 'Reports', href: '/super-admin/reports', badge: null },
  { icon: Database, label: 'Database', href: '/super-admin/database', badge: null },
  { icon: Bell, label: 'Notifications', href: '/super-admin/notifications', badge: '3' },
  { icon: Settings, label: 'Settings', href: '/super-admin/settings', badge: null },
  { icon: HelpCircle, label: 'Support', href: '/super-admin/support', badge: null },
]

interface SuperAdminSidebarProps {
  user?: {
    name: string
    email: string
  } | null
  onLogout?: () => void
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => {
    if (href === '/super-admin') {
      return pathname === '/super-admin'
    }
    return pathname.startsWith(href)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
          {!isCollapsed ? (
            <Link href="/super-admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Super Admin</span>
                <p className="text-xs text-gray-500 dark:text-slate-400">EduFlow Platform</p>
              </div>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-16 w-6 h-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 z-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-slate-400" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 text-gray-900 dark:text-white border border-red-500/20 dark:border-red-500/30'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                      active ? 'text-orange-500 dark:text-orange-400' : 'group-hover:text-orange-500 dark:group-hover:text-orange-400'
                    }`} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Theme Toggle & User Section */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-3 space-y-3">
          {/* Theme Toggle */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2`}>
            {!isCollapsed && (
              <span className="text-sm text-gray-500 dark:text-slate-400">Theme</span>
            )}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
            >
              {mounted && theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-yellow-500" />
                  {!isCollapsed && <span className="text-xs text-gray-600 dark:text-slate-300">Light</span>}
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-500" />
                  {!isCollapsed && <span className="text-xs text-gray-600 dark:text-slate-300">Dark</span>}
                </>
              )}
            </button>
          </div>

          {/* User Profile */}
          {user && (
            <div className={`rounded-xl bg-gray-50 dark:bg-slate-800/50 ${isCollapsed ? 'p-2' : 'p-3'}`}>
              {!isCollapsed ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'SA'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.name || 'Super Admin'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'SA'}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
