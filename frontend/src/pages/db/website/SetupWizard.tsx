import { useState, useEffect, useRef } from 'react'
import { Globe, Check, Loader2, Sparkles, Users, BedDouble, Bath, MapPin, CheckCircle, XCircle } from 'lucide-react'
import type { WebsiteConfig } from '@/api/websiteBuilder'
import type { Property } from '@/types'
import { organizationsApi } from '@/api/organizations'

const PALETTES = [
  { id: 'modern',   name: 'Modern Blue',  primary: '#4F46E5', accent: '#F59E0B' },
  { id: 'coastal',  name: 'Coastal Teal', primary: '#0D9488', accent: '#F43F5E' },
  { id: 'luxury',   name: 'Luxury Dark',  primary: '#1E293B', accent: '#B8860B' },
  { id: 'rustic',   name: 'Rustic Earth', primary: '#57534E', accent: '#65A30D' },
  { id: 'boutique', name: 'Boutique',     primary: '#7C3AED', accent: '#EC4899' },
  { id: 'tropical', name: 'Tropical',     primary: '#0284C7', accent: '#F97316' },
]

const FONTS = [
  { id: 'Inter',            name: 'Modern',  sample: 'Aa' },
  { id: 'Poppins',          name: 'Friendly', sample: 'Aa' },
  { id: 'Playfair Display', name: 'Elegant',  sample: 'Aa' },
]

// Convert a name to a URL-safe slug suggestion
function toSlugSuggestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

interface Props {
  property: Property | null
  orgName: string
  existingSlug?: string  // set when wizard re-opens after a partial save
  onComplete: (data: Partial<WebsiteConfig>, siteSlug: string) => void
  isSubmitting: boolean
}

