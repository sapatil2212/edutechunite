'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Briefcase,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface ParentProfile {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  alternatePhone: string | null
  occupation: string | null
  organization: string | null
  address: string | null
  children: Array<{
    student: {
      id: string
      fullName: string
      admissionNumber: string
      academicUnit: { name: string }
    }
    relationship: string
  }>
}

export default function ParentProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ParentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/institution/profile')
        const data = await res.json()
        setProfile(data.user)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }
    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/institution/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      })
      const result = await res.json()
      if (res.ok) {
        setPasswordStatus({ type: 'success', message: 'Password updated successfully' })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordStatus({ type: 'error', message: result.error || 'Failed to update password' })
      }
    } catch (error) {
      setPasswordStatus({ type: 'error', message: 'Something went wrong' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and security</p>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-none shadow-soft overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-600 to-teal-700"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end gap-6 -mt-12">
            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-dark-800 p-2 shadow-xl shrink-0 border border-gray-100 dark:border-dark-700">
              <div className="w-full h-full rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 text-4xl font-bold">
                {profile?.fullName.charAt(0)}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{profile?.fullName}</h2>
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Parent/Guardian Portal
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {profile?.children?.length || 0} Children Enrolled
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Selector */}
      <div className="flex bg-gray-100 dark:bg-dark-800 p-1 rounded-2xl border border-gray-200 dark:border-dark-700 w-fit">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'info'
              ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-soft'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          General Information
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'password'
              ? 'bg-white dark:bg-dark-700 text-green-700 dark:text-green-400 shadow-soft'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Security & Password
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Personal & Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <DetailItem label="Full Name" value={profile?.fullName || ''} icon={User} />
                    <DetailItem label="Email Address" value={profile?.email || 'Not provided'} icon={Mail} />
                    <DetailItem label="Phone Number" value={profile?.phone || 'Not provided'} icon={Phone} />
                  </div>
                  <div className="space-y-6">
                    <DetailItem label="Occupation" value={profile?.occupation || 'Not specified'} icon={Briefcase} />
                    <DetailItem label="Organization" value={profile?.organization || 'Not specified'} icon={Globe} />
                    <DetailItem label="Address" value={profile?.address || 'Not provided'} icon={MapPin} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft overflow-hidden">
              <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Linked Children
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile?.children?.map((c, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-800 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center text-green-600 font-bold shadow-sm">
                        {c.student.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{c.student.fullName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{c.student.academicUnit.name}</p>
                        <Badge variant="secondary" className="mt-1 text-[8px] font-black">{c.relationship}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl animate-in slide-in-from-bottom-4">
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                {passwordStatus && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    passwordStatus.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-100' 
                      : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {passwordStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{passwordStatus.message}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className="rounded-xl border-gray-200 dark:border-dark-700 pl-10"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                      />
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">New Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="rounded-xl border-gray-200 dark:border-dark-700 pl-10"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          required
                        />
                        <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          className="rounded-xl border-gray-200 dark:border-dark-700 pl-10"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          required
                        />
                        <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-xl font-bold py-6 bg-green-600 hover:bg-green-700 shadow-soft"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-dark-900/30 border border-transparent hover:border-gray-100 dark:hover:border-dark-800 hover:bg-white dark:hover:bg-dark-800 transition-all">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center shadow-sm border border-gray-50 dark:border-dark-700 text-gray-400 group-hover:text-green-600 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
        <p className="font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  )
}
