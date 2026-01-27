'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Settings,
  FileText,
  DollarSign,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Layers,
  Clock,
  BookMarked,
  UserCheck,
  ClipboardList,
  Trophy,
  FileEdit,
  CreditCard,
  User,
  UserSquare2,
  Home,
} from 'lucide-react'

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: string | null
  children?: MenuItem[]
}

export const DashboardSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['academic-setup'])
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Get user initials from name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || 'user@example.com'
  const userInitials = getInitials(session?.user?.name)
  const userRole = session?.user?.role || 'SCHOOL_ADMIN'
  const isTeacher = userRole === 'TEACHER'
  const isStudent = userRole === 'STUDENT'
  const isParent = userRole === 'PARENT'

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  // Admin menu items
  const adminMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', badge: null },
    { 
      icon: GraduationCap, 
      label: 'Academic Setup', 
      href: '/dashboard/academic',
      children: [
        { icon: Calendar, label: 'Academic Year', href: '/dashboard/academic/years' },
        { icon: BookOpen, label: 'Courses', href: '/dashboard/academic/courses' },
        { icon: Layers, label: 'Classes / Batches', href: '/dashboard/academic/classes' },
        { icon: BookMarked, label: 'Subjects', href: '/dashboard/academic/subjects' },
        { icon: Users, label: 'Teachers', href: '/dashboard/academic/teachers' },
        { icon: UserCheck, label: 'Teacher Assignments', href: '/dashboard/academic/teachers/assignments' },
        { icon: Clock, label: 'Timetable', href: '/dashboard/academic/timetable' },
      ]
    },
    { icon: Users, label: 'Students', href: '/dashboard/students', badge: null },
    { icon: Calendar, label: 'Schedule', href: '/dashboard/schedule', badge: null },
    { icon: FileText, label: 'Assignments', href: '/dashboard/assignments', badge: null },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', badge: null },
    { icon: DollarSign, label: 'Finance', href: '/dashboard/finance', badge: null },
    { icon: Bell, label: 'Notifications', href: '/dashboard/notifications', badge: null },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', badge: null },
    { icon: Clock, label: 'My Timetable', href: '/dashboard/timetable', badge: null },
  ]

  // Teacher menu items
  const teacherMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/teacher', badge: null },
    { 
      icon: Users, 
      label: 'My Classes', 
      href: '/teacher/classes',
      children: [
        { icon: Users, label: 'All Classes', href: '/teacher/classes' },
        { icon: ClipboardList, label: 'Mark Attendance', href: '/teacher/attendance' },
      ]
    },
    { icon: BarChart3, label: 'Attendance Report', href: '/teacher/attendance/report', badge: null },
    { 
      icon: FileText, 
      label: 'Assignments', 
      href: '/teacher/assignments',
      children: [
        { icon: FileText, label: 'Manage Assignments', href: '/teacher/assignments' },
        { icon: ClipboardList, label: 'Evaluations', href: '/teacher/assignments/evaluations' },
      ]
    },
    { 
      icon: GraduationCap, 
      label: 'Academics', 
      href: '/teacher/academics',
      children: [
        { icon: BookMarked, label: 'My Subjects', href: '/teacher/subjects' },
        { icon: Layers, label: 'Resources', href: '/teacher/resources' },
      ]
    },
    { 
      icon: BarChart3, 
      label: 'Assessments', 
      href: '/teacher/assessments',
      children: [
        { icon: FileEdit, label: 'Exams', href: '/teacher/exams' },
        { icon: BarChart3, label: 'Grades', href: '/teacher/grades' },
        { icon: FileText, label: 'Reports', href: '/teacher/reports' },
      ]
    },
    { icon: Clock, label: 'My Timetable', href: '/teacher/timetable', badge: null },
    { icon: Bell, label: 'Notices', href: '/teacher/notices', badge: null },
    { icon: Settings, label: 'Profile', href: '/teacher/profile', badge: null },
  ]

  // Student menu items
  const studentMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student', badge: null },
    {
      icon: GraduationCap,
      label: 'Academics',
      href: '/student/academics',
      children: [
        { icon: Clock, label: 'Timetable', href: '/student/timetable' },
        { icon: ClipboardList, label: 'Attendance', href: '/student/attendance' },
        { icon: BookMarked, label: 'Subjects', href: '/student/subjects' },
      ]
    },
    {
      icon: BarChart3,
      label: 'Assessments',
      href: '/student/assessments',
      children: [
        { icon: FileText, label: 'Homework', href: '/student/homework' },
        { icon: FileEdit, label: 'Exams', href: '/student/exams' },
        { icon: Trophy, label: 'Results', href: '/student/results' },
      ]
    },
    { icon: Layers, label: 'Resources', href: '/student/resources', badge: null },
    { icon: Bell, label: 'Notices', href: '/student/notices', badge: null },
    { icon: CreditCard, label: 'Fees', href: '/student/fees', badge: null },
    {
      icon: User,
      label: 'Profile',
      href: '/student/profile',
      children: [
        { icon: UserSquare2, label: 'My Profile', href: '/student/profile' },
        { icon: Settings, label: 'Change Password', href: '/student/profile?tab=password' },
      ]
    },
  ]

  // Parent menu items
  const parentMenuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', href: '/parent', badge: null },
    { icon: ClipboardList, label: 'Attendance', href: '/parent/attendance', badge: null },
    { icon: FileText, label: 'Homework', href: '/parent/homework', badge: null },
    { icon: Trophy, label: 'Results', href: '/parent/results', badge: null },
    { icon: Clock, label: 'Timetable', href: '/parent/timetable', badge: null },
    { icon: Bell, label: 'Notices', href: '/parent/notices', badge: null },
    { icon: CreditCard, label: 'Fees', href: '/parent/fees', badge: null },
    { icon: Calendar, label: 'Leave Request', href: '/parent/leave', badge: null },
    { icon: Settings, label: 'Settings', href: '/parent/settings', badge: null },
  ]

  const getMenuItems = () => {
    switch (userRole) {
      case 'TEACHER': return teacherMenuItems
      case 'STUDENT': return studentMenuItems
      case 'PARENT': return parentMenuItems
      default: return adminMenuItems
    }
  }

  const getHomeLink = () => {
    switch (userRole) {
      case 'TEACHER': return '/teacher'
      case 'STUDENT': return '/student'
      case 'PARENT': return '/parent'
      default: return '/dashboard'
    }
  }

  const getPortalName = () => {
    switch (userRole) {
      case 'TEACHER': return 'EduTeach'
      case 'STUDENT': return 'EduStudent'
      case 'PARENT': return 'EduParent'
      default: return 'EduManage'
    }
  }

  const menuItems = getMenuItems()
  const homeLink = getHomeLink()
  const portalName = getPortalName()

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/teacher' || href === '/student' || href === '/parent') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-800 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-800">
          {!isCollapsed && (
            <Link href={homeLink} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-dark-900 font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {portalName}
              </span>
            </Link>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mx-auto">
              <span className="text-dark-900 font-bold text-xl">E</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors duration-200"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.href)
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedMenus.includes(item.href)
              const isChildActive = hasChildren && item.children?.some(child => isActive(child.href))

              if (hasChildren) {
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => !isCollapsed && toggleMenu(item.href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isChildActive
                          ? 'bg-primary text-dark-900'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                        isChildActive ? 'text-dark-900' : 'group-hover:text-primary'
                      }`} />
                      {!isCollapsed && (
                        <>
                          <span className={`flex-1 text-sm text-left ${isChildActive ? 'font-bold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`} />
                        </>
                      )}
                    </button>
                    {/* Submenu */}
                    {!isCollapsed && isExpanded && (
                      <ul className="mt-1 ml-4 pl-4 border-l border-gray-200 dark:border-dark-700 space-y-1">
                        {item.children?.map((child) => {
                          const childActive = isActive(child.href)
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                  childActive
                                    ? 'bg-primary text-dark-900'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                              >
                                <child.icon className={`w-4 h-4 flex-shrink-0 ${
                                  childActive ? 'text-dark-900' : ''
                                }`} />
                                <span className={`text-sm ${childActive ? 'font-bold' : 'font-medium'}`}>
                                  {child.label}
                                </span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-primary text-dark-900'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                      active ? 'text-dark-900' : 'group-hover:text-primary'
                    }`} />
                    {!isCollapsed && (
                      <>
                        <span className={`flex-1 text-sm ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            active
                              ? 'bg-primary text-dark-900'
                              : 'bg-primary/20 text-primary-700 dark:text-primary-400'
                          }`}>
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

        <div className="p-4 border-t border-gray-200 dark:border-dark-800">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-dark-900 font-semibold text-sm">{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto">
              <span className="text-dark-900 font-semibold text-sm">{userInitials}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
