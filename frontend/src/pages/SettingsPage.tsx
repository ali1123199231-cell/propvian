import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, Lock, Bell, Building2, CheckCircle,
  AlertCircle, AlertTriangle, Info, Calendar, Zap, CreditCard, Users,
  Globe, Loader2, Camera, Copy, Check, Mail, MessageCircle, LifeBuoy,
  X, Save,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { apiClient } from '@/api/client'
import { organizationsApi } from '@/api/organizations'
import { COUNTRIES } from '@/constants/countries'

// ── Schemas ──────────────────────────────────────────────────────────────────

const accountSchema = z.object({
  timezone: z.string().min(1, 'Required'),
  country:  z.string().optional(),
})
type AccountForm = z.infer<typeof accountSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEZONES = [
  'UTC',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
  'America/Sao_Paulo', 'America/Buenos_Aires', 'America/Bogota',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Amsterdam', 'Europe/Athens', 'Europe/Istanbul',
  'Europe/Moscow', 'Europe/Stockholm', 'Europe/Warsaw',
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Fiji',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos',
]

const NOTIFICATION_PREFS_KEY = 'propvian_notification_prefs'

const NOTIFICATION_ITEMS = [
  { key: 'RESERVATION_CREATED',    label: 'New reservation',        description: 'A booking is confirmed or synced from a platform', icon: Calendar,        color: 'text-blue-500' },
  { key: 'RESERVATION_CANCELLED',  label: 'Reservation cancelled',  description: 'A guest cancels or a booking is removed',          icon: AlertTriangle,   color: 'text-amber-500' },
  { key: 'NEW_GUEST_MESSAGE',      label: 'New guest message',      description: 'A guest sends a message through your booking site', icon: MessageCircle,   color: 'text-primary-500' },
  { key: 'PAYMENT_RECEIVED',       label: 'Payment received',       description: 'A guest payment is successfully processed',         icon: CreditCard,      color: 'text-green-500' },
  { key: 'LOCK_DISCONNECTED',      label: 'Lock disconnected',      description: 'A smart lock loses its connection',                 icon: AlertCircle,     color: 'text-red-500' },
  { key: 'SUBSCRIPTION_EXPIRING',  label: 'Subscription expiring',  description: 'Your plan is about to expire or renew',             icon: CreditCard,      color: 'text-amber-500' },
  { key: 'SYNC_FAILED',            label: 'Calendar sync failed',   description: 'An iCal feed fails to sync',                       icon: AlertCircle,     color: 'text-red-500' },
  { key: 'SYNC_COMPLETED',         label: 'Calendar sync success',  description: 'An iCal feed syncs successfully',                  icon: CheckCircle,     color: 'text-emerald-500' },
  { key: 'MEMBER_INVITED',         label: 'Team member invited',    description: 'A new member is added to your account',            icon: Users,           color: 'text-primary-500' },
  { key: 'CLEANER_ASSIGNED',       label: 'Cleaner task assigned',  description: 'A cleaning task is assigned for a property',       icon: Zap,             color: 'text-teal-500' },
  { key: 'SUPPORT_REPLY',          label: 'Support reply',          description: 'Propvian support responds to one of your tickets',  icon: LifeBuoy,        color: 'text-purple-500' },
]

// ── Email templates ───────────────────────────────────────────────────────────

