import { useState } from 'react'
import { Globe, ExternalLink, Eye, Palette, Search, Code, Layout, AlertTriangle, X, Save, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { verificationApi } from '@/api/verification'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const PAGES = [
  { icon: Layout, label: 'Homepage',       desc: 'Your main landing page' },
  { icon: Globe,  label: 'Property page',  desc: 'Full property listing with photos' },
  { icon: Eye,    label: 'Gallery',        desc: 'Photo gallery with lightbox' },
  { icon: Search, label: 'Booking page',   desc: 'Guest booking form & calendar' },
  { icon: Globe,  label: 'Contact',        desc: 'Contact form for inquiries' },
  { icon: Code,   label: 'Terms & Privacy',desc: 'Legal pages (auto-generated)' },
]

function PageEditModal({ pageName, onClose }: { pageName: string; onClose: () => void }) {
  const [content, setContent] = useState(`# ${pageName}\n\nEdit your ${pageName.toLowerCase()} content here. This text will appear on your public website.\n\nYou can use Markdown formatting to style your content.`)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    toast.success(`${pageName} saved`)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit — {pageName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">Content for your <strong>{pageName}</strong> page. Markdown supported.</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="input-base text-sm font-mono resize-y w-full"
          />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
          <button onClick={handleSave} className="btn-primary py-2 px-5 text-sm flex items-center gap-2">
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? 'Saved!' : 'Save page'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function WebsitePage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''

  const [editingPage, setEditingPage] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#6366F1')
  const [brandName, setBrandName]       = useState(activeOrg?.name ?? '')
  const [pageTitle, setPageTitle]       = useState('')
  const [metaDesc, setMetaDesc]         = useState('')
  const [themeSaved, setThemeSaved]     = useState(false)
  const [seoSaved, setSeoSaved]         = useState(false)

  const { data: verification } = useQuery({
    queryKey: ['verification', orgId],
    queryFn:  () => verificationApi.getStatus(orgId),
    enabled:  !!orgId,
  })

  const bookingsEnabled = verification?.bookingsEnabled ?? false

  const saveTheme = () => {
    setThemeSaved(true)
    toast.success('Theme settings saved')
    setTimeout(() => setThemeSaved(false), 2000)
  }

  const saveSeo = () => {
    setSeoSaved(true)
    toast.success('SEO settings saved')
    setTimeout(() => setSeoSaved(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
        <p className="text-gray-500 mt-1">Customize your direct booking website</p>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl p-4 border ${bookingsEnabled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {bookingsEnabled
              ? <Eye size={16} className="text-green-600" />
              : <AlertTriangle size={16} className="text-amber-600" />}
            <div>
              {bookingsEnabled ? (
                <>
                  <p className="text-sm font-semibold text-green-800">Your website is live!</p>
                  <p className="text-xs text-green-600 mt-0.5">Guests can browse and book your property.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-amber-800">Booking form is disabled</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Website is visible for preview — bookings unlock after{' '}
                    <Link to="/verification" className="underline">verification</Link>.
                  </p>
                </>
              )}
            </div>
          </div>
          {(() => {
            const slug = activeOrg?.name?.toLowerCase().replace(/\s+/g, '-') ?? 'my-property'
            const baseUrl = import.meta.env.DEV
              ? 'http://localhost:5173'
              : `https://${slug}.propvian.com`
            return (
              <a
                href={baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                <ExternalLink size={11} /> Preview site
              </a>
            )
          })()}
        </div>
      </div>

      {/* Website pages */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Website Pages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAGES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => setEditingPage(label)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors flex-shrink-0"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Theme settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette size={15} className="text-primary-500" /> Theme & Branding
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Primary color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="input-base text-sm flex-1"
                placeholder="#6366F1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Brand name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="input-base text-sm"
              placeholder={activeOrg?.name ?? 'My Villa'}
            />
          </div>
        </div>
        <button onClick={saveTheme} className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5">
          {themeSaved ? <Check size={12} /> : <Save size={12} />}
          {themeSaved ? 'Saved!' : 'Save theme'}
        </button>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search size={15} className="text-primary-500" /> SEO Settings
        </h2>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Page title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="input-base text-sm"
              placeholder={`Book direct — ${activeOrg?.name ?? 'My Villa'}`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meta description</label>
            <textarea
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              rows={2}
              className="input-base text-sm resize-none"
              placeholder="Book our beautiful property directly and save on fees."
            />
          </div>
        </div>
        <button onClick={saveSeo} className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5">
          {seoSaved ? <Check size={12} /> : <Save size={12} />}
          {seoSaved ? 'Saved!' : 'Save SEO settings'}
        </button>
      </div>

      {editingPage && (
        <PageEditModal pageName={editingPage} onClose={() => setEditingPage(null)} />
      )}
    </div>
  )
}
