'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import { 
  Library, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Book, 
  Download, 
  Eye, 
  Search,
  FolderOpen,
  ArrowUpRight,
  BookOpen
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string | null
  resourceType: string
  fileUrl: string
  thumbnailUrl: string | null
  fileSize: number | null
  chapter: string | null
  subject: { name: string; code: string; color: string } | null
  academicUnit: { name: string } | null
  allowDownload: boolean
  createdAt: string
}

export default function ResourcesPage() {
  const { data: session } = useSession()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    const fetchResources = async () => {
      try {
        let url = '/api/institution/resources?'
        if (subjectFilter) url += `subjectId=${subjectFilter}&`
        if (typeFilter) url += `resourceType=${typeFilter}&`
        
        const res = await fetch(url)
        const data = await res.json()
        setResources(data.resources || [])
      } catch (error) {
        console.error('Error fetching resources:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [subjectFilter, typeFilter])

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-6 h-6" />
      case 'VIDEO':
        return <Video className="w-6 h-6" />
      case 'LINK':
        return <LinkIcon className="w-6 h-6" />
      case 'IMAGE':
        return <FolderOpen className="w-6 h-6" />
      default:
        return <Book className="w-6 h-6" />
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
  }

  // Group resources by subject
  const groupedResources = resources.reduce((acc: { [key: string]: Resource[] }, resource) => {
    const key = resource.subject?.name || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(resource)
    return acc
  }, {})

  const pdfCount = resources.filter(r => r.resourceType === 'PDF').length
  const videoCount = resources.filter(r => r.resourceType === 'VIDEO').length
  const linkCount = resources.filter(r => r.resourceType === 'LINK').length
  const docCount = resources.filter(r => r.resourceType === 'DOCUMENT').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Study Resources</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Access course materials, videos, and reference links</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="PDF Documents"
          value={pdfCount.toString()}
          change="Reference files"
          trend="up"
          icon={FileText}
          color="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        />
        <StatCard
          title="Video Lessons"
          value={videoCount.toString()}
          change="Watch & Learn"
          trend="up"
          icon={Video}
          color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Useful Links"
          value={linkCount.toString()}
          change="External sources"
          trend="up"
          icon={LinkIcon}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Course Books"
          value={docCount.toString()}
          change="Study material"
          trend="up"
          icon={Book}
          color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700 w-full md:w-fit overflow-x-auto">
          {['', 'PDF', 'VIDEO', 'LINK', 'DOCUMENT'].map((type) => (
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
              {type === '' ? 'All Material' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : Object.keys(groupedResources).length === 0 ? (
        <Card className="border-none shadow-soft p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Resources Found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {typeFilter ? `No ${typeFilter.toLowerCase()} resources match your current filters.` : 'Stay tuned for study materials shared by your teachers!'}
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedResources).map(([subject, subjectResources]) => (
            <div key={subject} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{subject}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectResources.map((resource) => (
                  <Card
                    key={resource.id}
                    className="border-none shadow-soft hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                          resource.resourceType === 'PDF' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                          resource.resourceType === 'VIDEO' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' :
                          resource.resourceType === 'LINK' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                          'bg-green-50 dark:bg-green-900/20 text-green-600'
                        }`}>
                          {getResourceIcon(resource.resourceType)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                            {resource.resourceType}
                          </Badge>
                          {resource.fileSize && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {formatFileSize(resource.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors mb-2 line-clamp-1">
                        {resource.title}
                      </h3>
                      
                      {resource.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                          {resource.description}
                        </p>
                      )}

                      {resource.chapter && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 mb-4 bg-primary-50 dark:bg-primary-900/20 w-fit px-2 py-1 rounded-lg">
                          <Library className="w-3 h-3" />
                          Chapter: {resource.chapter}
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-dark-800">
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-xl text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                        {resource.allowDownload && (
                          <a
                            href={resource.fileUrl}
                            download
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-dark-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-dark-700 transition-all border border-gray-100 dark:border-dark-700"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
