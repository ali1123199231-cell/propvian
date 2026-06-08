import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Plus, MapPin, Pencil, Trash2, MoreVertical,
  DollarSign, Clock, Users, Star, Globe, Loader2, X, Check,
  Upload, Camera, ChevronRight, ChevronLeft, Home, Hotel,
  Waves, Trees, BedDouble, Bath, ArrowRight, Zap, ClipboardList,
  PawPrint, Cigarette, PartyPopper, Moon, AlarmClock, Ban, GripVertical,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { propertiesApi } from '@/api/properties'
import { fileUploadApi } from '@/api/fileUpload'
import { houseRulesApi, amenitiesApi, type PropertyAmenity } from '@/api/calendarEngine'
import { useAuthStore } from '@/store/authStore'
import { useSystemStore } from '@/store/systemStore'
import { COUNTRIES } from '@/constants/countries'
import type { Property, PropertyPhoto } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD – US Dollar' },
  { code: 'EUR', symbol: '€',  label: 'EUR – Euro' },
  { code: 'GBP', symbol: '£',  label: 'GBP – British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD – Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD – Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', label: 'CHF – Swiss Franc' },
  { code: 'JPY', symbol: '¥',  label: 'JPY – Japanese Yen' },
  { code: 'AED', symbol: 'AED', label: 'AED – UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR – Saudi Riyal' },
  { code: 'TRY', symbol: '₺',  label: 'TRY – Turkish Lira' },
  { code: 'MXN', symbol: 'MX$', label: 'MXN – Mexican Peso' },
  { code: 'BRL', symbol: 'R$', label: 'BRL – Brazilian Real' },
  { code: 'INR', symbol: '₹',  label: 'INR – Indian Rupee' },
  { code: 'SGD', symbol: 'S$', label: 'SGD – Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', label: 'NZD – New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R',  label: 'ZAR – South African Rand' },
]

// Convert any stored photo value to a displayable URL.
// New uploads store a raw path ("orgId/filename.jpg") → served via public endpoint.
// Old uploads may have stored a signed URL → served as-is (still works until expiry).
function toDisplayUrl(stored: string | undefined | null): string {
  if (!stored) return ''
  if (stored.startsWith('http') || stored.startsWith('/api/')) return stored
  // Raw relative path: "orgId/filename.jpg"
  return `/api/public/files/${stored}`
}

function currencySymbol(code?: string) {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code ?? '$'
}

const PROPERTY_TYPES: { value: string; label: string; Icon: any }[] = [
  { value: 'Entire home',   label: 'Entire home',   Icon: Home    },
  { value: 'Apartment',     label: 'Apartment',     Icon: Building2 },
  { value: 'Villa',         label: 'Villa',         Icon: Waves   },
  { value: 'Private room',  label: 'Private room',  Icon: BedDouble },
  { value: 'Cabin',         label: 'Cabin',         Icon: Trees   },
  { value: 'Hotel room',    label: 'Hotel room',    Icon: Hotel   },
  { value: 'Other',         label: 'Other',         Icon: Building2 },
]

const HOUSE_RULES = [
  { key: 'PETS',        label: 'Pets allowed',    Icon: PawPrint    },
  { key: 'SMOKING',     label: 'Smoking allowed', Icon: Cigarette   },
  { key: 'PARTIES',     label: 'Parties allowed', Icon: PartyPopper },
  { key: 'QUIET_HOURS', label: 'Quiet hours',     Icon: Moon        },
]

const CANCELLATION_POLICIES = [
  { value: 'FLEXIBLE',       label: 'Flexible',        sub: 'Full refund 24h before check-in' },
  { value: 'MODERATE',       label: 'Moderate',        sub: 'Full refund 5 days before' },
  { value: 'STRICT',         label: 'Strict',          sub: '50% refund up to 1 week before' },
  { value: 'NON_REFUNDABLE', label: 'Non-refundable',  sub: 'No refunds' },
]