export function SetupWizard({ property, orgName, existingSlug, onComplete, isSubmitting }: Props) {
  const [palette, setPalette] = useState(PALETTES[0])
  const [font, setFont] = useState(FONTS[0])

  const name = property?.name || orgName

  // Slug picker state — pre-fill with existing slug if the org already has a brand one
  const [slugInput, setSlugInput] = useState(() => existingSlug || toSlugSuggestion(name))
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!slugInput) { setSlugStatus('idle'); return }
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slugInput) || slugInput.includes('--')) {
      setSlugStatus('invalid'); return
    }
    // If the host already owns this slug (re-opening wizard), skip the network check
    if (slugInput === existingSlug) {
      setSlugStatus('available'); return
    }
    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await organizationsApi.checkSlug(slugInput)
        if (cancelled) return
        if (res.available) {
          setSlugStatus('available')
        } else {
          // Auto-suggest an available variant by appending a short random suffix
          const suffix = Math.random().toString(36).substring(2, 6)
          const variant = `${slugInput.substring(0, 46)}-${suffix}`
          try {
            const res2 = await organizationsApi.checkSlug(variant)
            if (!cancelled) {
              if (res2.available) {
                setSlugInput(variant)
                // status will be set by the re-triggered effect
              } else {
                setSlugStatus('taken')
              }
            }
          } catch {
            if (!cancelled) setSlugStatus('taken')
          }
        }
      } catch {
        if (!cancelled) setSlugStatus('idle')
      }
    }, 500)
    return () => { cancelled = true; if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [slugInput])

  const canLaunch = slugStatus === 'available' && slugInput.length >= 3

  const handleLaunch = () => {
    if (!canLaunch) return
    onComplete({
      brandName: name,
      primaryColor: palette.primary,
      accentColor: palette.accent,
      fontFamily: font.id,
      themeStyle: palette.id,
      buttonStyle: 'rounded',
      pageTitle: `Book Direct — ${name}`,
      metaDescription:
        property?.description ||
        `Book ${name} directly for the best rates. Beautiful property, instant confirmation.`,
      setupCompleted: true,
    }, slugInput)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ backgroundColor: palette.primary + '18' }}
        >
          <Globe size={26} style={{ color: palette.primary }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Your Booking Website</h1>
        <p className="text-sm text-gray-500 mt-2">
          We've pre-filled your property details — just pick a style and launch!
        </p>
      </div>

      {/* Property auto-detect card */}
      {property ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-7">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={15} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                Property detected
              </p>
              <p className="text-sm font-bold text-gray-900">{property.name}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {property.maxGuests && (
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Users size={11} /> {property.maxGuests} guests
                  </span>
                )}
                {property.bedrooms && (
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <BedDouble size={11} /> {property.bedrooms} bedrooms
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Bath size={11} /> {property.bathrooms} bathrooms
                  </span>
                )}
                {(property.city || property.country) && (
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin size={11} /> {[property.city, property.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              {property.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{property.description}</p>
              )}
              <p className="text-xs text-green-600 font-medium mt-2">
                All this info will be used automatically on your website.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-7 text-sm text-blue-700">
          No property found yet — you can add one after launching.
        </div>
      )}

      {/* Site URL picker */}
      <div className="mb-7">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Your Site Address</h2>
        <p className="text-xs text-gray-500 mb-3">This is the URL guests will visit to book with you. Choose something memorable.</p>
        <div className="flex items-center border-2 rounded-xl overflow-hidden transition-all focus-within:border-gray-400"
          style={{ borderColor: slugStatus === 'available' ? palette.primary : slugStatus === 'taken' || slugStatus === 'invalid' ? '#EF4444' : '#E5E7EB' }}>
          <input
            value={slugInput}
            onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50))}
            placeholder="your-brand-name"
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-900 outline-none bg-white"
            spellCheck={false}
          />
          <span className="px-3 text-sm text-gray-400 bg-gray-50 border-l border-gray-200 py-3 select-none whitespace-nowrap">.propvian.com</span>
          <span className="px-3">
            {slugStatus === 'checking' && <Loader2 size={16} className="animate-spin text-gray-400" />}
            {slugStatus === 'available' && <CheckCircle size={16} style={{ color: palette.primary }} />}
            {(slugStatus === 'taken' || slugStatus === 'invalid') && <XCircle size={16} className="text-red-400" />}
          </span>
        </div>
        <p className={`text-xs mt-1.5 ${
          slugStatus === 'available' ? 'text-emerald-600' :
          slugStatus === 'taken' ? 'text-red-500' :
          slugStatus === 'invalid' ? 'text-red-500' : 'text-gray-400'
        }`}>
          {slugStatus === 'available' && `✓ ${slugInput}.propvian.com is available`}
          {slugStatus === 'taken' && 'That address is already taken — try another'}
          {slugStatus === 'invalid' && 'Use lowercase letters, numbers and hyphens only (min 3 characters)'}
          {slugStatus === 'idle' && 'Enter your brand name above'}
          {slugStatus === 'checking' && 'Checking availability…'}
        </p>
      </div>

      {/* Color palette picker */}
      <div className="mb-7">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Choose a Color Style</h2>
        <div className="grid grid-cols-3 gap-3">
          {PALETTES.map((p) => {
            const active = palette.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPalette(p)}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                  active ? 'border-gray-900 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </span>
                )}
                <div className="flex gap-2 mb-2.5">
                  <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: p.primary }} />
                  <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: p.accent }} />
                </div>
                <div className="h-1.5 rounded-full mb-2.5" style={{ backgroundColor: p.primary }} />
                <p className="text-xs font-bold text-gray-800">{p.name}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Font picker */}
      <div className="mb-7">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Choose a Font Style</h2>
        <div className="grid grid-cols-3 gap-3">
          {FONTS.map((f) => {
            const active = font.id === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFont(f)}
                className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                  active ? 'border-gray-900 shadow-lg bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-3xl font-bold text-gray-800 mb-1.5" style={{ fontFamily: f.id }}>
                  {f.sample}
                </p>
                <p className="text-xs font-bold text-gray-700">{f.name}</p>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: f.id }}>
                  {f.id}
                </p>
                {active && (
                  <div className="mt-2.5 h-0.5 rounded-full" style={{ backgroundColor: palette.primary }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Live mini preview */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg mb-8">
        <div
          className="flex flex-col items-center justify-center py-7 px-6 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primary}cc 100%)`, fontFamily: font.id }}
        >
          <p className="text-lg font-bold">{name}</p>
          <p className="text-sm opacity-75 mt-1">Book direct & save</p>
        </div>
        <div className="bg-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="h-2 rounded-full w-32 mb-2" style={{ backgroundColor: palette.primary + '20' }} />
            <div className="h-1.5 rounded-full w-20" style={{ backgroundColor: palette.primary + '12' }} />
          </div>
          <button
            className="px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow"
            style={{ backgroundColor: palette.accent, fontFamily: font.id }}
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Launch button */}
      <button
        onClick={handleLaunch}
        disabled={isSubmitting || !canLaunch}
        className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: palette.primary }}
      >
        {isSubmitting ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Globe size={20} />
        )}
        {isSubmitting ? 'Creating your website…' : 'Create My Website'}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">
        Everything can be customized after setup.
      </p>
    </div>
  )
}
