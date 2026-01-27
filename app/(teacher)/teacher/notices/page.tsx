'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Search, 
  Loader2,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Plus,
  MoreVertical,
  Megaphone,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Notice {
  id: string
  title: string
  content: string
  noticeType: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  publishedAt: string
}

export default function TeacherNoticesPage() {
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState<Notice[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    noticeType: 'GENERAL',
    priority: 'MEDIUM',
    targetType: 'ALL'
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/institution/notices')
      const data = await res.json()
      if (data.notices) {
        setNotices(data.notices)
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <Badge variant="danger">Critical</Badge>
      case 'HIGH': return <Badge variant="warning">High</Badge>
      case 'MEDIUM': return <Badge variant="info">Medium</Badge>
      case 'LOW': return <Badge variant="secondary">Low</Badge>
      default: return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/institution/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNotice,
          isPublished: true
        })
      })
      if (res.ok) {
        setShowModal(false)
        fetchNotices()
        setNewNotice({
          title: '',
          content: '',
          noticeType: 'GENERAL',
          priority: 'MEDIUM',
          targetType: 'ALL'
        })
      } else {
        alert('Failed to post notice')
      }
    } catch (error) {
      console.error('Post error:', error)
    } finally {
      setSaving(false)
    }
  }

  const filteredNotices = notices.filter(notice => 
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notices & Announcements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with school announcements and academic notices
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold h-11"
        >
          <Plus className="w-5 h-5 mr-2" />
          Post Notice
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-none shadow-2xl bg-white dark:bg-dark-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Post New Notice</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="rounded-full">
                <XCircle className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            <form onSubmit={handlePostNotice}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Notice Title</label>
                  <Input 
                    required
                    placeholder="e.g., Upcoming Science Exhibition"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newNotice.noticeType}
                      onChange={(e) => setNewNotice({...newNotice, noticeType: e.target.value})}
                    >
                      <option value="GENERAL">General</option>
                      <option value="ACADEMIC">Academic</option>
                      <option value="EVENT">Event</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Priority</label>
                    <select
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newNotice.priority}
                      onChange={(e) => setNewNotice({...newNotice, priority: e.target.value as any})}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Content</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Write the notice content here..."
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                  />
                </div>
              </CardContent>
              <div className="p-6 bg-gray-50 dark:bg-dark-900/50 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold px-8"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Publish Notice'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search notices..."
          className="pl-9 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotices.map((notice) => (
            <Card 
              key={notice.id} 
              className={`border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800 ${
                notice.priority === 'CRITICAL' ? 'ring-2 ring-red-500/20' : ''
              }`}
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        notice.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                        notice.priority === 'HIGH' ? 'bg-amber-100 text-amber-600' :
                        'bg-primary/20 text-primary-700'
                      }`}>
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {notice.title}
                          </h3>
                          {getPriorityBadge(notice.priority)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(notice.publishedAt)}
                          <span className="mx-1">•</span>
                          <Badge variant="secondary" className="text-[10px] uppercase">{notice.noticeType}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                    {notice.content}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-dark-700">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notice ID: #{notice.id.slice(-6)}</span>
                    <Button variant="ghost" size="sm" className="text-primary-700 font-bold hover:bg-primary/10">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-soft py-20 text-center bg-white dark:bg-dark-800">
          <CardContent>
            <div className="w-20 h-20 bg-gray-50 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Notices Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              There are no notices or announcements matching your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
