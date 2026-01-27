'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
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
  Calendar, 
  ShieldCheck, 
  Fingerprint, 
  Users, 
  FileText, 
  Download,
  AlertCircle,
  Briefcase,
  Heart,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react'

interface StudentProfile {
  id: string
  admissionNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  fullName: string
  dateOfBirth: string
  gender: string
  bloodGroup: string | null
  nationality: string | null
  email: string | null
  phone: string | null
  emergencyContact: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  profilePhoto: string | null
  stream: string | null
  program: string | null
  rollNumber: string | null
  status: string
  academicYear: { name: string }
  academicUnit: { name: string; parent?: { name: string } | null }
  guardians: Array<{
    guardian: {
      fullName: string
      phone: string
      email: string | null
      relationship: string
      occupation: string | null
    }
    isPrimary: boolean
  }>
  documents: Array<{
    id: string
    documentType: string
    name: string
    fileUrl: string
    isVerified: boolean
  }>
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'info')
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Profile Not Found</h3>
        <p className="text-gray-500">Unable to load your profile information.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage your personal information</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="border-none shadow-soft overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end gap-6 -mt-12">
            <div className="w-32 h-32 rounded-3xl bg-white dark:bg-dark-800 p-2 shadow-xl shrink-0 border border-gray-100 dark:border-dark-700">
              <div className="w-full h-full rounded-2xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 text-4xl font-bold overflow-hidden">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  profile.fullName.charAt(0)
                )}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.fullName}</h2>
                <Badge variant="primary" className="font-bold uppercase tracking-wider">{profile.status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-gray-500 dark:text-gray-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4" />
                  ID: {profile.admissionNumber}
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {profile.academicUnit?.name}
                </div>
                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                  <Calendar className="w-4 h-4" />
                  {profile.academicYear?.name}
                </div>
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
            activeTab === 'info' || activeTab === 'profile'
              ? 'bg-white dark:bg-dark-700 text-primary-700 dark:text-primary-400 shadow-soft'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          General Information
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'password'
              ? 'bg-white dark:bg-dark-700 text-primary-700 dark:text-primary-400 shadow-soft'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Change Password
        </button>
      </div>

      {activeTab === 'password' ? (
        <div className="max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-600" />
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

                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">Password Requirements:</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 ml-4 list-disc">
                    <li>At least 8 characters long</li>
                    <li>Must contain at least one uppercase letter</li>
                    <li>Must contain at least one number</li>
                    <li>Must contain at least one special character</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-xl font-bold py-6 shadow-soft"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <DetailItem label="Full Name" value={profile.fullName} icon={User} />
                  <DetailItem label="Date of Birth" value={new Date(profile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'long' })} icon={Calendar} />
                  <DetailItem label="Gender" value={profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()} icon={User} />
                </div>
                <div className="space-y-6">
                  <DetailItem label="Blood Group" value={profile.bloodGroup || 'Not Specified'} icon={Heart} />
                  <DetailItem label="Nationality" value={profile.nationality || 'Not Specified'} icon={Globe} />
                  <DetailItem label="Roll Number" value={profile.rollNumber || 'Not Assigned'} icon={Fingerprint} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-600" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <DetailItem label="Email Address" value={profile.email || 'Not Provided'} icon={Mail} />
                  <DetailItem label="Phone Number" value={profile.phone || 'Not Provided'} icon={Phone} />
                </div>
                <div className="space-y-6">
                  <DetailItem label="Emergency Contact" value={profile.emergencyContact || 'Not Provided'} icon={AlertCircle} />
                  <DetailItem 
                    label="Current Address" 
                    value={profile.address ? `${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}` : 'Not Provided'} 
                    icon={MapPin} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar style */}
        <div className="space-y-6">
          {/* Guardian Information */}
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Guardians
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {profile.guardians?.map((g, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-2xl border ${g.isPrimary ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20' : 'bg-gray-50 dark:bg-dark-900/50 border-gray-100 dark:border-dark-800'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900 dark:text-white">{g.guardian.fullName}</span>
                    <Badge variant={g.isPrimary ? 'primary' : 'secondary'} className="text-[10px] font-bold uppercase tracking-wider">
                      {g.guardian.relationship}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <Phone className="w-3 h-3" />
                      {g.guardian.phone}
                    </div>
                    {g.guardian.email && (
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <Mail className="w-3 h-3" />
                        {g.guardian.email}
                      </div>
                    )}
                    {g.guardian.occupation && (
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <Briefcase className="w-3 h-3" />
                        {g.guardian.occupation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b border-gray-50 dark:border-dark-800 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {profile.documents?.map((doc) => (
                <div key={doc.id} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-900/50 rounded-xl border border-gray-100 dark:border-dark-800 hover:border-primary-100 dark:hover:border-primary-900/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-dark-800 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 dark:border-dark-700 group-hover:text-primary-600 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{doc.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{doc.documentType.replace(/_/g, ' ')}</span>
                        {doc.isVerified && <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 rounded uppercase">Verified</span>}
                      </div>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
              {(!profile.documents || profile.documents.length === 0) && (
                <div className="text-center py-6">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-dark-900/30 border border-transparent hover:border-gray-100 dark:hover:border-dark-800 hover:bg-white dark:hover:bg-dark-800 transition-all">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-800 flex items-center justify-center shadow-sm border border-gray-50 dark:border-dark-700 text-gray-400 group-hover:text-primary-600 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{label}</label>
        <p className="font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  )
}
