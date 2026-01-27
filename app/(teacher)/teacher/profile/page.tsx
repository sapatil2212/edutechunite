'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  Shield, 
  Calendar,
  Loader2,
  Camera,
  Save,
  Lock,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'

export default function TeacherProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: ''
  })

  useEffect(() => {
    if (session?.user?.teacherId) {
      fetchProfile(session.user.teacherId)
    }
  }, [session])

  const fetchProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/institution/teachers/${id}`)
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        setFormData({
          fullName: data.data.fullName,
          email: data.data.email || '',
          phone: data.data.phone || '',
          qualification: data.data.qualification || '',
          specialization: data.data.specialization || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/institution/teachers/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsEditing(false)
        fetchProfile(profile.id)
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile')
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
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
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information and account settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-xl border border-gray-100 dark:border-dark-700">
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className="bg-primary hover:bg-primary-600 text-black border-none rounded-xl font-bold min-w-[120px]"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              'Edit Profile'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="space-y-6">
          <Card className="border-none shadow-soft bg-white dark:bg-dark-800 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-24 bg-primary/20" />
              <div className="px-6 pb-6 -mt-12 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-dark-900 p-1 shadow-md">
                    <div className="w-full h-full rounded-xl bg-primary/10 flex items-center justify-center text-primary-700 font-bold text-3xl overflow-hidden">
                      {profile.fullName.charAt(0)}
                    </div>
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-lg shadow-soft border-2 border-white dark:border-dark-900 hover:scale-110 transition-transform">
                    <Camera className="w-3.5 h-3.5 text-dark-900" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.fullName}</h2>
                <p className="text-sm text-gray-500 mb-4">{profile.qualification || 'Senior Teacher'}</p>
                <div className="flex justify-center gap-2">
                  <Badge variant="primary">{profile.employeeId}</Badge>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              <div className="border-t border-gray-50 dark:border-dark-700 p-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{profile.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{profile.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Teacher Role</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-primary/5">
            <CardContent className="p-6">
              <h4 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Workload Overview
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary-800/70">Max Periods / Day</span>
                  <span className="font-bold text-primary-900">{profile.maxPeriodsPerDay}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary-800/70">Max Periods / Week</span>
                  <span className="font-bold text-primary-900">{profile.maxPeriodsPerWeek}</span>
                </div>
                <div className="w-full bg-primary/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-700" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  readOnly={!isEditing}
                />
                <Input
                  label="Employee ID"
                  defaultValue={profile.employeeId}
                  readOnly
                />
                <Input
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  readOnly={!isEditing}
                />
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  readOnly={!isEditing}
                />
                <Input
                  label="Qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  readOnly={!isEditing}
                />
                <Input
                  label="Specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  readOnly={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-white dark:bg-dark-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-700" />
                Subject Assignments
              </h3>
              <div className="flex flex-wrap gap-3">
                {profile.subjectAssignments?.map((sa: any) => (
                  <div 
                    key={sa.subject.id}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: sa.subject.color ? `${sa.subject.color}20` : '#E5F33C20', color: sa.subject.color || '#718300' }}
                    >
                      {sa.subject.code}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{sa.subject.name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject ID: {sa.subject.id.slice(-4)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