interface Template {
  id: string
  label: string
  desc: string
  active: boolean
  subject: string
  body: string
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'booking_confirmed',
    label: 'Booking confirmed',
    desc: 'Sent immediately after a booking is confirmed',
    active: true,
    subject: 'Your booking is confirmed!',
    body: `Hi {{guest_name}},

Your booking at {{property_name}} is confirmed!

Check-in: {{check_in_date}} at {{check_in_time}}
Check-out: {{check_out_date}} at {{check_out_time}}
Guests: {{guests}}

We look forward to hosting you!

Best,
{{host_name}}`,
  },
  {
    id: 'payment_confirmed',
    label: 'Payment confirmation',
    desc: 'Sent after a payment is successfully processed',
    active: true,
    subject: 'Payment received — {{property_name}}',
    body: `Hi {{guest_name}},

Your payment of {{amount}} has been received for your stay at {{property_name}}.

Booking dates: {{check_in_date}} — {{check_out_date}}

{{host_name}}`,
  },
  {
    id: 'check_in_reminder',
    label: 'Check-in reminder',
    desc: 'Sent 24 hours before check-in',
    active: true,
    subject: 'Your stay starts tomorrow — check-in details',
    body: `Hi {{guest_name}},

Your stay at {{property_name}} begins tomorrow!

Check-in: {{check_in_date}} at {{check_in_time}}
Address: {{property_address}}

{{check_in_instructions}}

Safe travels,
{{host_name}}`,
  },
  {
    id: 'check_out_reminder',
    label: 'Check-out reminder',
    desc: 'Sent morning of check-out',
    active: false,
    subject: 'Check-out reminder for today',
    body: `Hi {{guest_name}},

Just a reminder that check-out is today by {{check_out_time}}.

Thank you for staying with us — we hope you had a wonderful time!

{{host_name}}`,
  },
  {
    id: 'cancellation',
    label: 'Cancellation email',
    desc: 'Sent when a booking is cancelled',
    active: true,
    subject: 'Your booking has been cancelled',
    body: `Hi {{guest_name}},

Your booking at {{property_name}} ({{check_in_date}} — {{check_out_date}}) has been cancelled.

If you have any questions, please don't hesitate to reach out.

{{host_name}}`,
  },
  {
    id: 'review_request',
    label: 'Review request',
    desc: 'Sent 1 day after check-out',
    active: true,
    subject: 'How was your stay? Leave a review',
    body: `Hi {{guest_name}},

Thank you for staying at {{property_name}}! We hope you had a great experience.

It would mean the world to us if you could take a minute to leave a review.

Thank you,
{{host_name}}`,
  },
]

function loadNotifPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return Object.fromEntries(NOTIFICATION_ITEMS.map(n => [n.key, true]))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EditTemplateModal({ template, onClose, onSave }: {
  template: Template
  onClose: () => void
  onSave: (t: Template) => void
}) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody]       = useState(template.body)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{template.label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{template.desc}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            Available variables: <code className="font-mono">{'{{guest_name}} {{property_name}} {{check_in_date}} {{check_out_date}} {{check_in_time}} {{check_out_time}} {{host_name}} {{property_address}} {{amount}}'}</code>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject line</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="input-base text-sm" placeholder="Email subject…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={12} className="input-base text-sm font-mono resize-y" placeholder="Email content…" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
          <button
            onClick={() => { onSave({ ...template, subject, body }); onClose() }}
            className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
          >
            <Save size={13} /> Save template
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
    </div>
  )
}

function FieldRow({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error  && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

// ── Section: Automated Emails ─────────────────────────────────────────────────

function AutomatedEmailsSection() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)
  const [editing, setEditing]     = useState<Template | null>(null)

  const toggleTemplate = (id: string) =>
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, active: !t.active } : t))

  const saveTemplate = (updated: Template) =>
    setTemplates(ts => ts.map(t => t.id === updated.id ? updated : t))

  return (
    <div>
      <SectionHeader
        title="Automated Emails"
        description="Configure emails sent to guests automatically at key booking milestones."
      />
      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Mail size={15} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{t.label}</p>
              <p className="text-xs text-gray-400">{t.desc}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Toggle checked={t.active} onChange={() => toggleTemplate(t.id)} />
              <span className={`text-xs font-medium w-6 ${t.active ? 'text-green-600' : 'text-gray-400'}`}>
                {t.active ? 'On' : 'Off'}
              </span>
              <button
                onClick={() => setEditing(t)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 px-1">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>Templates use <code className="font-mono">{'{{variables}}'}</code> filled automatically from booking data.</span>
      </div>
      {editing && (
        <EditTemplateModal template={editing} onClose={() => setEditing(null)} onSave={saveTemplate} />
      )}
    </div>
  )
}

