'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  Bell, 
  Megaphone, 
  AlertTriangle, 
  Calendar, 
  BookOpen, 
  Gift, 
  FileText,
  ChevronDown,
  Paperclip,
  Clock,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  noticeType: string
  priority: string
  attachments: any[] | null
  publishedAt: string
}

export default function NoticesPage() {
  const { data: session } = useSession()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        let url = '/api/institution/notices?'
        if (typeFilter) url += `noticeType=${typeFilter}&`
        
        const res = await fetch(url)
        const data = await res.json()
        setNotices(data.notices || [])
      } catch (error) {
        console.error('Error fetching notices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotices()
  }, [typeFilter])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ACADEMIC':
        return <BookOpen className="w-5 h-5" />
      case 'EVENT':
        return <Gift className="w-5 h-5" />
      case 'HOLIDAY':
        return <Calendar className="w-5 h-5" />
      case 'EXAM':
        return <FileText className="w-5 h-5" />
      default:
        return <Megaphone className="w-5 h-5" />
    }
  }

  const criticalCount = notices.filter(n => n.priority === 'CRITICAL').length
  const highPriorityCount = notices.filter(n => n.priority === 'HIGH').length
  const eventsCount = notices.filter(n => n.noticeType === 'EVENT').length
  const academicsCount = notices.filter(n => n.noticeType === 'ACADEMIC').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notices & Announcements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stay updated with the latest news and information from your institution</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Critical Alerts"
          value={criticalCount.toString()}
          change="Urgent attention"
          trend="down"
          icon={AlertTriangle}
          color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Academic"
          value={academicsCount.toString()}
          change="Studies & Exams"
          trend="up"
          icon={BookOpen}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Events"
          value={eventsCount.toString()}
          change="Upcoming activities"
          trend="up"
          icon={Gift}
          color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="General"
          value={(notices.length - academicsCount - eventsCount).toString()}
          change="Total notices"
          trend="up"
          icon={Megaphone}
          color="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700 w-full md:w-fit overflow-x-auto">
          {['', 'GENERAL', 'ACADEMIC', 'EVENT', 'EXAM'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`
                px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
                ${typeFilter === type 
                  ? 'bg-white dark:bg-dark-700 text-primary-700 dark:text-primary-400 shadow-soft' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
              `}
            >
              {type === '' ? 'All Notices' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search notices..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : notices.length === 0 ? (
        <Card className="border-none shadow-soft p-12 text-center">
          <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Notices Found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {typeFilter ? `There are no ${typeFilter.toLowerCase()} notices to display.` : 'Stay tuned for upcoming announcements!'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white dark:bg-dark-800 rounded-2xl shadow-soft transition-all duration-300 overflow-hidden group cursor-pointer ${selectedNotice?.id === notice.id ? 'ring-2 ring-primary/50' : 'hover:shadow-md'}`}
              onClick={() => setSelectedNotice(selectedNotice?.id === notice.id ? null : notice)}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${
                    notice.noticeType === 'ACADEMIC' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                    notice.noticeType === 'EVENT' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' :
                    notice.noticeType === 'EXAM' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                    'bg-gray-50 dark:bg-dark-800 text-gray-600'
                  }`}>
                    {getTypeIcon(notice.noticeType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className={`text-lg font-bold text-gray-900 dark:text-white transition-colors ${selectedNotice?.id === notice.id ? 'text-primary-600' : 'group-hover:text-primary-600'}`}>
                        {notice.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          notice.priority === 'CRITICAL' ? 'danger' :
                          notice.priority === 'HIGH' ? 'warning' :
                          notice.priority === 'MEDIUM' ? 'primary' : 'secondary'
                        }>
                          {notice.priority}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 dark:bg-dark-900/50 px-2 py-1 rounded-lg">
                          <Clock className="w-3 h-3" />
                          {new Date(notice.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`transition-all duration-300 overflow-hidden ${selectedNotice?.id === notice.id ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-12 opacity-80'}`}>
                      <div className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed ${selectedNotice?.id === notice.id ? '' : 'line-clamp-2'}`}>
                        <p className="whitespace-pre-wrap">{notice.content}</p>
                      </div>
                      
                      {selectedNotice?.id === notice.id && (
                        <>
                          {notice.attachments && notice.attachments.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-800">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Paperclip className="w-3 h-3" />
                                Attachments ({notice.attachments.length})
                              </h4>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {notice.attachments.map((attachment: any, index: number) => (
                                  <a
                                    key={index}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-800 hover:border-primary-200 dark:hover:border-primary-900/30 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group/file"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-dark-800 flex items-center justify-center text-primary-600 shadow-sm border border-gray-100 dark:border-dark-700">
                                        <FileText className="w-4 h-4" />
                                      </div>
                                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{attachment.name}</span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover/file:text-primary-600 transition-colors shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-6 flex justify-end">
                            <button className="text-xs font-bold text-gray-400 hover:text-primary-600 transition-colors uppercase tracking-widest flex items-center gap-1">
                              Close Details <ChevronDown className="w-3 h-3 rotate-180" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {selectedNotice?.id !== notice.id && (
                    <div className="shrink-0 flex items-center self-center sm:self-auto">
                      <ChevronDown className="w-5 h-5 text-gray-300 group-hover:text-primary-400 transition-colors" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