const AMENITY_PRESETS: { key: string; label: string; category: string; icon: string }[] = [
  { key: 'wifi',      label: 'WiFi',           category: 'essentials',    icon: 'wifi' },
  { key: 'kitchen',   label: 'Kitchen',        category: 'essentials',    icon: 'utensils' },
  { key: 'parking',   label: 'Parking',        category: 'essentials',    icon: 'car' },
  { key: 'pool',      label: 'Pool',           category: 'outdoor',       icon: 'waves' },
  { key: 'ac',        label: 'A/C',            category: 'climate',       icon: 'wind' },
  { key: 'workspace', label: 'Workspace',      category: 'workspace',     icon: 'laptop' },
  { key: 'tv',        label: 'TV',             category: 'entertainment', icon: 'tv' },
  { key: 'balcony',   label: 'Balcony',        category: 'outdoor',       icon: 'sun' },
  { key: 'hot_tub',   label: 'Hot Tub',        category: 'outdoor',       icon: 'thermometer' },
  { key: 'garden',    label: 'Garden',         category: 'outdoor',       icon: 'trees' },
  { key: 'bbq',       label: 'BBQ',            category: 'outdoor',       icon: 'flame' },
  { key: 'washer',    label: 'Washer/Dryer',   category: 'essentials',    icon: 'washing-machine' },
  { key: 'coffee',    label: 'Coffee machine', category: 'kitchen',       icon: 'coffee' },
  { key: 'dishwasher',label: 'Dishwasher',     category: 'kitchen',       icon: 'check-circle' },
  { key: 'gym',       label: 'Gym',            category: 'fitness',       icon: 'dumbbell' },
  { key: 'sauna',     label: 'Sauna',          category: 'wellness',      icon: 'flame' },
  { key: 'pets',      label: 'Pet-friendly',   category: 'policies',      icon: 'paw-print' },
  { key: 'elevator',  label: 'Elevator',       category: 'accessibility', icon: 'arrow-up' },
  { key: 'fireplace', label: 'Fireplace',      category: 'comfort',       icon: 'flame' },
  { key: 'sea_view',  label: 'Sea view',       category: 'views',         icon: 'waves' },
]

// ── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ACTIVE'   ? 'bg-emerald-50 text-emerald-700' :
    status === 'DRAFT'    ? 'bg-blue-50 text-blue-600' :
    status === 'PAUSED'   ? 'bg-amber-50 text-amber-700' :
    status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' :
                            'bg-red-50 text-red-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{status}</span>
}

// ── Spinner input (+/- buttons) ───────────────────────────────────────────────

