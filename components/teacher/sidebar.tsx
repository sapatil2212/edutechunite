'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  Calendar,
  FileText,
  Bell,
  User,
  ChevronDown,
  Menu,
  GraduationCap,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/teacher',
    icon: LayoutDashboard,
  },
  {
    name: 'My Classes',
    icon: Users,
    children: [
      { name: 'Class Schedule', href: '/teacher/schedule' },
      { name: 'Students', href: '/teacher/students' },
    ],
  },
  {
    name: 'Attendance Report',
    href: '/teacher/attendance/report',
    icon: BarChart3,
  },
  {
    name: 'Mark Attendance',
    href: '/teacher/attendance',
    icon: ClipboardCheck,
  },
  {
    name: 'Assignments',
    icon: FileText,
    children: [
      { name: 'Manage Assignments', href: '/teacher/assignments' },
      { name: 'Create New', href: '/teacher/assignments?action=new' },
      { name: 'Evaluations', href: '/teacher/assignments/evaluations' },
    ],
  },
  {
    name: 'Academics',
    icon: BookOpen,
    children: [
      { name: 'Courses', href: '/teacher/courses' },
      { name: 'Subjects', href: '/teacher/subjects' },
      { name: 'Resources', href: '/teacher/resources' },
    ],
  },
  {
    name: 'Assessments',
    icon: ClipboardList,
    children: [
      { name: 'Exams', href: '/teacher/exams' },
      { name: 'Grades', href: '/teacher/grades' },
      { name: 'Reports', href: '/teacher/reports' },
    ],
  },
  {
    name: 'Timetable',
    href: '/teacher/timetable',
    icon: Calendar,
  },
  {
    name: 'Notices',
    href: '/teacher/notices',
    icon: Bell,
  },
  {
    name: 'Profile',
    href: '/teacher/profile',
    icon: User,
  },
]

export default function TeacherSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const isActive = (href: string) => {
    if (href === '/teacher') return pathname === '/teacher'
    return pathname === href || pathname.startsWith(href + '/')
  }
  const isParentActive = (children: { href: string }[]) => 
    children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/teacher" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-6 h-6 text-dark-900" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">EduTeach</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200 group
                        ${isParentActive(item.children)
                          ? 'bg-primary text-dark-900 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className={`w-5 h-5 transition-colors duration-200 ${isParentActive(item.children) ? 'text-dark-900' : 'group-hover:text-primary'}`} />
                        <span className={isParentActive(item.children) ? 'font-bold' : ''}>{item.name}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${openMenus.includes(item.name) || isParentActive(item.children) ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {(openMenus.includes(item.name) || isParentActive(item.children)) && (
                      <div className="mt-1 ml-4 pl-4 border-l border-gray-200 dark:border-dark-700 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`
                              block px-3 py-2 rounded-lg text-sm transition-all duration-200
                              ${isActive(child.href)
                                ? 'bg-primary text-dark-900 font-bold shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-gray-200'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    className={`
                      flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200 group
                      ${isActive(item.href!)
                        ? 'bg-primary text-dark-900 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'}
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 transition-colors duration-200 ${isActive(item.href!) ? 'text-dark-900' : 'group-hover:text-primary'}`} />
                    <span className={isActive(item.href!) ? 'font-bold' : ''}>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <span className="text-dark-900 font-bold">
                  {session?.user?.name?.charAt(0) || 'T'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {session?.user?.name || 'Teacher'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
