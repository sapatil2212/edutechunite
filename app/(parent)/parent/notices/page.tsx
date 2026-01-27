'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Calendar, 
  Search, 
  Filter,
  FileText,
  Download,
  ExternalLink,
  Users
} from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  noticeType: string
  priority: string
  publishedAt: string
  attachmentUrl: string | null
}

export default function ParentNoticesPage() {
  const { data: session } = useSession()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/institution/notices')
      const data = await res.json()
      setNotices(data.notices || [])
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'NORMAL': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         notice.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'ALL' || notice.noticeType === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notices & Announcements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stay updated with important information from the school</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notices..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-xl border border-gray-200 dark:border-dark-700 h-fit">
          {['ALL', 'ACADEMIC', 'EVENT', 'URGENT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === type 
                  ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          </div>
        ) : filteredNotices.length === 0 ? (
          <Card className="border-none shadow-soft p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Notices Found</h3>
            <p className="text-gray-500 dark:text-gray-400">There are no recent notices matching your criteria.</p>
          </Card>
        ) : (
          filteredNotices.map((notice) => (
            <Card key={notice.id} className="border-none shadow-soft hover:shadow-lg transition-all duration-300 group">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 flex md:flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex flex-col items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                      <span className="text-[10px] font-black uppercase">{new Date(notice.publishedAt).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-2xl font-black leading-none">{new Date(notice.publishedAt).getDate()}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(notice.priority)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-100 dark:bg-dark-900 text-gray-600 dark:text-gray-400 font-bold border-none text-[10px] px-2 uppercase tracking-widest">
                        {notice.noticeType}
                      </Badge>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notice.publishedAt).getFullYear()}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-700 transition-colors">
                      {notice.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                      {notice.content}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      {notice.attachmentUrl && (
                        <a 
                          href={notice.attachmentUrl} 
                          target="_blank" 
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-xs font-bold hover:bg-green-100 transition-all border border-green-100 dark:border-green-900/30 shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download Resource
                        </a>
                      )}
                      <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-green-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        View Full Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