function SpinnerInput({
  value, onChange, min = 0, max = 99, label, icon: Icon,
}: {
  value: number; onChange: (v: number) => void
  min?: number; max?: number; label: string; icon?: any
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={16} className="text-gray-400" />}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 disabled:opacity-30 transition-colors text-base leading-none">
          –
        </button>
        <span className="w-5 text-center text-sm font-medium text-gray-900">{value}</span>
        <button type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 disabled:opacity-30 transition-colors text-base leading-none">
          +
        </button>
      </div>
    </div>
  )
}

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ property, isDirect, onEdit, onDelete }: {
  property: Property; isDirect: boolean
  onEdit: () => void; onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const photos: PropertyPhoto[] = property.photos ?? []
  const coverPhoto = photos.find(p => p.primary)?.url ?? photos[0]?.url

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all">
      {/* Cover image */}
      <div className="relative w-full h-40 bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {coverPhoto
          ? <img src={toDisplayUrl(coverPhoto)} alt="" className="w-full h-full object-cover" />
          : <Building2 size={32} className="text-primary-200" />
        }
        {photos.length > 1 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-full">
            <Camera size={9} /> {photos.length}
          </span>
        )}
        <StatusBadge status={property.status} />
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-gray-500 hover:bg-white shadow-sm">
              <MoreVertical size={13} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-36">
                <button onClick={() => { setMenuOpen(false); onEdit() }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Status badge overlaid */}
        <div className="absolute top-2 left-2">
          <StatusBadge status={property.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{property.name}</h3>

        {property.propertyType && (
          <p className="text-xs text-gray-400 mt-0.5">{property.propertyType}</p>
        )}

        {(property.city || property.country) && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
            <MapPin size={10} />
            {[property.city, property.country].filter(Boolean).join(', ')}
          </div>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
          {property.bedrooms != null && <span>{property.bedrooms} bd</span>}
          {property.bathrooms != null && <span>{property.bathrooms} ba</span>}
          {property.maxGuests && (
            <span className="flex items-center gap-1"><Users size={10} /> {property.maxGuests} guests</span>
          )}
        </div>

        {isDirect && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {property.baseNightlyRate ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-900">{currencySymbol(property.currency)}{property.baseNightlyRate}/night</span>
                {property.instantBooking && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Zap size={10} /> Instant
                  </span>
                )}
              </div>
            ) : (
              <button onClick={onEdit} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                <DollarSign size={11} /> Set nightly rate →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── WIZARD: new property creation ─────────────────────────────────────────────

const TOTAL_STEPS = 5

type WizardData = {
  // Step 1
  propertyType: string
  name: string
  // Step 2
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  // Step 3
  bedrooms: number
  beds: number
  bathrooms: number
  maxGuests: number
  description: string
  // Step 4 — photos handled separately
  // Step 5
  checkInTime: string
  checkOutTime: string
  minStayNights: number
  instantBooking: boolean
  cancellationPolicy: string
  houseRules: Record<string, boolean>
  // Pricing
  currency: string
  baseNightlyRate: string
}

function PropertyWizard({ isDirect, onClose, onSaved }: {
  isDirect: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const qc = useQueryClient()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<WizardData>({
    propertyType: '', name: '',
    address: '', city: '', state: '', country: '', postalCode: '',
    bedrooms: 1, beds: 1, bathrooms: 1, maxGuests: 2,
    description: '',
    checkInTime: '15:00', checkOutTime: '11:00',
    minStayNights: 1, instantBooking: true,
    cancellationPolicy: 'MODERATE',
    houseRules: { PETS: false, SMOKING: false, PARTIES: false, QUIET_HOURS: true },
    currency: 'USD',
    baseNightlyRate: '',
  })
  const set = useCallback(<K extends keyof WizardData>(key: K, val: WizardData[K]) =>
    setData(d => ({ ...d, [key]: val })), [])

  const [photos, setPhotos] = useState<string[]>([])
  const wizardDragIdx = useRef<number | null>(null)

  const addPhotoFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        const { path } = await fileUploadApi.upload(file)
        setPhotos(p => p.length < 12 ? [...p, path] : p)
      } catch {
        toast.error('Failed to upload photo')
      }
    }
  }

  const canNext = (): boolean => {
    if (step === 1) return !!data.propertyType && data.name.trim().length >= 2
    if (step === 2) return !!data.city && !!data.country
    return true
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const payload: any = {
        name: data.name,
        propertyType: data.propertyType,
        address: data.address || undefined,
        city: data.city,
        state: data.state || undefined,
        country: data.country,
        postalCode: data.postalCode || undefined,
        description: data.description || undefined,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        maxGuests: data.maxGuests,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        minStayNights: data.minStayNights,
        instantBooking: data.instantBooking,
        cancellationPolicy: data.cancellationPolicy,
        currency: data.currency,
        baseNightlyRate: data.baseNightlyRate ? Number(data.baseNightlyRate) : undefined,
      }
      const created = await propertiesApi.create(orgId, payload)

      // Save photos
      for (let i = 0; i < photos.length; i++) {
        try {
          await propertiesApi.addPhoto(orgId, created.id, {
            url: photos[i], sortOrder: i, primary: i === 0,
          })
        } catch { /* non-fatal */ }
      }

      // Save house rules
      for (const [key, allowed] of Object.entries(data.houseRules)) {
        try { await houseRulesApi.upsert(created.id, key, allowed) } catch { /* non-fatal */ }
      }

      qc.invalidateQueries({ queryKey: ['properties', orgId] })
      toast.success('Property created!')
      onSaved()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating property')
      setSaving(false)
    }
  }

  const stepTitles = [
    'What kind of place?',
    'Where is it?',
    'Tell us more',
    'Add photos',
    'Rules & settings',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium">Step {step} of {TOTAL_STEPS}</p>
            <h2 className="text-base font-semibold text-gray-900 mt-0.5">{stepTitles[step - 1]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-500 transition-all duration-300 rounded-full"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5">

          {/* ── Step 1: Type + Name ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2.5">
                {PROPERTY_TYPES.map(({ value, label, Icon }) => (
                  <button key={value} type="button"
                    onClick={() => set('propertyType', value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all ${
                      data.propertyType === value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <Icon size={22} />
                    <span className="text-xs font-medium leading-tight">{label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Give your property a name <span className="text-red-500">*</span>
                </label>
                <input
                  value={data.name}
                  onChange={e => set('name', e.target.value)}
                  className="input-base"
                  placeholder="e.g. Seaside Villa Malibu"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1">
                  This is what guests will see on your booking page.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Street address</label>
                <input value={data.address} onChange={e => set('address', e.target.value)}
                  className="input-base" placeholder="123 Ocean Drive" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input value={data.city} onChange={e => set('city', e.target.value)}
                    className="input-base" placeholder="Miami" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State / Region</label>
                  <input value={data.state} onChange={e => set('state', e.target.value)}
                    className="input-base" placeholder="FL" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select value={data.country} onChange={e => set('country', e.target.value)}
                      className="input-base pl-8 appearance-none">
                      <option value="">Select…</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal code</label>
                  <input value={data.postalCode} onChange={e => set('postalCode', e.target.value)}
                    className="input-base" placeholder="33101" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Capacity + Description ── */}
          {step === 3 && (
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-xl p-4">
                <SpinnerInput value={data.bedrooms}  onChange={v => set('bedrooms', v)}  label="Bedrooms"  icon={BedDouble} min={0} max={20} />
                <SpinnerInput value={data.beds}      onChange={v => set('beds', v)}      label="Beds"      icon={BedDouble} min={1} max={30} />
                <SpinnerInput value={data.bathrooms} onChange={v => set('bathrooms', v)} label="Bathrooms" icon={Bath}      min={0} max={20} />
                <SpinnerInput value={data.maxGuests} onChange={v => set('maxGuests', v)} label="Max guests" icon={Users}   min={1} max={50} />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional but recommended)</span>
                </label>
                <textarea
                  value={data.description}
                  onChange={e => set('description', e.target.value)}
                  rows={4}
                  className="input-base resize-none"
                  placeholder="Describe your property — location highlights, special features, nearby attractions…"
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Photos ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                  if (files.length) addPhotoFiles(files)
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer"
              >
                <Upload size={28} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop photos or <span className="text-primary-600">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · up to 12 photos · first is cover · drag to reorder</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={e => { addPhotoFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={() => { wizardDragIdx.current = i }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.stopPropagation()
                        const from = wizardDragIdx.current
                        if (from === null || from === i) return
                        setPhotos(p => {
                          const arr = [...p]
                          arr.splice(i, 0, arr.splice(from, 1)[0])
                          return arr
                        })
                        wizardDragIdx.current = null
                      }}
                      className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing"
                    >
                      <img src={toDisplayUrl(url)} alt="" className="w-full h-full object-cover pointer-events-none"
                        onError={e => { e.currentTarget.style.display = 'none' }} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <GripVertical size={14} className="text-white drop-shadow" />
                      </div>
                      <button type="button" onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={11} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400 py-2">
                  No photos yet — you can add them later too.
                </p>
              )}
            </div>
          )}

          {/* ── Step 5: Rules & Booking settings ── */}
          {step === 5 && (
            <div className="space-y-5">
              {/* Check-in / out */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Check-in & check-out times</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Check-in</label>
                    <div className="relative">
                      <AlarmClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="time" value={data.checkInTime}
                        onChange={e => set('checkInTime', e.target.value)}
                        className="input-base pl-8 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Check-out</label>
                    <div className="relative">
                      <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="time" value={data.checkOutTime}
                        onChange={e => set('checkOutTime', e.target.value)}
                        className="input-base pl-8 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Min stay */}
              <div className="bg-gray-50 rounded-xl p-4">
                <SpinnerInput value={data.minStayNights}
                  onChange={v => set('minStayNights', v)}
                  label="Minimum stay (nights)" icon={Moon} min={1} max={90} />
              </div>

              {/* House rules */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2.5">House rules</p>
                <div className="space-y-2">
                  {HOUSE_RULES.map(({ key, label, Icon }) => (
                    <label key={key}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className="text-gray-500" />
                        <span className="text-sm text-gray-700">{label}</span>
                      </div>
                      <div
                        onClick={() => set('houseRules', { ...data.houseRules, [key]: !data.houseRules[key] })}
                        className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                          data.houseRules[key] ? 'bg-primary-500' : 'bg-gray-200'
                        }`}
                        style={{ height: '22px' }}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          data.houseRules[key] ? 'left-[22px]' : 'left-0.5'
                        }`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Currency + nightly rate */}
              {isDirect && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Pricing</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Currency</label>
                      <select value={data.currency} onChange={e => set('currency', e.target.value)}
                        className="input-base appearance-none text-sm">
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nightly rate</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          {currencySymbol(data.currency)}
                        </span>
                        <input type="number" min="0" step="0.01"
                          value={data.baseNightlyRate}
                          onChange={e => set('baseNightlyRate', e.target.value)}
                          className="input-base pl-7 text-sm" placeholder="0" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking mode */}
              {isDirect && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Booking mode</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { val: true,  label: 'Instant book', sub: 'Guests book immediately', Icon: Zap },
                      { val: false, label: 'Request first', sub: 'You approve each booking', Icon: ClipboardList },
                    ].map(({ val, label, sub, Icon: Ic }) => (
                      <button key={String(val)} type="button"
                        onClick={() => set('instantBooking', val)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          data.instantBooking === val
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <Ic size={16} className={data.instantBooking === val ? 'text-primary-600 mt-0.5' : 'text-gray-400 mt-0.5'} />
                        <div>
                          <p className={`text-xs font-semibold ${data.instantBooking === val ? 'text-primary-700' : 'text-gray-800'}`}>
                            {label}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancellation policy */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cancellation policy</p>
                <div className="space-y-2">
                  {CANCELLATION_POLICIES.map(({ value, label, sub }) => (
                    <label key={value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        data.cancellationPolicy === value
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" className="accent-primary-600"
                        checked={data.cancellationPolicy === value}
                        onChange={() => set('cancellationPolicy', value)} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft size={16} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {/* Skip (only steps 4) */}
            {step === 4 && (
              <button type="button" onClick={() => setStep(s => s + 1)}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors">
                Skip
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button type="button"
                disabled={!canNext()}
                onClick={() => setStep(s => s + 1)}
                className="btn-primary py-2 px-5 text-sm flex items-center gap-1.5 disabled:opacity-40">
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={handleCreate} disabled={saving}
                className="btn-primary py-2 px-5 text-sm flex items-center gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? 'Creating…' : 'Create property'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Edit schema ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  name:               z.string().min(2).max(200),
  status:             z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
  propertyType:       z.string().optional(),
  address:            z.string().optional(),
  city:               z.string().optional(),
  state:              z.string().optional(),
  country:            z.string().optional(),
  postalCode:         z.string().optional(),
  description:        z.string().optional(),
  maxGuests:          z.coerce.number().int().positive().optional().or(z.literal('')),
  bedrooms:           z.coerce.number().int().min(0).optional().or(z.literal('')),
  bathrooms:          z.coerce.number().int().min(0).optional().or(z.literal('')),
  currency:           z.string().length(3).optional(),
  baseNightlyRate:    z.coerce.number().min(0).optional().or(z.literal('')),
  cleaningFee:        z.coerce.number().min(0).optional().or(z.literal('')),
  securityDeposit:    z.coerce.number().min(0).optional().or(z.literal('')),
  minStayNights:      z.coerce.number().int().min(1).optional().or(z.literal('')),
  maxStayNights:      z.coerce.number().int().min(1).optional().or(z.literal('')),
  checkInTime:        z.string().optional(),
  checkOutTime:       z.string().optional(),
  instantBooking:     z.boolean().optional(),
  cancellationPolicy: z.string().optional(),
  bufferDaysBefore:   z.coerce.number().int().min(0).optional().or(z.literal('')),
  bufferDaysAfter:    z.coerce.number().int().min(0).optional().or(z.literal('')),
  depositRequired:    z.boolean().optional(),
  depositPercent:     z.coerce.number().min(0).max(100).optional().or(z.literal('')),
})
type EditFormData = z.infer<typeof editSchema>

// ── EDIT MODAL: tabbed, existing property ────────────────────────────────────

function PropertyEditModal({ property, isDirect, onClose, onSaved }: {
  property: Property
  isDirect: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'details' | 'pricing' | 'policies' | 'amenities' | 'photos'>('details')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenitiesLoaded, setAmenitiesLoaded] = useState(false)

  // Load amenities lazily when tab is first opened
  const loadAmenities = async () => {
    if (amenitiesLoaded) return
    try {
      const saved = await amenitiesApi.list(property.id)
      setAmenities(saved.map(a => a.name.toLowerCase().replace(/\s+/g, '_')))
    } catch { /* non-fatal */ }
    setAmenitiesLoaded(true)
  }

  interface PhotoItem { url: string; id?: string }
  const [photos, setPhotos] = useState<PhotoItem[]>(
    (property.photos ?? []).map(p => ({ url: p.url, id: p.id }))
  )
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])
  const editDragIdx = useRef<number | null>(null)

  const removePhoto = (idx: number) => {
    const item = photos[idx]
    if (item.id) setDeletedPhotoIds(ids => [...ids, item.id!])
    setPhotos(p => p.filter((_, j) => j !== idx))
  }

  const addPhotoFiles = async (files: File[]) => {
    for (const file of files) {
      try {
        const { path } = await fileUploadApi.upload(file)
        setPhotos(p => p.length < 12 ? [...p, { url: path }] : p)
      } catch {
        toast.error('Failed to upload photo')
      }
    }
  }

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: property.name,
      status: (property.status as 'DRAFT' | 'ACTIVE' | 'INACTIVE') ?? 'DRAFT',
      propertyType: property.propertyType ?? '',
      address: property.address ?? '',
      city: property.city ?? '',
      state: property.state ?? '',
      country: property.country ?? '',
      postalCode: property.postalCode ?? '',
      description: property.description ?? '',
      maxGuests: property.maxGuests ?? '',
      bedrooms: property.bedrooms ?? '',
      bathrooms: property.bathrooms ?? '',
      currency: property.currency ?? 'USD',
      baseNightlyRate: property.baseNightlyRate ?? '',
      cleaningFee: property.cleaningFee ?? '',
      securityDeposit: property.securityDeposit ?? '',
      minStayNights: property.minStayNights ?? 1,
      maxStayNights: property.maxStayNights ?? '',
      checkInTime: property.checkInTime ?? '15:00',
      checkOutTime: property.checkOutTime ?? '11:00',
      instantBooking: property.instantBooking ?? true,
      cancellationPolicy: property.cancellationPolicy ?? 'MODERATE',
      bufferDaysBefore: property.bufferDaysBefore ?? 0,
      bufferDaysAfter: property.bufferDaysAfter ?? 0,
      depositRequired: property.depositRequired ?? false,
      depositPercent: property.depositPercent ?? '',
    },
  })

  const onSubmit = async (data: EditFormData) => {
    try {
      const payload: any = {
        name: data.name,
        status: data.status,
        propertyType: data.propertyType || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        country: data.country || undefined,
        postalCode: data.postalCode || undefined,
        description: data.description || undefined,
        maxGuests: data.maxGuests || undefined,
        bedrooms: data.bedrooms !== '' ? data.bedrooms : undefined,
        bathrooms: data.bathrooms !== '' ? data.bathrooms : undefined,
        currency: data.currency || 'USD',
        baseNightlyRate: data.baseNightlyRate || undefined,
        cleaningFee: data.cleaningFee || undefined,
        securityDeposit: data.securityDeposit || undefined,
        minStayNights: data.minStayNights || 1,
        maxStayNights: data.maxStayNights || 365,
        checkInTime: data.checkInTime || '15:00',
        checkOutTime: data.checkOutTime || '11:00',
        instantBooking: data.instantBooking ?? true,
        cancellationPolicy: data.cancellationPolicy || 'MODERATE',
        bufferDaysBefore: data.bufferDaysBefore || 0,
        bufferDaysAfter: data.bufferDaysAfter || 0,
        depositRequired: data.depositRequired ?? false,
        depositPercent: data.depositPercent || undefined,
      }
      await propertiesApi.update(orgId, property.id, payload)

      // Delete removed photos
      for (const photoId of deletedPhotoIds) {
        try { await propertiesApi.deletePhoto(orgId, property.id, photoId) } catch { /* non-fatal */ }
      }
      // Add new photos and collect IDs for all photos in display order
      const finalPhotos: PhotoItem[] = []
      for (const photo of photos) {
        if (photo.id) {
          finalPhotos.push(photo)
        } else {
          try {
            const saved = await propertiesApi.addPhoto(orgId, property.id, { url: photo.url, sortOrder: 99 })
            finalPhotos.push({ url: photo.url, id: saved.id })
          } catch { finalPhotos.push(photo) }
        }
      }
      // Persist final order
      const orderedIds = finalPhotos.filter(p => p.id).map(p => p.id!)
      if (orderedIds.length > 0) {
        try { await propertiesApi.reorderPhotos(orgId, property.id, orderedIds) } catch { /* non-fatal */ }
      }

      // Save amenities if the tab was opened
      if (amenitiesLoaded) {
        const amenityItems = amenities.map(key => {
          const preset = AMENITY_PRESETS.find(p => p.key === key)
          return preset
            ? { name: preset.label, category: preset.category, icon: preset.icon }
            : { name: key, category: 'general', icon: '' }
        })
        try { await amenitiesApi.replace(property.id, amenityItems) } catch { /* non-fatal */ }
      }

      qc.invalidateQueries({ queryKey: ['properties', orgId] })
      toast.success('Property updated')
      onSaved()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving property')
    }
  }

  const TABS = [
    { id: 'details',   label: 'Details' },
    { id: 'pricing',   label: isDirect ? 'Pricing' : 'Room' },
    { id: 'policies',  label: 'Policies' },
    { id: 'amenities', label: `Amenities${amenities.length > 0 ? ` (${amenities.length})` : ''}` },
    { id: 'photos',    label: `Photos${photos.length > 0 ? ` (${photos.length})` : ''}` },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit property</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as any); if (t.id === 'amenities') loadAmenities() }}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

            {tab === 'details' && (
              <div className="space-y-4">
                {/* Status — most important field: controls guest visibility */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Listing status</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Only <span className="font-semibold text-emerald-600">Active</span> properties appear on your booking website
                    </p>
                  </div>
                  <select {...register('status')} className="input-base w-36 text-sm">
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Property name *</label>
                    <input {...register('name')} className="input-base" />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                    <select {...register('propertyType')} className="input-base appearance-none">
                      <option value="">Select…</option>
                      {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <input {...register('address')} className="input-base" placeholder="Street address" />
                <div className="grid grid-cols-2 gap-3">
                  <input {...register('city')}       className="input-base" placeholder="City" />
                  <input {...register('state')}      className="input-base" placeholder="State / Region" />
                  <div className="relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select {...register('country')} className="input-base pl-8 appearance-none">
                      <option value="">Country…</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input {...register('postalCode')} className="input-base" placeholder="Postal code" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bedrooms</label>
                    <input {...register('bedrooms')}  type="number" min="0" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bathrooms</label>
                    <input {...register('bathrooms')} type="number" min="0" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max guests</label>
                    <input {...register('maxGuests')} type="number" min="1" className="input-base" />
                  </div>
                </div>
                <textarea {...register('description')} rows={3} className="input-base resize-none"
                  placeholder="Description…" />
              </div>
            )}

            {tab === 'pricing' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select {...register('currency')} className="input-base appearance-none">
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                {isDirect && (() => {
                  const sym = currencySymbol(watch('currency') ?? property.currency)
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { field: 'baseNightlyRate', label: 'Nightly rate' },
                        { field: 'cleaningFee',     label: 'Cleaning fee' },
                        { field: 'securityDeposit', label: 'Security deposit' },
                      ].map(({ field, label }) => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span>
                            <input {...register(field as any)} type="number" min="0" step="0.01"
                              className="input-base pl-7" placeholder="0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {tab === 'policies' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Check-in</label>
                    <input {...register('checkInTime')}  type="time" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Check-out</label>
                    <input {...register('checkOutTime')} type="time" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min stay (nights)</label>
                    <input {...register('minStayNights')} type="number" min="1" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max stay (nights)</label>
                    <input {...register('maxStayNights')} type="number" min="1" className="input-base" placeholder="365" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cancellation policy</label>
                  <select {...register('cancellationPolicy')} className="input-base">
                    {CANCELLATION_POLICIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {isDirect && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Booking mode</label>
                    <div className="space-y-2">
                      {[
                        { val: 'true',  label: 'Instant booking', sub: 'Guests book without waiting' },
                        { val: 'false', label: 'Request to book',  sub: 'You approve each booking' },
                      ].map(opt => (
                        <label key={opt.val} className="flex items-start gap-2.5 cursor-pointer">
                          <input {...register('instantBooking')} type="radio" value={opt.val}
                            className="accent-primary-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                            <p className="text-xs text-gray-400">{opt.sub}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Buffer before check-in (days)</label>
                    <input {...register('bufferDaysBefore')} type="number" min="0" max="14" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Buffer after checkout (days)</label>
                    <input {...register('bufferDaysAfter')} type="number" min="0" max="14" className="input-base" />
                  </div>
                </div>
              </div>
            )}

            {tab === 'amenities' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Select all amenities available at your property. These will appear on your guest booking page.</p>
                {!amenitiesLoaded ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                    <Loader2 size={14} className="animate-spin" /> Loading…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AMENITY_PRESETS.map(preset => {
                      const active = amenities.includes(preset.key)
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => setAmenities(prev => active ? prev.filter(k => k !== preset.key) : [...prev, preset.key])}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                            active ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="flex-shrink-0">{active ? '✓' : '+'}</span>
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                )}
                {amenities.length > 0 && (
                  <p className="text-xs text-gray-400">{amenities.length} amenities selected</p>
                )}
              </div>
            )}

            {tab === 'photos' && (
              <div className="space-y-4">
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                    if (files.length) addPhotoFiles(files)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer"
                >
                  <Upload size={22} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Drag & drop or <span className="text-primary-600">browse</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">First photo is the cover · drag cards to reorder</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                    onChange={e => { addPhotoFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((item, i) => (
                      <div
                        key={item.url}
                        draggable
                        onDragStart={() => { editDragIdx.current = i }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.stopPropagation()
                          const from = editDragIdx.current
                          if (from === null || from === i) return
                          setPhotos(p => {
                            const arr = [...p]
                            arr.splice(i, 0, arr.splice(from, 1)[0])
                            return arr
                          })
                          editDragIdx.current = null
                        }}
                        className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing"
                      >
                        <img src={toDisplayUrl(item.url)} alt="" className="w-full h-full object-cover pointer-events-none" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <GripVertical size={14} className="text-white drop-shadow" />
                        </div>
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={11} />
                        </button>
                        {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-5 text-sm flex items-center gap-1.5">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function PropertiesPage() {
  const { activeOrg }       = useAuthStore()
  const { isDirectBooking } = useSystemStore()
  const orgId               = activeOrg?.id ?? ''
  const isDirect            = isDirectBooking()
  const qc                  = useQueryClient()

  const [showWizard, setShowWizard]   = useState(false)
  const [editProp, setEditProp]       = useState<Property | null>(null)
  const [deleteProp, setDeleteProp]   = useState<Property | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['properties', orgId],
    queryFn:  () => propertiesApi.list(orgId, 0, 100),
    enabled:  !!orgId,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => propertiesApi.delete(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties', orgId] })
      toast.success('Property deleted')
      setDeleteProp(null)
    },
    onError: () => toast.error('Could not delete property'),
  })

  const properties = data?.content ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={15} /> Add property
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse">
              <div className="h-40 bg-gray-100 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && properties.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-14 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Add your first property — it only takes a few minutes.
          </p>
          <button onClick={() => setShowWizard(true)} className="btn-primary py-2.5 px-6 flex items-center gap-2">
            <Plus size={15} /> Add first property
          </button>
        </div>
      )}

      {/* Properties grid */}
      {!isLoading && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map(p => (
            <PropertyCard
              key={p.id} property={p} isDirect={isDirect}
              onEdit={() => setEditProp(p)}
              onDelete={() => setDeleteProp(p)}
            />
          ))}
          <button onClick={() => setShowWizard(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all min-h-[200px]">
            <Plus size={22} />
            <span className="text-sm font-medium">Add property</span>
          </button>
        </div>
      )}

      {/* Wizard: new property */}
      {showWizard && (
        <PropertyWizard
          isDirect={isDirect}
          onClose={() => setShowWizard(false)}
          onSaved={() => setShowWizard(false)}
        />
      )}

      {/* Edit modal: existing property */}
      {editProp && (
        <PropertyEditModal
          property={editProp}
          isDirect={isDirect}
          onClose={() => setEditProp(null)}
          onSaved={() => setEditProp(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete property?</h3>
            <p className="text-sm text-gray-500 mb-6">
              "<strong>{deleteProp.name}</strong>" will be permanently deleted including all bookings.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteProp(null)} className="btn-secondary flex-1 justify-center py-2.5">
                Cancel
              </button>
              <button onClick={() => deleteMut.mutate(deleteProp.id)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {deleteMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
