import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Save, Globe, Monitor, Smartphone, ChevronDown, ChevronUp,
  Check, Loader2, Plus, Trash2, ArrowLeft, ExternalLink,
  Palette, Layout, Eye, Settings, Zap, XCircle, CheckCircle,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  websiteBuilderApi,
  type WebsiteConfig,
  type WebsiteSection,
  type PromoCode,
} from '@/api/websiteBuilder'
import { organizationsApi } from '@/api/organizations'
import { SectionPreview, SECTION_LABELS } from './SectionPreview'
import type { Property } from '@/types'

// ── Palette & font options ────────────────────────────────────────────────────

const PALETTES = [
  { id: 'modern',   name: 'Modern Blue',  primary: '#4F46E5', accent: '#F59E0B' },
  { id: 'coastal',  name: 'Coastal Teal', primary: '#0D9488', accent: '#F43F5E' },
  { id: 'luxury',   name: 'Luxury Dark',  primary: '#1E293B', accent: '#B8860B' },
  { id: 'rustic',   name: 'Rustic Earth', primary: '#57534E', accent: '#65A30D' },
  { id: 'boutique', name: 'Boutique',     primary: '#7C3AED', accent: '#EC4899' },
  { id: 'tropical', name: 'Tropical',     primary: '#0284C7', accent: '#F97316' },
  { id: 'minimal',  name: 'Minimal',      primary: '#1C1917', accent: '#6B7280' },
  { id: 'forest',   name: 'Forest',       primary: '#166534', accent: '#D97706' },
]

const FONTS = [
  { id: 'Inter',            name: 'Modern',   desc: 'Clean & contemporary' },
  { id: 'Poppins',          name: 'Friendly', desc: 'Warm & approachable' },
  { id: 'Playfair Display', name: 'Elegant',  desc: 'Classic & refined' },
]

const ALL_SECTION_TYPES = [
  { type: 'hero',            icon: '🏠', desc: 'Main intro with photo' },
  { type: 'gallery',         icon: '🖼️',  desc: 'Property photo grid' },
  { type: 'about',           icon: '✨', desc: 'Property description' },
  { type: 'amenities',       icon: '🛋️', desc: "What's included" },
  { type: 'booking-widget',  icon: '📅', desc: 'Availability calendar' },
  { type: 'reviews',         icon: '⭐', desc: 'Guest testimonials' },
  { type: 'faq',             icon: '❓', desc: 'Common questions' },
  { type: 'host-info',       icon: '👤', desc: 'About the host' },
  { type: 'house-rules',     icon: '📋', desc: 'Property rules' },
  { type: 'location',        icon: '📍', desc: 'Map & directions' },
  { type: 'nearby',          icon: '🗺️', desc: 'Points of interest' },
  { type: 'special-offers',  icon: '🏷️', desc: 'Discounts & deals' },
  { type: 'cta',             icon: '🎯', desc: 'Book now banner' },
  { type: 'contact',         icon: '✉️', desc: 'Contact form' },
  { type: 'video',           icon: '🎬', desc: 'Property video' },
  { type: 'footer',          icon: '📄', desc: 'Links & copyright' },
]

type Tab = 'appearance' | 'sections' | 'preview' | 'settings'

interface Props {
  orgId: string
  orgSlug?: string
  property: Property | null
  initialConfig: WebsiteConfig
}

function SubdomainCard({ orgId, currentSlug }: { orgId: string; currentSlug: string }) {
  const [input, setInput] = useState(currentSlug)
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!input || input === currentSlug) { setStatus('idle'); return }
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(input) || input.includes('--')) {
      setStatus('invalid'); return
    }
    setStatus('checking')
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      try {
        const res = await organizationsApi.checkSlug(input)
        setStatus(res.available ? 'available' : 'taken')
      } catch { setStatus('idle') }
    }, 500)
  }, [input, currentSlug])

  const saveMut = useMutation({
    mutationFn: () => organizationsApi.updateSlug(orgId, input),
    onSuccess: () => {
      toast.success(`Subdomain updated to ${input}.propvian.com`)
      setStatus('idle')
      window.location.reload()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update subdomain'),
  })

  const canSave = status === 'available' && input !== currentSlug

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Website Address</h3>
      <p className="text-xs text-gray-400 mb-4">Your booking website URL — changing this will update your public link immediately</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            value={input}
            onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="input-base text-sm pr-8"
            placeholder="your-property"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {status === 'checking' && <Loader2 size={14} className="animate-spin text-gray-400" />}
            {status === 'available' && <CheckCircle size={14} className="text-emerald-500" />}
            {(status === 'taken' || status === 'invalid') && <XCircle size={14} className="text-red-400" />}
          </span>
        </div>
        <span className="text-sm text-gray-400 whitespace-nowrap">.propvian.com</span>
        <button
          onClick={() => saveMut.mutate()}
          disabled={!canSave || saveMut.isPending}
          className="btn-primary py-2 px-4 text-sm disabled:opacity-40"
        >
          {saveMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
        </button>
      </div>
      {status === 'available' && <p className="text-xs text-emerald-600 mt-1.5">✓ {input}.propvian.com is available</p>}
      {status === 'taken' && <p className="text-xs text-red-500 mt-1.5">That address is already taken — try another</p>}
      {status === 'invalid' && <p className="text-xs text-red-500 mt-1.5">Use lowercase letters, numbers and hyphens only (min 3 chars)</p>}
      {status === 'idle' && currentSlug && <p className="text-xs text-gray-400 mt-1.5">Current: {currentSlug}.propvian.com</p>}
    </div>
  )
}