// ── Section: Profile ──────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, updateUser } = useAuthStore()
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  const firstName = user?.firstName ?? ''
  const lastName  = user?.lastName  ?? ''
  const initials  = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  const avatarMutation = useMutation({
    mutationFn: (url: string) => apiClient.put('/users/me', { firstName, lastName, avatarUrl: url }),
    onSuccess: (res) => {
      updateUser({ avatarUrl: res.data.data.avatarUrl })
      toast.success('Photo updated')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update photo'),
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5 MB'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await apiClient.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data.data.url
      setAvatarUrl(url)
      avatarMutation.mutate(url)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAvatar = () => {
    setAvatarUrl('')
    avatarMutation.mutate('')
  }

  return (
    <div>
      <SectionHeader title="Profile" description="Your account information. Contact support to update your name or email." />

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-md">
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : <span className="text-primary-700 text-2xl font-bold">{initials || <User size={28} className="text-primary-400" />}</span>
            }
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 size={18} className="text-white animate-spin" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{firstName} {lastName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="btn-secondary text-xs py-1.5 px-3 h-auto">
              <Camera size={13} /> Upload photo
            </button>
            {avatarUrl && (
              <button type="button" onClick={removeAvatar}
                className="text-xs text-red-500 hover:text-red-700 font-medium">
                Remove
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Read-only fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="First name">
            <input value={firstName} disabled className="input-base opacity-60 cursor-not-allowed bg-gray-50" />
          </FieldRow>
          <FieldRow label="Last name">
            <input value={lastName} disabled className="input-base opacity-60 cursor-not-allowed bg-gray-50" />
          </FieldRow>
        </div>
        <FieldRow label="Email address">
          <div className="relative">
            <input value={user?.email ?? ''} disabled className="input-base opacity-60 cursor-not-allowed bg-gray-50 pr-24" />
            {user?.emailVerified && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle size={12} /> Verified
              </span>
            )}
          </div>
        </FieldRow>
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">Name and email cannot be changed here. Please contact support if you need to update this information.</p>
        </div>
      </div>
    </div>
  )
}

// ── Section: Account ──────────────────────────────────────────────────────────

function AccountSection() {
  const { activeOrg, setActiveOrg } = useAuthStore()
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      timezone: activeOrg?.timezone ?? 'UTC',
      country:  activeOrg?.country  ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (d: AccountForm) => organizationsApi.update(activeOrg!.id, d),
    onSuccess: (org) => {
      setActiveOrg(org)
      toast.success('Account settings saved')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save'),
  })

  const bookingUrl = activeOrg?.slug ? `${activeOrg.slug}.propvian.com` : null

  const copyBookingUrl = () => {
    if (!bookingUrl) return
    navigator.clipboard.writeText(`https://${bookingUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!activeOrg) return null

  return (
    <div>
      <SectionHeader title="Account" description="Manage your timezone, location, and booking details." />

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <FieldRow label="Timezone" error={errors.timezone?.message} hint="Used for reservation times and calendar sync.">
          <select {...register('timezone')} className="input-base">
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Country" error={errors.country?.message}>
          <select {...register('country')} className="input-base">
            <option value="">— Select country —</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FieldRow>

        {/* Booking URL */}
        {bookingUrl && (
          <FieldRow label="Booking URL" hint="Your direct booking site address.">
            <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary-200 rounded-xl">
              <Globe size={14} className="text-primary-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-primary-800 font-medium truncate">
                https://{bookingUrl}
              </span>
              <button type="button" onClick={copyBookingUrl}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 flex-shrink-0 transition-colors">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </FieldRow>
        )}

        {/* Info strip */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account ID</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{activeOrg.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member since</p>
            <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(activeOrg.createdAt), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={mutation.isPending || !activeOrg} className="btn-primary">
            {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Section: Security ─────────────────────────────────────────────────────────

function SecuritySection() {
  const { user } = useAuthStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const mutation = useMutation({
    mutationFn: (d: PasswordForm) => apiClient.put('/users/me/password', {
      currentPassword: d.currentPassword,
      newPassword: d.newPassword,
    }),
    onSuccess: () => { toast.success('Password changed successfully'); reset() },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to change password'),
  })

  return (
    <div>
      <SectionHeader title="Security" description="Change your password and review account security." />

      {/* Info row */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lock size={14} className="text-primary-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">Password authentication</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Your account is secured with a password.
            {user?.emailVerified && ' Your email is verified.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <FieldRow label="Current password" error={errors.currentPassword?.message}>
          <input {...register('currentPassword')} type="password" className="input-base" autoComplete="current-password" />
        </FieldRow>
        <FieldRow label="New password" error={errors.newPassword?.message} hint="Minimum 8 characters.">
          <input {...register('newPassword')} type="password" className="input-base" autoComplete="new-password" />
        </FieldRow>
        <FieldRow label="Confirm new password" error={errors.confirmPassword?.message}>
          <input {...register('confirmPassword')} type="password" className="input-base" autoComplete="new-password" />
        </FieldRow>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Changing…</> : 'Change password'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Section: Notifications ────────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(loadNotifPrefs)

  const toggle = (key: string, value: boolean) => {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated))
    toast.success(value ? 'Notification enabled' : 'Notification disabled')
  }

  const allOn  = NOTIFICATION_ITEMS.every(n => prefs[n.key] !== false)
  const toggleAll = () => {
    const next = !allOn
    const updated = Object.fromEntries(NOTIFICATION_ITEMS.map(n => [n.key, next]))
    setPrefs(updated)
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated))
  }

  return (
    <div>
      <SectionHeader title="Notifications" description="Choose which events trigger in-app notifications." />

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <p className="text-sm font-medium text-gray-700">All notifications</p>
          <Toggle checked={allOn} onChange={toggleAll} />
        </div>
        <div className="divide-y divide-gray-100">
          {NOTIFICATION_ITEMS.map(({ key, label, description, icon: Icon, color }) => (
            <div key={key} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className={`flex-shrink-0 ${color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              </div>
              <Toggle checked={prefs[key] !== false} onChange={v => toggle(key, v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 px-1">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <span>Notification preferences are saved locally on this device.</span>
      </div>
    </div>
  )
}

// ── Nav items ─────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'account' | 'security' | 'notifications' | 'emails'

const NAV_ITEMS: { key: Tab; label: string; icon: typeof User; description: string }[] = [
  { key: 'profile',       label: 'Profile',        icon: User,      description: 'Name & photo' },
  { key: 'account',       label: 'Account',        icon: Building2, description: 'Timezone & location' },
  { key: 'security',      label: 'Security',       icon: Lock,      description: 'Password' },
  { key: 'notifications', label: 'Notifications',  icon: Bell,      description: 'Alerts & events' },
  { key: 'emails',        label: 'Automated Emails', icon: Mail,    description: 'Guest email templates' },
]

const SECTION_MAP: Record<Tab, React.ReactNode> = {
  profile:       <ProfileSection />,
  account:       <AccountSection />,
  security:      <SecuritySection />,
  notifications: <NotificationsSection />,
  emails:        <AutomatedEmailsSection />,
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div>
      <TopBar title="Settings" />

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left nav */}
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white px-3 py-6 hidden md:block">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  tab === key
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                  tab === key ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Icon size={14} className={tab === key ? 'text-primary-600' : 'text-gray-500'} />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{label}</p>
                  <p className={`text-xs leading-tight mt-0.5 ${tab === key ? 'text-primary-500' : 'text-gray-400'}`}>{description}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden w-full absolute border-b border-gray-200 bg-white px-4 py-2 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === key
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 max-w-2xl">
          <div className="animate-fade-in">
            {SECTION_MAP[tab]}
          </div>
        </main>
      </div>
    </div>
  )
}
