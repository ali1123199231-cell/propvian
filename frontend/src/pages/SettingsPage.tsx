import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Settings, User, Lock, Bell, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { apiClient } from '@/api/client'

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const accessSettingsSchema = z.object({
  defaultCheckInTime: z.string().min(1, 'Required'),
  defaultCheckOutTime: z.string().min(1, 'Required'),
  codeActivationHoursBefore: z.coerce.number().int().min(0).max(72),
  codeExpirationHoursAfter: z.coerce.number().int().min(0).max(72),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type AccessSettingsData = z.infer<typeof accessSettingsSchema>

const ACCESS_SETTINGS_KEY = 'smartlock_access_settings'

function loadAccessSettings(): AccessSettingsData {
  try {
    const raw = localStorage.getItem(ACCESS_SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { defaultCheckInTime: '15:00', defaultCheckOutTime: '11:00', codeActivationHoursBefore: 1, codeExpirationHoursAfter: 1 }
}

export function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'access'>('profile')

  const { register: rProfile, handleSubmit: hsProfile, formState: { errors: eProfile } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', avatarUrl: user?.avatarUrl ?? '' },
  })

  const { register: rPwd, handleSubmit: hsPwd, reset: resetPwd, formState: { errors: ePwd } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const { register: rAccess, handleSubmit: hsAccess, formState: { errors: eAccess } } = useForm<AccessSettingsData>({
    resolver: zodResolver(accessSettingsSchema),
    defaultValues: loadAccessSettings(),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (d: ProfileFormData) => apiClient.put('/users/me', d),
    onSuccess: () => toast.success('Profile updated'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (d: PasswordFormData) => apiClient.put('/users/me/password', {
      currentPassword: d.currentPassword,
      newPassword: d.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed')
      resetPwd()
    },
  })

  const saveAccessSettings = (d: AccessSettingsData) => {
    localStorage.setItem(ACCESS_SETTINGS_KEY, JSON.stringify(d))
    toast.success('Access settings saved')
  }

  const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'access', label: 'Access Settings', icon: Clock },
  ] as const

  return (
    <div>
      <TopBar title="Settings" />
      <div className="p-6 max-w-2xl">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl border border-gray-200">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Profile Information</h3>
            <form onSubmit={hsProfile(d => updateProfileMutation.mutate(d))} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-2xl font-bold text-primary-600">
                  {user?.firstName?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input {...rProfile('firstName')} className="input-base w-full" />
                  {eProfile.firstName && <p className="text-red-500 text-xs mt-1">{eProfile.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input {...rProfile('lastName')} className="input-base w-full" />
                  {eProfile.lastName && <p className="text-red-500 text-xs mt-1">{eProfile.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={user?.email ?? ''} disabled className="input-base w-full opacity-60 cursor-not-allowed bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <input {...rProfile('avatarUrl')} className="input-base w-full" placeholder="https://..." />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary">
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Change Password</h3>
            <form onSubmit={hsPwd(d => changePasswordMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input {...rPwd('currentPassword')} type="password" className="input-base w-full" />
                {ePwd.currentPassword && <p className="text-red-500 text-xs mt-1">{ePwd.currentPassword.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input {...rPwd('newPassword')} type="password" className="input-base w-full" />
                {ePwd.newPassword && <p className="text-red-500 text-xs mt-1">{ePwd.newPassword.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input {...rPwd('confirmPassword')} type="password" className="input-base w-full" />
                {ePwd.confirmPassword && <p className="text-red-500 text-xs mt-1">{ePwd.confirmPassword.message}</p>}
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={changePasswordMutation.isPending} className="btn-primary">
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Notification Preferences</h3>
            <div className="space-y-1">
              {[
                { label: 'Access code created', description: 'When a guest PIN is generated' },
                { label: 'Access code failed', description: 'When PIN creation fails' },
                { label: 'Reservation created', description: 'New booking from calendar sync' },
                { label: 'Lock disconnected', description: 'When a lock loses connection' },
                { label: 'Low battery alert', description: 'When battery drops below 20%' },
                { label: 'Sync errors', description: 'iCal feed sync failures' },
              ].map(({ label, description }) => (
                <div key={label} className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Settings tab */}
        {activeTab === 'access' && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-1">Default Check-In / Check-Out Times</h3>
              <p className="text-sm text-gray-500 mb-5">
                Used when creating manual reservations or when the booking platform doesn't provide specific times.
              </p>
              <form onSubmit={hsAccess(saveAccessSettings)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Check-In Time
                    </label>
                    <input
                      {...rAccess('defaultCheckInTime')}
                      type="time"
                      className="input-base w-full"
                    />
                    {eAccess.defaultCheckInTime && <p className="text-red-500 text-xs mt-1">{eAccess.defaultCheckInTime.message}</p>}
                    <p className="text-xs text-gray-400 mt-1">e.g. 3:00 PM = 15:00</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Check-Out Time
                    </label>
                    <input
                      {...rAccess('defaultCheckOutTime')}
                      type="time"
                      className="input-base w-full"
                    />
                    {eAccess.defaultCheckOutTime && <p className="text-red-500 text-xs mt-1">{eAccess.defaultCheckOutTime.message}</p>}
                    <p className="text-xs text-gray-400 mt-1">e.g. 11:00 AM = 11:00</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Access Code Validity Window</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Controls when guest PIN codes become active and expire relative to check-in/check-out times.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Activate code before check-in
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          {...rAccess('codeActivationHoursBefore')}
                          type="number"
                          min="0"
                          max="72"
                          className="input-base w-20"
                        />
                        <span className="text-sm text-gray-600">hours before</span>
                      </div>
                      {eAccess.codeActivationHoursBefore && <p className="text-red-500 text-xs mt-1">{eAccess.codeActivationHoursBefore.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">0 = activates exactly at check-in</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expire code after check-out
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          {...rAccess('codeExpirationHoursAfter')}
                          type="number"
                          min="0"
                          max="72"
                          className="input-base w-20"
                        />
                        <span className="text-sm text-gray-600">hours after</span>
                      </div>
                      {eAccess.codeExpirationHoursAfter && <p className="text-red-500 text-xs mt-1">{eAccess.codeExpirationHoursAfter.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">0 = expires exactly at check-out</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  Example: With check-in at 3:00 PM, activation 1 hour before, and expiration 1 hour after check-out at 11:00 AM — the code is valid from 2:00 PM to 12:00 PM the next day.
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="btn-primary">
                    Save Access Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
