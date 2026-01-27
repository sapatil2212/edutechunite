'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Search, 
  Loader2,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Plus,
  MoreVertical,
  ExternalLink,
  Filter,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Resource {
  id: string
  title: string
  description: string | null
  resourceType: 'PDF' | 'VIDEO' | 'LINK' | 'DOCUMENT' | 'IMAGE' | 'AUDIO' | 'OTHER'
  fileUrl: string
  thumbnailUrl: string | null
  fileSize: number | null
  mimeType: string | null
  chapter: string | null
  createdAt: string
  subject: {
    name: string
    code: string
    color: string | null
  } | null
  academicUnit: {
    name: string
  } | null
}

export default function TeacherResourcesPage() {
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<Resource[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    resourceType: 'PDF',
    fileUrl: '',
    subjectId: '',
    academicUnitId: '',
    chapter: ''
  })

  useEffect(() => {
    fetchResources()
    fetchMetadata()
  }, [])

  const fetchMetadata = async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        fetch('/api/institution/teachers/subjects'),
        fetch('/api/institution/academic-units')
      ])
      const [subjectsData, classesData] = await Promise.all([
        subjectsRes.json(),
        classesRes.json()
      ])
      if (subjectsData.data) setSubjects(subjectsData.data)
      if (classesData.academicUnits) {
        // Only top-level classes or filter as needed
        setClasses(classesData.academicUnits)
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    }
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/institution/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource)
      })
      if (res.ok) {
        setShowModal(false)
        fetchResources()
        setNewResource({
          title: '',
          description: '',
          resourceType: 'PDF',
          fileUrl: '',
          subjectId: '',
          academicUnitId: '',
          chapter: ''
        })
      } else {
        alert('Failed to add resource')
      }
    } catch (error) {
      console.error('Add resource error:', error)
    } finally {
      setSaving(false)
    }
  }

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/institution/resources')
      const data = await res.json()
      if (data.resources) {
        setResources(data.resources)
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-6 h-6 text-red-500" />
      case 'VIDEO': return <Video className="w-6 h-6 text-blue-500" />
      case 'LINK': return <LinkIcon className="w-6 h-6 text-green-500" />
      default: return <FileText className="w-6 h-6 text-gray-500" />
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.chapter?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || resource.resourceType === filterType
    return matchesSearch && matchesType
  })

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
            Study Materials
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and share digital resources with your students
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold h-11"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Resource
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-none shadow-2xl bg-white dark:bg-dark-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Study Material</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="rounded-full">
                <XCircle className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            <form onSubmit={handleAddResource}>
              <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Resource Title</label>
                  <Input 
                    required
                    placeholder="e.g., Introduction to Algebra"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newResource.resourceType}
                      onChange={(e) => setNewResource({...newResource, resourceType: e.target.value as any})}
                    >
                      <option value="PDF">PDF Document</option>
                      <option value="VIDEO">Video Link</option>
                      <option value="LINK">External Link</option>
                      <option value="DOCUMENT">Word/Doc</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Chapter/Topic</label>
                    <Input 
                      placeholder="e.g., Chapter 1"
                      value={newResource.chapter}
                      onChange={(e) => setNewResource({...newResource, chapter: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Subject</label>
                    <select
                      required
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newResource.subjectId}
                      onChange={(e) => setNewResource({...newResource, subjectId: e.target.value})}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Class/Unit (Optional)</label>
                    <select
                      className="w-full h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newResource.academicUnitId}
                      onChange={(e) => setNewResource({...newResource, academicUnitId: e.target.value})}
                    >
                      <option value="">All Classes</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">File URL / Link</label>
                  <Input 
                    required
                    placeholder="https://..."
                    value={newResource.fileUrl}
                    onChange={(e) => setNewResource({...newResource, fileUrl: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Briefly describe this resource..."
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
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
                  className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold px-8 shadow-soft"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Resource'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search resources by title or chapter..."
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select
                className="h-11 px-4 bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="PDF">PDF Documents</option>
                <option value="VIDEO">Videos</option>
                <option value="LINK">External Links</option>
              </select>
              <Button variant="ghost" className="h-11 rounded-xl border border-gray-100 dark:border-dark-700">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card 
              key={resource.id} 
              className="group hover:shadow-lg transition-all duration-300 border-none shadow-soft overflow-hidden bg-white dark:bg-dark-800"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
                      {getResourceIcon(resource.resourceType)}
                    </div>
                    <Badge variant="secondary">
                      {resource.resourceType}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {resource.description || 'No description provided.'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5" />
                      {resource.subject?.name} • {resource.academicUnit?.name}
                    </div>
                    {resource.chapter && (
                      <div className="text-xs font-medium text-primary-700 bg-primary/10 px-2 py-1 rounded-md inline-block">
                        Chapter: {resource.chapter}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {resource.resourceType === 'LINK' ? (
                      <a 
                        href={resource.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button className="w-full bg-primary hover:bg-primary-600 text-black border-none rounded-xl h-10 font-bold">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Link
                        </Button>
                      </a>
                    ) : (
                      <a 
                        href={resource.fileUrl} 
                        download
                        className="flex-1"
                      >
                        <Button className="w-full bg-primary hover:bg-primary-600 text-black border-none rounded-xl h-10 font-bold">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl border border-gray-100 dark:border-dark-700">
                      <MoreVertical className="w-4 h-4" />
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
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Resources Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              You haven't uploaded any study materials yet or none match your search.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
