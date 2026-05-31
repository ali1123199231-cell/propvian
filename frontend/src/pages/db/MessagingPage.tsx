import { useState } from 'react'
import { MessageCircle, Mail, Bell, Zap, X, Save } from 'lucide-react'

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
    subject: 'Your booking is confirmed! 🎉',
    body: `Hi {{guest_name}},

Your booking at {{property_name}} is confirmed!

Check-in: {{check_in_date}} at {{check_in_time}}
Check-out: {{check_out_date}} at {{check_out_time}}
Guests: {{guests}}

We look forward to hosting you. Feel free to reach out if you have any questions.

Best,
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

const DEFAULT_NOTIFS: Record<string, boolean> = {
  'New booking received': true,
  'Booking cancelled by guest': true,
  'Review received': true,
  'Payout processed': false,
}

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
            Available variables: <code className="font-mono">{'{{guest_name}} {{property_name}} {{check_in_date}} {{check_out_date}} {{check_in_time}} {{check_out_time}} {{host_name}} {{property_address}}'}</code>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-base text-sm"
              placeholder="Email subject…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="input-base text-sm font-mono resize-y"
              placeholder="Email content…"
            />
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

export function MessagingPage() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)
  const [notifs, setNotifs]       = useState(DEFAULT_NOTIFS)
  const [editing, setEditing]     = useState<Template | null>(null)

  const toggleTemplate = (id: string) =>
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, active: !t.active } : t))

  const saveTemplate = (updated: Template) =>
    setTemplates(ts => ts.map(t => t.id === updated.id ? updated : t))

  const toggleNotif = (label: string) =>
    setNotifs(n => ({ ...n, [label]: !n[label] }))

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messaging</h1>
        <p className="text-gray-500 mt-1">Guest communications and automated emails</p>
      </div>

      {/* Automated emails */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={14} className="text-primary-500" /> Automated Emails
        </h2>
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Mail size={15} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{t.label}</p>
                <p className="text-xs text-gray-400">{t.desc}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => toggleTemplate(t.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${t.active ? 'bg-primary-600' : 'bg-gray-200'}`}
                  title={t.active ? 'Pause' : 'Activate'}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${t.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className={`text-xs font-medium w-10 ${t.active ? 'text-green-600' : 'text-gray-400'}`}>
                  {t.active ? 'Active' : 'Paused'}
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
      </div>

      {/* Guest inbox */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle size={14} className="text-primary-500" /> Guest Messages
        </h2>
        <div className="flex flex-col items-center py-10 text-gray-400">
          <MessageCircle size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No guest messages</p>
          <p className="text-xs mt-1">Guest conversations will appear here</p>
        </div>
      </div>

      {/* Notification settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell size={14} className="text-primary-500" /> Host Notifications
        </h2>
        <div className="space-y-3">
          {Object.entries(notifs).map(([label, enabled]) => (
            <div key={label} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-700">{label}</span>
              <button
                onClick={() => toggleNotif(label)}
                className={`w-10 h-5 rounded-full transition-colors focus:outline-none ${enabled ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <EditTemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSave={saveTemplate}
        />
      )}
    </div>
  )
}