export function WebsiteBuilder({ orgId, orgSlug, property, initialConfig }: Props) {
  const [config, setConfig] = useState<WebsiteConfig>(initialConfig)
  const [sections, setSections] = useState<WebsiteSection[]>(initialConfig.sections || [])
  const [activeTab, setActiveTab] = useState<Tab>('appearance')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: promoCodes = [], refetch: refetchPromos } = useQuery({
    queryKey: ['promo-codes', orgId],
    queryFn: () => websiteBuilderApi.getPromoCodes(orgId),
  })

  // ── Mutations ────────────────────────────────────────────────────────────────

  const saveMut = useMutation({
    mutationFn: async () => {
      await websiteBuilderApi.updateConfig(orgId, {
        brandName: config.brandName,
        primaryColor: config.primaryColor,
        accentColor: config.accentColor,
        fontFamily: config.fontFamily,
        themeStyle: config.themeStyle,
        buttonStyle: config.buttonStyle,
        pageTitle: config.pageTitle,
        metaDescription: config.metaDescription,
        stickyBookButton: config.stickyBookButton,
        exitIntentEnabled: config.exitIntentEnabled,
        exitIntentMessage: config.exitIntentMessage,
        exitIntentDiscount: config.exitIntentDiscount,
        gaTrackingId: config.gaTrackingId,
        metaPixelId: config.metaPixelId,
      })
      await Promise.all(
        sections.map((s) =>
          websiteBuilderApi
            .updateSection(orgId, s.id, {
              enabled: s.enabled,
              config: s.config,
              position: s.position,
            })
            .catch(() => {})
        )
      )
    },
    onSuccess: () => {
      setIsDirty(false)
      toast.success('Saved')
    },
    onError: () => toast.error('Failed to save'),
  })

  const publishMut = useMutation({
    mutationFn: () => websiteBuilderApi.publish(orgId),
    onSuccess: (data) => {
      setConfig((c) => ({ ...c, status: data.status }))
      toast.success('Website published!')
    },
    onError: () => toast.error('Failed to publish'),
  })

  const unpublishMut = useMutation({
    mutationFn: () => websiteBuilderApi.unpublish(orgId),
    onSuccess: () => {
      setConfig((c) => ({ ...c, status: 'DRAFT' }))
      toast.success('Unpublished')
    },
  })

  const addSectionMut = useMutation({
    mutationFn: (type: string) =>
      websiteBuilderApi.addSection(orgId, { sectionType: type, position: sections.length }),
    onSuccess: (section) => {
      setSections((ss) => [...ss, { ...section, config: section.config || {} }])
      setShowAddSection(false)
      setExpandedSection(section.id)
      markDirty()
    },
  })

  const deleteSectionMut = useMutation({
    mutationFn: (id: string) => websiteBuilderApi.deleteSection(orgId, id),
    onSuccess: (_, id) => {
      setSections((ss) => ss.filter((s) => s.id !== id))
      if (expandedSection === id) setExpandedSection(null)
      markDirty()
    },
  })

  const createPromoMut = useMutation({
    mutationFn: (d: any) => websiteBuilderApi.createPromoCode(orgId, d),
    onSuccess: () => {
      refetchPromos()
      toast.success('Promo code created')
    },
  })

  const deletePromoMut = useMutation({
    mutationFn: (id: string) => websiteBuilderApi.deletePromoCode(orgId, id),
    onSuccess: () => refetchPromos(),
  })

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const markDirty = () => {
    setIsDirty(true)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => saveMut.mutate(), 3000)
  }

  const updateConfig = useCallback(
    (patch: Partial<WebsiteConfig>) => {
      setConfig((c) => ({ ...c, ...patch }))
      markDirty()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const updateSection = useCallback(
    (id: string, patch: Partial<WebsiteSection>) => {
      setSections((ss) =>
        ss.map((s) => {
          if (s.id !== id) return s
          if (patch.config && typeof patch.config === 'object') {
            return { ...s, ...patch, config: { ...s.config, ...patch.config } }
          }
          return { ...s, ...patch }
        })
      )
      markDirty()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const moveSection = (id: string, dir: -1 | 1) => {
    setSections((ss) => {
      const idx = ss.findIndex((s) => s.id === id)
      if (idx < 0) return ss
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= ss.length) return ss
      const arr = [...ss]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr.map((s, i) => ({ ...s, position: i }))
    })
    markDirty()
  }

  const siteSlug = orgSlug ?? config.brandName?.toLowerCase().replace(/\s+/g, '-')
  const siteUrl =
    config.status === 'PUBLISHED' && siteSlug
      ? `https://${siteSlug}.propvian.com`
      : null

  const TABS: { key: Tab; label: string; Icon: typeof Palette }[] = [
    { key: 'appearance', label: 'Appearance', Icon: Palette },
    { key: 'sections',   label: 'Content',    Icon: Layout },
    { key: 'preview',    label: 'Preview',    Icon: Eye },
    { key: 'settings',   label: 'Settings',   Icon: Settings },
  ]

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: 'calc(100vh - 84px)' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{config.brandName}</p>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  config.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {config.status === 'PUBLISHED' ? 'Live' : 'Draft'}
              </span>
              {isDirty && <span className="text-xs text-amber-500">· Unsaved</span>}
            </div>
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-0.5"
              >
                {siteUrl} <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => saveMut.mutate()}
            disabled={!isDirty || saveMut.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
          >
            {saveMut.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            Save
          </button>

          {config.status !== 'PUBLISHED' ? (
            <button
              onClick={() => publishMut.mutate()}
              disabled={publishMut.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: config.primaryColor }}
            >
              {publishMut.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Globe size={12} />
              )}
              Publish
            </button>
          ) : (
            <button
              onClick={() => unpublishMut.mutate()}
              disabled={unpublishMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all"
            >
              <Check size={12} /> Published
            </button>
          )}
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex px-5 bg-white border-b border-gray-100 flex-shrink-0">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all mr-1 ${
              activeTab === key
                ? 'text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
            style={
              activeTab === key
                ? { borderColor: config.primaryColor, color: config.primaryColor }
                : {}
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Appearance ────────────────────────────────────────────────────── */}
        {activeTab === 'appearance' && (
          <div className="max-w-3xl mx-auto p-6 space-y-10">
            {/* Color palettes */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Color Style</h2>
              <p className="text-sm text-gray-400 mb-4">
                Pick a palette that matches your property's vibe
              </p>
              <div className="grid grid-cols-4 gap-3">
                {PALETTES.map((p) => {
                  const active = config.themeStyle === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        updateConfig({
                          primaryColor: p.primary,
                          accentColor: p.accent,
                          themeStyle: p.id,
                        })
                      }
                      className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                        active
                          ? 'border-gray-900 shadow-lg bg-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {active && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                          <Check size={11} className="text-white" />
                        </span>
                      )}
                      <div className="flex gap-2 mb-2.5">
                        <div
                          className="w-5 h-5 rounded-full shadow-sm"
                          style={{ backgroundColor: p.primary }}
                        />
                        <div
                          className="w-5 h-5 rounded-full shadow-sm"
                          style={{ backgroundColor: p.accent }}
                        />
                      </div>
                      <div
                        className="h-1.5 rounded-full mb-2.5"
                        style={{ backgroundColor: p.primary }}
                      />
                      <p className="text-xs font-bold text-gray-800">{p.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Font */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Font Style</h2>
              <p className="text-sm text-gray-400 mb-4">
                Sets the overall personality of your text
              </p>
              <div className="grid grid-cols-3 gap-4">
                {FONTS.map((f) => {
                  const active = config.fontFamily === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => updateConfig({ fontFamily: f.id })}
                      className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                        active
                          ? 'border-gray-900 shadow-lg bg-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <p
                        className="text-3xl font-bold text-gray-800 mb-2"
                        style={{ fontFamily: f.id }}
                      >
                        Aa
                      </p>
                      <p className="text-sm font-bold text-gray-700">{f.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                      {active && (
                        <div
                          className="mt-3 h-0.5 rounded-full"
                          style={{ backgroundColor: config.primaryColor }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live preview strip */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">Live Preview</h2>
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
                <div
                  className="py-10 px-6 flex flex-col items-center justify-center text-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}cc 100%)`,
                    fontFamily: config.fontFamily,
                  }}
                >
                  <p className="text-xl font-bold">{config.brandName}</p>
                  <p className="text-sm opacity-75 mt-1 max-w-xs">
                    {property?.description
                      ? property.description.slice(0, 80) + '…'
                      : 'Your perfect getaway awaits — book direct and save'}
                  </p>
                  <button
                    className="mt-5 px-6 py-2.5 text-sm font-bold rounded-xl shadow-lg"
                    style={{
                      backgroundColor: config.accentColor,
                      fontFamily: config.fontFamily,
                    }}
                  >
                    Check Availability
                  </button>
                </div>
                <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-100">
                  <div className="flex gap-3">
                    {[
                      property?.maxGuests && `${property.maxGuests} guests`,
                      property?.bedrooms && `${property.bedrooms} bed`,
                      property?.bathrooms && `${property.bathrooms} bath`,
                    ]
                      .filter(Boolean)
                      .map((label) => (
                        <span
                          key={label as string}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: config.primaryColor + '12', color: config.primaryColor }}
                        >
                          {label}
                        </span>
                      ))}
                    {!property && (
                      <span
                        className="text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: config.primaryColor + '12', color: config.primaryColor }}
                      >
                        4 guests · 2 bed
                      </span>
                    )}
                  </div>
                  <button
                    className="px-4 py-2 text-white text-xs font-bold rounded-lg"
                    style={{ backgroundColor: config.primaryColor, fontFamily: config.fontFamily }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Content / Sections ────────────────────────────────────────────── */}
        {activeTab === 'sections' && (
          <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Page Sections</h2>
                <p className="text-sm text-gray-400">
                  Toggle sections on/off and customise their content
                </p>
              </div>
              <button
                onClick={() => setShowAddSection((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-sm"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Plus size={14} />
                {showAddSection ? 'Close' : 'Add Section'}
              </button>
            </div>

            {/* Section picker */}
            {showAddSection && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 mb-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">
                  Choose a section to add
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_SECTION_TYPES.filter(
                    (t) => !sections.some((s) => s.sectionType === t.type)
                  ).map(({ type, icon, desc }) => (
                    <button
                      key={type}
                      onClick={() => addSectionMut.mutate(type)}
                      disabled={addSectionMut.isPending}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left transition-all"
                    >
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">
                          {SECTION_LABELS[type] || type}
                        </p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section list */}
            {sections.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-3xl mb-4">📋</p>
                <p className="text-sm text-gray-500 mb-2 font-medium">No sections yet</p>
                <p className="text-xs text-gray-400">
                  Click "Add Section" above to build your page
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map((s, i) => {
                  const meta = ALL_SECTION_TYPES.find((t) => t.type === s.sectionType)
                  const isExpanded = expandedSection === s.id
                  return (
                    <div
                      key={s.id}
                      className={`bg-white rounded-2xl border-2 transition-all ${
                        isExpanded ? 'border-gray-200 shadow-md' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {/* Row */}
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <span className="text-xl flex-shrink-0 select-none">
                          {meta?.icon || '📄'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {SECTION_LABELS[s.sectionType] || s.sectionType}
                          </p>
                          {!s.enabled && (
                            <p className="text-xs text-gray-400">Hidden from website</p>
                          )}
                        </div>

                        {/* Up / down */}
                        <div className="flex gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => moveSection(s.id, -1)}
                            disabled={i === 0}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveSection(s.id, 1)}
                            disabled={i === sections.length - 1}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => updateSection(s.id, { enabled: !s.enabled })}
                          className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                          style={{ backgroundColor: s.enabled ? config.primaryColor : '#D1D5DB' }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              s.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* Expand */}
                        <button
                          onClick={() =>
                            setExpandedSection(isExpanded ? null : s.id)
                          }
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-all flex-shrink-0"
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete the "${s.sectionType}" section? This cannot be undone.`)) {
                              deleteSectionMut.mutate(s.id)
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Inline editor */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                          <SectionEditor
                            section={s}
                            property={property}
                            onUpdate={(patch) => updateSection(s.id, patch)}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Preview ───────────────────────────────────────────────────────── */}
        {activeTab === 'preview' && (
          <div className="flex flex-col items-center py-5 px-4 min-h-full bg-gray-100">
            {/* Device toggle */}
            <div className="flex bg-white rounded-xl p-1 gap-1 shadow-sm border border-gray-200 mb-5">
              {(
                [
                  { key: 'desktop', label: 'Desktop', Icon: Monitor },
                  { key: 'mobile', label: 'Mobile', Icon: Smartphone },
                ] as const
              ).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setPreviewMode(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewMode === key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            <div
              className={`bg-white shadow-2xl rounded-xl overflow-hidden transition-all ${
                previewMode === 'mobile' ? 'w-[390px]' : 'w-full max-w-4xl'
              }`}
            >
              {/* Browser chrome */}
              <div className="bg-gray-800 px-4 py-2 flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-300 flex items-center gap-2">
                  <Globe size={9} className="text-green-400" />
                  {siteUrl || (siteSlug ? `${siteSlug}.propvian.com` : 'your-site.propvian.com')}
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {sections.filter((s) => s.enabled).length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-sm text-gray-400">
                      Enable sections in the Content tab to see them here
                    </p>
                  </div>
                ) : (
                  sections
                    .filter((s) => s.enabled)
                    .map((s) => (
                      <SectionPreview
                        key={s.id}
                        section={s}
                        config={config}
                        isSelected={false}
                        onClick={() => {
                          setActiveTab('sections')
                          setExpandedSection(s.id)
                        }}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Settings ──────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Subdomain */}
            <SubdomainCard orgId={orgId} currentSlug={orgSlug ?? ''} />

            {/* SEO */}
            <Card title="SEO & Visibility">
              <div className="space-y-4">
                <Field label="Page Title">
                  <input
                    value={config.pageTitle || ''}
                    onChange={(e) => updateConfig({ pageTitle: e.target.value })}
                    className="input-base text-sm"
                    placeholder={`Book Direct — ${config.brandName}`}
                  />
                </Field>
                <Field label="Meta Description">
                  <textarea
                    value={config.metaDescription || ''}
                    onChange={(e) => updateConfig({ metaDescription: e.target.value })}
                    rows={3}
                    className="input-base text-sm resize-none"
                    placeholder={`Book ${config.brandName} directly for the best rates.`}
                  />
                </Field>
                {/* Search preview */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    Google Preview
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    {config.pageTitle || `Book Direct — ${config.brandName}`}
                  </p>
                  <p className="text-xs text-green-600">
                    {siteSlug || 'your-site'}.propvian.com
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {config.metaDescription || 'Your meta description will appear here.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Conversion */}
            <Card title="Conversion Tools" subtitle="Boost direct bookings with smart nudges">
              <div className="space-y-4">
                <ToggleRow
                  label="Sticky Book Button"
                  desc="Floating 'Book Now' button on mobile"
                  checked={config.stickyBookButton}
                  color={config.primaryColor}
                  onChange={(v) => updateConfig({ stickyBookButton: v })}
                />
                <ToggleRow
                  label="Exit Intent Offer"
                  desc="Show a discount when visitors try to leave"
                  checked={config.exitIntentEnabled}
                  color={config.primaryColor}
                  onChange={(v) => updateConfig({ exitIntentEnabled: v })}
                />
                {config.exitIntentEnabled && (
                  <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-3">
                    <Field label="Message">
                      <input
                        value={config.exitIntentMessage || ''}
                        onChange={(e) => updateConfig({ exitIntentMessage: e.target.value })}
                        className="input-base text-sm"
                        placeholder="Wait! Get 10% off if you book now."
                      />
                    </Field>
                    <Field label="Discount %">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={config.exitIntentDiscount || ''}
                        onChange={(e) =>
                          updateConfig({ exitIntentDiscount: Number(e.target.value) })
                        }
                        className="input-base text-sm w-28"
                      />
                    </Field>
                  </div>
                )}
              </div>
            </Card>

            {/* Analytics */}
            <Card title="Analytics">
              <div className="space-y-4">
                <Field label="Google Analytics ID">
                  <input
                    value={config.gaTrackingId || ''}
                    onChange={(e) => updateConfig({ gaTrackingId: e.target.value })}
                    className="input-base text-sm font-mono"
                    placeholder="G-XXXXXXXXXX"
                  />
                </Field>
                <Field label="Meta Pixel ID">
                  <input
                    value={config.metaPixelId || ''}
                    onChange={(e) => updateConfig({ metaPixelId: e.target.value })}
                    className="input-base text-sm font-mono"
                    placeholder="123456789..."
                  />
                </Field>
              </div>
            </Card>

            {/* Promo codes */}
            <Card title="Promo Codes" subtitle="Offer discounts to direct bookers">
              <PromoSection
                codes={promoCodes}
                primaryColor={config.primaryColor}
                onCreate={(d) => createPromoMut.mutate(d)}
                onDelete={(id) => deletePromoMut.mutate(id)}
                isCreating={createPromoMut.isPending}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section inline editor ─────────────────────────────────────────────────────

const AMENITY_OPTIONS = [
  { key: 'wifi', label: 'WiFi' }, { key: 'kitchen', label: 'Kitchen' },
  { key: 'parking', label: 'Parking' }, { key: 'pool', label: 'Pool' },
  { key: 'ac', label: 'A/C' }, { key: 'workspace', label: 'Workspace' },
  { key: 'tv', label: 'TV' }, { key: 'balcony', label: 'Balcony' },
  { key: 'hot_tub', label: 'Hot Tub' }, { key: 'garden', label: 'Garden' },
  { key: 'bbq', label: 'BBQ' }, { key: 'washer', label: 'Washer/Dryer' },
]

function SectionEditor({
  section,
  property,
  onUpdate,
}: {
  section: WebsiteSection
  property: Property | null
  onUpdate: (patch: Partial<WebsiteSection>) => void
}) {
  const cfg = section.config
  const setCfg = (patch: Record<string, any>) =>
    onUpdate({ config: { ...cfg, ...patch } })

  const AutoFill = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium mt-1.5 transition-colors"
      style={{ color: '#6366F1' }}
    >
      <Zap size={11} />
      {label}
    </button>
  )

  switch (section.sectionType) {
    case 'hero':
      return (
        <div className="space-y-3">
          <Field label="Headline">
            <input
              value={cfg.headline || ''}
              onChange={(e) => setCfg({ headline: e.target.value })}
              className="input-base text-sm"
              placeholder={property ? `Welcome to ${property.name}` : 'Your headline'}
            />
          </Field>
          <Field label="Subtext">
            <textarea
              value={cfg.subheadline || ''}
              onChange={(e) => setCfg({ subheadline: e.target.value })}
              rows={2}
              className="input-base text-sm resize-none"
              placeholder="Book direct for the best rates"
            />
          </Field>
          <Field label="Button Text">
            <input
              value={cfg.ctaText || ''}
              onChange={(e) => setCfg({ ctaText: e.target.value })}
              className="input-base text-sm"
              placeholder="Check Availability"
            />
          </Field>
          <Field label="Hero Height">
            <select
              value={cfg.height || 'large'}
              onChange={(e) => setCfg({ height: e.target.value })}
              className="input-base text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large (full screen)</option>
            </select>
          </Field>
          {property && !cfg.headline && (
            <AutoFill
              onClick={() =>
                setCfg({
                  headline: `Welcome to ${property.name}`,
                  subheadline:
                    property.description ||
                    'Book direct for the best rates and a personal experience',
                })
              }
              label="Auto-fill from property"
            />
          )}
        </div>
      )

    case 'gallery':
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Our Photos"
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={cfg.subtitle || ''}
              onChange={(e) => setCfg({ subtitle: e.target.value })}
              className="input-base text-sm"
              placeholder="A glimpse of your stay"
            />
          </Field>
          <div className="flex gap-3">
            <Field label="Columns">
              <select
                value={cfg.columns || 3}
                onChange={(e) => setCfg({ columns: Number(e.target.value) })}
                className="input-base text-sm"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </Field>
            <Field label="Max Photos">
              <input
                type="number"
                min={1}
                max={20}
                value={cfg.maxPhotos || 9}
                onChange={(e) => setCfg({ maxPhotos: Number(e.target.value) })}
                className="input-base text-sm"
              />
            </Field>
          </div>
        </div>
      )

    case 'about':
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="About This Property"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={cfg.description || ''}
              onChange={(e) => setCfg({ description: e.target.value })}
              rows={4}
              className="input-base text-sm resize-none"
              placeholder={property?.description || 'Describe your property…'}
            />
          </Field>
          <Field label="Image Position">
            <select
              value={cfg.imagePosition || 'right'}
              onChange={(e) => setCfg({ imagePosition: e.target.value })}
              className="input-base text-sm"
            >
              <option value="right">Image on right</option>
              <option value="left">Image on left</option>
            </select>
          </Field>
          {property?.description && !cfg.description && (
            <AutoFill
              onClick={() =>
                setCfg({ title: 'About This Property', description: property.description })
              }
              label="Use property description"
            />
          )}
        </div>
      )

    case 'amenities': {
      const items: { key?: string; label: string }[] = cfg.items || []
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Amenities"
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={cfg.subtitle || ''}
              onChange={(e) => setCfg({ subtitle: e.target.value })}
              className="input-base text-sm"
              placeholder="Everything you need for a comfortable stay"
            />
          </Field>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Select Amenities</p>
            <div className="grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((opt) => {
                const active = items.some((i) => i.key === opt.key)
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? items.filter((i) => i.key !== opt.key)
                        : [...items, { key: opt.key, label: opt.label }]
                      setCfg({ items: next })
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      active
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex-shrink-0">{active ? '✓' : '+'}</span>
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {items.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">{items.length} amenities selected</p>
            )}
          </div>
        </div>
      )
    }

    case 'booking-widget':
      return (
        <div className="space-y-3">
          <Field label="Widget Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Book Your Stay"
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={cfg.subtitle || ''}
              onChange={(e) => setCfg({ subtitle: e.target.value })}
              className="input-base text-sm"
              placeholder="Secure your dates directly"
            />
          </Field>
          <Field label="Button Text">
            <input
              value={cfg.ctaText || ''}
              onChange={(e) => setCfg({ ctaText: e.target.value })}
              className="input-base text-sm"
              placeholder="Check Availability"
            />
          </Field>
          <Field label="Check-in note">
            <input
              value={cfg.checkInNote || ''}
              onChange={(e) => setCfg({ checkInNote: e.target.value })}
              className="input-base text-sm"
              placeholder={
                property?.checkInTime
                  ? `Check-in from ${property.checkInTime}`
                  : 'e.g. Check-in from 3:00 PM'
              }
            />
          </Field>
          <Field label="Check-out note">
            <input
              value={cfg.checkOutNote || ''}
              onChange={(e) => setCfg({ checkOutNote: e.target.value })}
              className="input-base text-sm"
              placeholder={
                property?.checkOutTime
                  ? `Check-out by ${property.checkOutTime}`
                  : 'e.g. Check-out by 11:00 AM'
              }
            />
          </Field>
          {property && !cfg.checkInNote && (property.checkInTime || property.checkOutTime) && (
            <AutoFill
              onClick={() =>
                setCfg({
                  checkInNote: property.checkInTime
                    ? `Check-in from ${property.checkInTime}`
                    : cfg.checkInNote,
                  checkOutNote: property.checkOutTime
                    ? `Check-out by ${property.checkOutTime}`
                    : cfg.checkOutNote,
                })
              }
              label="Use property check-in/out times"
            />
          )}
        </div>
      )

    case 'reviews': {
      const reviews: { name: string; text: string; rating: number }[] = cfg.reviews || []
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Guest Reviews"
            />
          </Field>
          <div className="flex gap-3">
            <Field label="Overall Rating">
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={cfg.rating || ''}
                onChange={(e) => setCfg({ rating: e.target.value })}
                className="input-base text-sm"
                placeholder="4.9"
              />
            </Field>
            <Field label="Total Count">
              <input
                type="number"
                min="0"
                value={cfg.reviewCount || ''}
                onChange={(e) => setCfg({ reviewCount: Number(e.target.value) })}
                className="input-base text-sm"
                placeholder="24"
              />
            </Field>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">Reviews</p>
            {reviews.map((r, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    value={r.name}
                    onChange={(e) => {
                      const n = [...reviews]; n[idx] = { ...r, name: e.target.value }; setCfg({ reviews: n })
                    }}
                    className="input-base text-xs flex-1"
                    placeholder="Guest name"
                  />
                  <select
                    value={r.rating}
                    onChange={(e) => {
                      const n = [...reviews]; n[idx] = { ...r, rating: Number(e.target.value) }; setCfg({ reviews: n })
                    }}
                    className="input-base text-xs w-20"
                  >
                    {[5,4,3,2,1].map((v) => <option key={v} value={v}>{v} ★</option>)}
                  </select>
                  <button
                    onClick={() => setCfg({ reviews: reviews.filter((_, j) => j !== idx) })}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  value={r.text}
                  onChange={(e) => {
                    const n = [...reviews]; n[idx] = { ...r, text: e.target.value }; setCfg({ reviews: n })
                  }}
                  rows={2}
                  className="input-base text-xs resize-none w-full"
                  placeholder="Review text…"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setCfg({ reviews: [...reviews, { name: '', text: '', rating: 5 }] })}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            <Plus size={12} /> Add review
          </button>
        </div>
      )
    }

    case 'host-info':
      return (
        <div className="space-y-3">
          <Field label="Host Name">
            <input
              value={cfg.hostName || ''}
              onChange={(e) => setCfg({ hostName: e.target.value })}
              className="input-base text-sm"
              placeholder="Your name"
            />
          </Field>
          <Field label="Host Bio">
            <textarea
              value={cfg.hostBio || ''}
              onChange={(e) => setCfg({ hostBio: e.target.value })}
              rows={3}
              className="input-base text-sm resize-none"
              placeholder="A short bio about you as a host…"
            />
          </Field>
          <Field label="Host Since (year)">
            <input
              value={cfg.hostSince || ''}
              onChange={(e) => setCfg({ hostSince: e.target.value })}
              className="input-base text-sm"
              placeholder="2020"
            />
          </Field>
          <Field label="Host Photo URL">
            <input
              value={cfg.hostPhotoUrl || ''}
              onChange={(e) => setCfg({ hostPhotoUrl: e.target.value })}
              className="input-base text-sm"
              placeholder="https://…"
            />
          </Field>
          <ToggleRow
            label="Show Contact Button"
            checked={cfg.showContactButton || false}
            color="#6366F1"
            onChange={(v) => setCfg({ showContactButton: v })}
          />
        </div>
      )

    case 'faq': {
      const items: { q: string; a: string }[] = cfg.items || []
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Frequently Asked Questions"
            />
          </Field>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={item.q}
                    onChange={(e) => {
                      const next = [...items]; next[idx] = { ...item, q: e.target.value }; setCfg({ items: next })
                    }}
                    className="input-base text-xs flex-1"
                    placeholder="Question"
                  />
                  <button
                    onClick={() => setCfg({ items: items.filter((_, j) => j !== idx) })}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <textarea
                  value={item.a}
                  onChange={(e) => {
                    const next = [...items]; next[idx] = { ...item, a: e.target.value }; setCfg({ items: next })
                  }}
                  rows={2}
                  className="input-base text-xs resize-none w-full"
                  placeholder="Answer"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setCfg({ items: [...items, { q: '', a: '' }] })}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            <Plus size={12} /> Add FAQ item
          </button>
        </div>
      )
    }

    case 'house-rules': {
      const rules: { icon: string; text: string }[] = cfg.rules || []
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="House Rules"
            />
          </Field>
          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={rule.icon}
                  onChange={(e) => {
                    const next = [...rules]; next[idx] = { ...rule, icon: e.target.value }; setCfg({ rules: next })
                  }}
                  className="input-base text-xs w-12 text-center"
                  placeholder="🚫"
                />
                <input
                  value={rule.text}
                  onChange={(e) => {
                    const next = [...rules]; next[idx] = { ...rule, text: e.target.value }; setCfg({ rules: next })
                  }}
                  className="input-base text-xs flex-1"
                  placeholder="Rule description"
                />
                <button
                  onClick={() => setCfg({ rules: rules.filter((_, j) => j !== idx) })}
                  className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCfg({ rules: [...rules, { icon: '✅', text: '' }] })}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            <Plus size={12} /> Add rule
          </button>
        </div>
      )
    }

    case 'location':
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Location"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={cfg.description || ''}
              onChange={(e) => setCfg({ description: e.target.value })}
              rows={3}
              className="input-base text-sm resize-none"
              placeholder={
                property?.city
                  ? `Located in ${[property.city, property.state, property.country].filter(Boolean).join(', ')}`
                  : 'Describe the location and surroundings…'
              }
            />
          </Field>
          <Field label="Google Maps Embed URL">
            <input
              value={cfg.mapEmbedUrl || ''}
              onChange={(e) => setCfg({ mapEmbedUrl: e.target.value })}
              className="input-base text-sm"
              placeholder="https://maps.google.com/maps?…&output=embed"
            />
            <p className="text-xs text-gray-400 mt-1">Google Maps → Share → Embed a map → copy the src URL</p>
          </Field>
          {property?.city && !cfg.description && (
            <AutoFill
              onClick={() =>
                setCfg({
                  description: `Located in ${[property.city, property.state, property.country].filter(Boolean).join(', ')}. ${property.description || ''}`.trim(),
                })
              }
              label="Use property location"
            />
          )}
        </div>
      )

    case 'nearby': {
      const items: { name: string; category: string; distance: string }[] = cfg.items || []
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Nearby Attractions"
            />
          </Field>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const n = [...items]; n[idx] = { ...item, name: e.target.value }; setCfg({ items: n })
                    }}
                    className="input-base text-xs flex-1"
                    placeholder="Name (e.g. Main Beach)"
                  />
                  <input
                    value={item.distance}
                    onChange={(e) => {
                      const n = [...items]; n[idx] = { ...item, distance: e.target.value }; setCfg({ items: n })
                    }}
                    className="input-base text-xs w-20"
                    placeholder="500 m"
                  />
                  <button
                    onClick={() => setCfg({ items: items.filter((_, j) => j !== idx) })}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  value={item.category}
                  onChange={(e) => {
                    const n = [...items]; n[idx] = { ...item, category: e.target.value }; setCfg({ items: n })
                  }}
                  className="input-base text-xs w-full"
                  placeholder="Category (e.g. Beach, Shopping, Culture)"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setCfg({ items: [...items, { name: '', category: '', distance: '' }] })}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            <Plus size={12} /> Add attraction
          </button>
        </div>
      )
    }

    case 'special-offers': {
      const offers: { title: string; description: string; discount: string; validUntil?: string }[] = cfg.offers || []
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Special Offers"
            />
          </Field>
          <div className="space-y-2">
            {offers.map((offer, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={offer.title}
                    onChange={(e) => {
                      const n = [...offers]; n[idx] = { ...offer, title: e.target.value }; setCfg({ offers: n })
                    }}
                    className="input-base text-xs flex-1"
                    placeholder="Offer title"
                  />
                  <input
                    value={offer.discount}
                    onChange={(e) => {
                      const n = [...offers]; n[idx] = { ...offer, discount: e.target.value }; setCfg({ offers: n })
                    }}
                    className="input-base text-xs w-16"
                    placeholder="15%"
                  />
                  <button
                    onClick={() => setCfg({ offers: offers.filter((_, j) => j !== idx) })}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  value={offer.description}
                  onChange={(e) => {
                    const n = [...offers]; n[idx] = { ...offer, description: e.target.value }; setCfg({ offers: n })
                  }}
                  className="input-base text-xs w-full"
                  placeholder="Offer description"
                />
                <input
                  value={offer.validUntil || ''}
                  onChange={(e) => {
                    const n = [...offers]; n[idx] = { ...offer, validUntil: e.target.value }; setCfg({ offers: n })
                  }}
                  className="input-base text-xs w-full"
                  placeholder="Valid until (e.g. Dec 31)"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setCfg({ offers: [...offers, { title: '', description: '', discount: '', validUntil: '' }] })}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            <Plus size={12} /> Add offer
          </button>
        </div>
      )
    }

    case 'cta':
      return (
        <div className="space-y-3">
          <Field label="Headline">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Ready to Book?"
            />
          </Field>
          <Field label="Subtext">
            <input
              value={cfg.subtitle || ''}
              onChange={(e) => setCfg({ subtitle: e.target.value })}
              className="input-base text-sm"
              placeholder="Secure your dates now for the best rates"
            />
          </Field>
          <Field label="Button Text">
            <input
              value={cfg.buttonText || ''}
              onChange={(e) => setCfg({ buttonText: e.target.value })}
              className="input-base text-sm"
              placeholder="Book Direct & Save"
            />
          </Field>
        </div>
      )

    case 'contact':
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Get in Touch"
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={cfg.subtitle || ''}
              onChange={(e) => setCfg({ subtitle: e.target.value })}
              className="input-base text-sm"
              placeholder="Have questions? We'd love to hear from you."
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              value={cfg.phone || ''}
              onChange={(e) => setCfg({ phone: e.target.value })}
              className="input-base text-sm"
              placeholder="+1 (555) 000-0000"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              value={cfg.email || ''}
              onChange={(e) => setCfg({ email: e.target.value })}
              className="input-base text-sm"
              placeholder="hello@myproperty.com"
            />
          </Field>
        </div>
      )

    case 'video':
      return (
        <div className="space-y-3">
          <Field label="Section Title">
            <input
              value={cfg.title || ''}
              onChange={(e) => setCfg({ title: e.target.value })}
              className="input-base text-sm"
              placeholder="Experience Our Property"
            />
          </Field>
          <Field label="YouTube / Vimeo Embed URL">
            <input
              value={cfg.embedUrl || ''}
              onChange={(e) => setCfg({ embedUrl: e.target.value })}
              className="input-base text-sm"
              placeholder="https://www.youtube.com/embed/…"
            />
          </Field>
          <Field label="Caption (optional)">
            <input
              value={cfg.caption || ''}
              onChange={(e) => setCfg({ caption: e.target.value })}
              className="input-base text-sm"
              placeholder="A walkthrough of the property"
            />
          </Field>
        </div>
      )

    case 'footer': {
      const links: { label: string; url: string }[] = cfg.links || []
      return (
        <div className="space-y-3">
          <Field label="Copyright text">
            <input
              value={cfg.copyright || ''}
              onChange={(e) => setCfg({ copyright: e.target.value })}
              className="input-base text-sm"
              placeholder={`© ${new Date().getFullYear()} All rights reserved.`}
            />
          </Field>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Footer Links</p>
            <div className="space-y-2">
              {links.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const n = [...links]; n[idx] = { ...link, label: e.target.value }; setCfg({ links: n })
                    }}
                    className="input-base text-xs flex-1"
                    placeholder="Label"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => {
                      const n = [...links]; n[idx] = { ...link, url: e.target.value }; setCfg({ links: n })
                    }}
                    className="input-base text-xs flex-1"
                    placeholder="URL"
                  />
                  <button
                    onClick={() => setCfg({ links: links.filter((_, j) => j !== idx) })}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCfg({ links: [...links, { label: '', url: '' }] })}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 mt-2"
            >
              <Plus size={12} /> Add link
            </button>
          </div>
          <Field label="Instagram URL">
            <input
              value={cfg.instagram || ''}
              onChange={(e) => setCfg({ instagram: e.target.value })}
              className="input-base text-sm"
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field label="Facebook URL">
            <input
              value={cfg.facebook || ''}
              onChange={(e) => setCfg({ facebook: e.target.value })}
              className="input-base text-sm"
              placeholder="https://facebook.com/…"
            />
          </Field>
          <Field label="Twitter / X URL">
            <input
              value={cfg.twitter || ''}
              onChange={(e) => setCfg({ twitter: e.target.value })}
              className="input-base text-sm"
              placeholder="https://twitter.com/…"
            />
          </Field>
        </div>
      )
    }

    default:
      return (
        <Field label="Section Title">
          <input
            value={cfg.title || ''}
            onChange={(e) => setCfg({ title: e.target.value })}
            className="input-base text-sm"
          />
        </Field>
      )
  }
}

// ── Promo codes ───────────────────────────────────────────────────────────────

function PromoSection({
  codes,
  primaryColor,
  onCreate,
  onDelete,
  isCreating,
}: {
  codes: PromoCode[]
  primaryColor: string
  onCreate: (d: any) => void
  onDelete: (id: string) => void
  isCreating: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENT',
    discountValue: 10,
    expiresAt: '',
  })

  return (
    <div className="space-y-4">
      {codes.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400">No promo codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group"
            >
              <div>
                <p className="text-sm font-mono font-bold text-gray-900">{c.code}</p>
                <p className="text-xs text-gray-500">
                  {c.discountValue}
                  {c.discountType === 'PERCENT' ? '%' : '$'} off · {c.usesCount} uses
                </p>
              </div>
              <button
                onClick={() => onDelete(c.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <Field label="Code">
            <input
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              className="input-base text-sm font-mono"
              placeholder="SUMMER20"
            />
          </Field>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                className="input-base text-sm"
              >
                <option value="PERCENT">Percent off</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))
                }
                className="input-base text-sm"
              />
            </div>
          </div>
          <Field label="Expires (optional)">
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="input-base text-sm"
            />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onCreate({
                  code: form.code,
                  discountType: form.discountType,
                  discountValue: form.discountValue,
                  expiresAt: form.expiresAt || undefined,
                })
                setShowForm(false)
                setForm({ code: '', discountType: 'PERCENT', discountValue: 10, expiresAt: '' })
              }}
              disabled={!form.code || isCreating}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isCreating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: primaryColor }}
        >
          <Plus size={14} /> Add promo code
        </button>
      )}
    </div>
  )
}

// ── Reusable UI helpers ───────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-bold text-gray-900 mb-0.5">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  checked,
  color,
  onChange,
}: {
  label: string
  desc?: string
  checked: boolean
  color: string
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
        style={{ backgroundColor: checked ? color : '#D1D5DB' }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
