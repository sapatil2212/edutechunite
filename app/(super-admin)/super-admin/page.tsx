'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
} from 'lucide-react'

interface DashboardStats {
  totalSchools: number
  totalUsers: number
  activeSchools: number
  pendingVerifications: number
}

interface RecentActivity {
  id: string
  type: 'registration' | 'verification' | 'suspension' | 'login'
  title: string
  description: string
  time: string
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalUsers: 0,
    activeSchools: 0,
    pendingVerifications: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/super-admin/stats')
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Institutions',
      value: stats.totalSchools,
      change: '+12%',
      isPositive: true,
      icon: Building2,
      bgColor: 'bg-blue-100 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: '+8%',
      isPositive: true,
      icon: Users,
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Active Institutions',
      value: stats.activeSchools,
      change: '+5%',
      isPositive: true,
      icon: Activity,
      bgColor: 'bg-purple-100 dark:bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      change: '-3%',
      isPositive: false,
      icon: TrendingUp,
      bgColor: 'bg-orange-100 dark:bg-orange-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ]

  // Mock recent activity data
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'registration',
      title: 'New Institution Registered',
      description: 'Delhi Public School registered and awaiting verification',
      time: '5 minutes ago',
    },
    {
      id: '2',
      type: 'verification',
      title: 'Institution Verified',
      description: 'St. Mary\'s College has been verified and activated',
      time: '1 hour ago',
    },
    {
      id: '3',
      type: 'login',
      title: 'Admin Login',
      description: 'Admin from ABC Institute logged in',
      time: '2 hours ago',
    },
    {
      id: '4',
      type: 'suspension',
      title: 'Institution Suspended',
      description: 'XYZ Coaching Center suspended due to policy violation',
      time: '3 hours ago',
    },
  ]

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'registration':
        return <div className="w-2 h-2 rounded-full bg-blue-500" />
      case 'verification':
        return <div className="w-2 h-2 rounded-full bg-emerald-500" />
      case 'suspension':
        return <div className="w-2 h-2 rounded-full bg-red-500" />
      case 'login':
        return <div className="w-2 h-2 rounded-full bg-purple-500" />
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your platform.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6 hover:border-gray-300 dark:hover:border-slate-600/50 transition-colors shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                stat.isPositive 
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {stat.isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="mt-2">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{activity.time}</span>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-700/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
            View All Activity
          </button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-slate-700/50 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Institution Types</h2>
          
          <div className="space-y-4">
            {[
              { label: 'Schools', value: 45, color: 'bg-blue-500' },
              { label: 'Colleges', value: 28, color: 'bg-emerald-500' },
              { label: 'Institutes', value: 18, color: 'bg-purple-500' },
              { label: 'Coaching Centers', value: 9, color: 'bg-orange-500' },
            ].map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <a
                href="/super-admin/institutions"
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-gray-900 dark:text-white text-sm"
              >
                <Building2 className="w-4 h-4 text-blue-500" />
                View All Institutions
              </a>
              <a
                href="/super-admin/users"
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-gray-900 dark:text-white text-sm"
              >
                <Users className="w-4 h-4 text-emerald-500" />
                Manage Users
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
