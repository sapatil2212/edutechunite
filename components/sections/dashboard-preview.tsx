'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp,
  Calendar,
  UserPlus,
  CreditCard,
} from 'lucide-react';

export const DashboardPreview: React.FC = () => {
  return (
    <div className="relative">
      {/* Main Dashboard Card */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-dark-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Dashboard Overview</h2>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold">SP</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-white/80">Welcome back! Here's what's happening with your institution today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-dark-900">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Students</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">2</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500 font-medium">+0.0%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Courses</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500 font-medium">+0.0%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹34,999</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500 font-medium">+0.0%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Attendance Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">0.0%</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500 font-medium">+0.0%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </motion.div>
        </div>

        {/* Recent Activities & Upcoming Classes */}
        <div className="grid grid-cols-2 gap-4 p-6">
          {/* Recent Activities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
              <button className="text-xs text-primary hover:underline">View all</button>
            </div>
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-3 p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
              >
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">Payment received</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Fee payment of ₹25,000 from swapnil patil</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">11 minutes ago</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-start gap-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">New student enrollment</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">swapnil patil enrolled in the institution</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">11 minutes ago</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-start gap-3 p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
              >
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">Payment received</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Fee payment of ₹9,999 from swapnil patil</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">28 minutes ago</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Upcoming Classes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Upcoming Classes</h3>
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Mathematics</p>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">09:00 AM</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Smith</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>ROOM 101</span>
                  <span>•</span>
                  <span>45 STUDENTS</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Physics</p>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">11:00 AM</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Prof. Johnson</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>LAB 203</span>
                  <span>•</span>
                  <span>38 STUDENTS</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Chemistry</p>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">02:00 PM</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dr. Williams</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>LAB 305</span>
                  <span>•</span>
                  <span>42 STUDENTS</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute -bottom-4 -right-4 flex gap-2"
      >
        <div className="w-12 h-12 bg-pink-500 rounded-full shadow-lg flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="w-12 h-12 bg-blue-600 rounded-full shadow-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/20 rounded-2xl rotate-12 blur-sm" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/20 rounded-2xl -rotate-12 blur-sm" />
    </div>
  );
};
