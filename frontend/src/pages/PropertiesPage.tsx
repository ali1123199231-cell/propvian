import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Plus, MapPin, Pencil, Trash2, MoreVertical,
  DollarSign, Clock, Users, Star, Globe, Loader2, X, Check,
  Upload, Camera,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import { useSystemStore } from '@/store/systemStore'
import { COUNTRIES } from '@/constants/countries'
import type { Property, PropertyPhoto } from '@/types'

const PROPERTY_TYPES = [
  'Entire home', 'Private room', 'Hotel room', 'Shared room',
  'Villa', 'Apartment', 'Cabin', 'Cottage', 'Chalet', 'Boat', 'Other',
]

const schema = z.object({
  name:             z.string().min(2, 'At least 2 characters').max(200),
  propertyType:     z.string().optional(),
  address:          z.string().max(500).optional(),
  city:             z.string().max(100).optional(),
  state:            z.string().max(100).optional(),
  country:          z.string().max(100).optional(),
  postalCode:       z.string().max(20).optional(),
  description:      z.string().optional(),
  maxGuests:        z.coerce.number().int().positive().optional().or(z.literal('')),
  bedrooms:         z.coerce.number().int().positive().optional().or(z.literal('')),
  bathrooms:        z.coerce.number().int().positive().optional().or(z.literal('')),
  // Pricing
  baseNightlyRate:  z.coerce.number().min(0).optional().or(z.literal('')),
  cleaningFee:      z.coerce.number().min(0).optional().or(z.literal('')),
  securityDeposit:  z.coerce.number().min(0).optional().or(z.literal('')),
  minStayNights:    z.coerce.number().int().min(1).optional().or(z.literal('')),
  maxStayNights:    z.coerce.number().int().min(1).optional().or(z.literal('')),
  checkInTime:      z.string().optional(),
  checkOutTime:     z.string().optional(),
  instantBooking:   z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ property, isDirect, onEdit, onDelete }: {
  property: Property; isDirect: boolean
  onEdit: () => void; onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const photos: PropertyPhoto[] = (property as any).photos ?? []
  const coverPhoto = photos[0]?.url

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {coverPhoto
              ? <img src={coverPhoto} alt="" className="w-full h-full object-cover" />
              : <Building2 size={18} className="text-primary-600" />
            }
            {photos.length > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center gap-0.5 bg-gray-800/80 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm leading-none">
                <Camera size={8} />{photos.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{property.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {property.propertyType && (
                <span className="text-xs text-gray-400">{property.propertyType}</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                property.status === 'ACTIVE'   ? 'bg-emerald-50 text-emerald-700' :
                property.status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' :
                                                 'bg-amber-50 text-amber-700'
              }`}>{property.status}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-36">
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

      {(property.city || property.country) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <MapPin size={11} />
          {[property.city, property.state, property.country].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Key info row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        {property.bedrooms && <span>{property.bedrooms} bd</span>}
        {property.bathrooms && <span>{property.bathrooms} ba</span>}
        {property.maxGuests && (
          <span className="flex items-center gap-1"><Users size={11} /> Max {property.maxGuests}</span>
        )}
        {property.checkInTime && (
          <span className="flex items-center gap-1"><Clock size={11} /> In: {property.checkInTime}</span>
        )}
        {property.checkOutTime && (
          <span className="flex items-center gap-1"><Clock size={11} /> Out: {property.checkOutTime}</span>
        )}
      </div>

      {/* No photos prompt (direct booking mode) */}
      {isDirect && photos.length === 0 && (
        <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 mb-2 transition-colors">
          <Camera size={11} /> Add photos to attract guests
        </button>
      )}

      {/* Pricing row (direct booking mode) */}
      {isDirect && (
        <div className="pt-3 border-t border-gray-100">
          {property.baseNightlyRate ? (
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-gray-900">
                <DollarSign size={12} className="text-green-500" />
                ${property.baseNightlyRate}/night
              </span>
              {property.cleaningFee ? (
                <span className="text-gray-500">+ ${property.cleaningFee} cleaning</span>
              ) : null}
              {property.minStayNights && property.minStayNights > 1 ? (
                <span className="text-gray-500">{property.minStayNights} night min</span>
              ) : null}
              {property.instantBooking && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Star size={10} /> Instant book
                </span>
              )}
            </div>
          ) : (
            <button onClick={onEdit}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              <DollarSign size={11} /> Set nightly rate →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Property Form Modal ───────────────────────────────────────────────────────

function PropertyFormModal({ property, isDirect, onClose, onSaved }: {
  property?: Property | null
  isDirect: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const qc = useQueryClient()

  const defaultValues: Partial<FormData> = property ? {
    name:            property.name,
    propertyType:    property.propertyType ?? '',
    address:         property.address ?? '',
    city:            property.city ?? '',
    state:           property.state ?? '',
    country:         property.country ?? '',
    postalCode:      property.postalCode ?? '',
    description:     property.description ?? '',
    maxGuests:       property.maxGuests ?? '',
    bedrooms:        property.bedrooms ?? '',
    bathrooms:       property.bathrooms ?? '',
    baseNightlyRate: property.baseNightlyRate ?? '',
    cleaningFee:     property.cleaningFee ?? '',
    securityDeposit: property.securityDeposit ?? '',
    minStayNights:   property.minStayNights ?? '',
    maxStayNights:   property.maxStayNights ?? '',
    checkInTime:     property.checkInTime ?? '15:00',
    checkOutTime:    property.checkOutTime ?? '11:00',
    instantBooking:  property.instantBooking ?? true,
  } : {
    checkInTime: '15:00', checkOutTime: '11:00', instantBooking: true,
    minStayNights: 1,
  }

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Photos state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const existingPhotos: PropertyPhoto[] = (property as any)?.photos ?? []
  const [photos, setPhotos] = useState<string[]>(existingPhotos.map((p: PropertyPhoto) => p.url))
  const [urlInput, setUrlInput] = useState('')

  const handleFileDrop = (e: React.DragEvent) => {
    Array.from(e.dataTransfer.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotos(prev => prev.length < 10 ? [...prev, ev.target!.result as string] : prev)
      }
      reader.readAsDataURL(file)
    })
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotos(prev => prev.length < 10 ? [...prev, ev.target!.result as string] : prev)
      }
      reader.readAsDataURL(file)
    })
  }
  const addPhotoUrl = () => {
    if (urlInput.trim() && photos.length < 10) {
      setPhotos(prev => [...prev, urlInput.trim()])
      setUrlInput('')
    }
  }
  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i))

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        name:            data.name,
        propertyType:    data.propertyType || undefined,
        address:         data.address || undefined,
        city:            data.city || undefined,
        state:           data.state || undefined,
        country:         data.country || undefined,
        postalCode:      data.postalCode || undefined,
        description:     data.description || undefined,
        maxGuests:       data.maxGuests || undefined,
        bedrooms:        data.bedrooms || undefined,
        bathrooms:       data.bathrooms || undefined,
        baseNightlyRate: data.baseNightlyRate || undefined,
        cleaningFee:     data.cleaningFee || undefined,
        securityDeposit: data.securityDeposit || undefined,
        minStayNights:   data.minStayNights || 1,
        maxStayNights:   data.maxStayNights || 365,
        checkInTime:     data.checkInTime || '15:00',
        checkOutTime:    data.checkOutTime || '11:00',
        instantBooking:  data.instantBooking ?? true,
      }
      let savedPropId: string
      if (property) {
        await propertiesApi.update(orgId, property.id, payload)
        savedPropId = property.id
        toast.success('Property updated')
      } else {
        const created = await propertiesApi.create(orgId, payload)
        savedPropId = created.id
        toast.success('Property created!')
      }

      // Save photos (only new ones — those not already saved)
      const existingUrls = existingPhotos.map(p => p.url)
      const newPhotos = photos.filter(url => !existingUrls.includes(url))
      for (const url of newPhotos) {
        try {
          await propertiesApi.addPhoto(orgId, savedPropId, {
            url,
            sortOrder: photos.indexOf(url),
            primary: photos.indexOf(url) === 0,
          })
        } catch { /* non-fatal */ }
      }

      qc.invalidateQueries({ queryKey: ['properties', orgId] })
      onSaved()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving property')
    }
  }

  const [tab, setTab] = useState<'details' | 'pricing' | 'policies' | 'photos'>('details')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {property ? 'Edit property' : 'Add property'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {[
            { id: 'details', label: 'Details' },
            { id: 'pricing', label: isDirect ? 'Pricing' : 'Room info' },
            { id: 'policies', label: 'Policies' },
            { id: 'photos', label: `Photos${photos.length > 0 ? ` (${photos.length})` : ''}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* ── Details tab ── */}
            {tab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Property name *</label>
                    <input {...register('name')} className="input-base" placeholder="Seaside Villa Malibu" />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Property type</label>
                    <select {...register('propertyType')} className="input-base appearance-none">
                      <option value="">Select type…</option>
                      {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <input {...register('address')} className="input-base" placeholder="123 Ocean Drive" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input {...register('city')} className="input-base" placeholder="Miami" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State / Region</label>
                    <input {...register('state')} className="input-base" placeholder="FL" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <div className="relative">
                      <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select {...register('country')} className="input-base pl-8 appearance-none">
                        <option value="">Select…</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal code</label>
                    <input {...register('postalCode')} className="input-base" placeholder="33101" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrooms</label>
                    <input {...register('bedrooms')} type="number" min="0" className="input-base" placeholder="2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bathrooms</label>
                    <input {...register('bathrooms')} type="number" min="0" className="input-base" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max guests</label>
                    <input {...register('maxGuests')} type="number" min="1" className="input-base" placeholder="4" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea {...register('description')} rows={4} className="input-base resize-none"
                    placeholder="Describe your property — location, highlights, what makes it special…" />
                </div>
              </div>
            )}

            {/* ── Pricing tab ── */}
            {tab === 'pricing' && (
              <div className="space-y-4">
                {isDirect && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                      Set your base nightly rate here. You can create custom pricing rules for specific date ranges from the Calendar page.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Base nightly rate ($) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input {...register('baseNightlyRate')} type="number" min="0" step="0.01"
                            className="input-base pl-6" placeholder="150" />
                        </div>
                        {errors.baseNightlyRate && <p className="mt-1 text-xs text-red-500">{errors.baseNightlyRate.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cleaning fee ($)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input {...register('cleaningFee')} type="number" min="0" step="0.01"
                            className="input-base pl-6" placeholder="50" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Security deposit ($)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input {...register('securityDeposit')} type="number" min="0" step="0.01"
                            className="input-base pl-6" placeholder="200" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Policies tab ── */}
            {tab === 'policies' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in time</label>
                    <input {...register('checkInTime')} type="time" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-out time</label>
                    <input {...register('checkOutTime')} type="time" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Min stay (nights)</label>
                    <input {...register('minStayNights')} type="number" min="1" className="input-base" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max stay (nights)</label>
                    <input {...register('maxStayNights')} type="number" min="1" className="input-base" placeholder="365" />
                  </div>
                </div>

                {isDirect && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Booking type</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input {...register('instantBooking')} type="radio" value="true" defaultChecked className="accent-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Instant booking</p>
                          <p className="text-xs text-gray-400">Guests book without waiting for approval</p>
                        </div>
                      </label>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input {...register('instantBooking')} type="radio" value="false" className="accent-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Request to book</p>
                          <p className="text-xs text-gray-400">You approve each booking manually</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Photos tab ── */}
            {tab === 'photos' && (
              <div className="space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileDrop(e) }}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Drag & drop photos or <span className="text-primary-600 font-medium">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 10 photos</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* URL input */}
                <div className="flex gap-2">
                  <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    className="input-base flex-1 text-sm" placeholder="https://example.com/photo.jpg" />
                  <button type="button" onClick={addPhotoUrl} className="btn-secondary px-4 text-sm">Add URL</button>
                </div>

                {/* Photo grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <div key={i} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img src={url} alt="" className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                        {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
                {photos.length === 0 && <p className="text-xs text-gray-400 text-center">No photos yet. Add photos to make your listing stand out.</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary py-2 px-5 text-sm">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isSubmitting ? 'Saving…' : property ? 'Save changes' : 'Create property'}
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

  const [showForm, setShowForm]    = useState(false)
  const [editProp, setEditProp]    = useState<Property | null>(null)
  const [deleteProp, setDeleteProp]= useState<Property | null>(null)

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
            {isDirect && properties.length > 0 && ` · $${properties.length * 10}/month`}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={15} /> Add property
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && properties.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Add your first rental property to start accepting bookings.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary py-2.5 px-6 flex items-center gap-2">
            <Plus size={15} /> Add first property
          </button>
        </div>
      )}

      {/* Properties grid */}
      {!isLoading && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              isDirect={isDirect}
              onEdit={() => setEditProp(p)}
              onDelete={() => setDeleteProp(p)}
            />
          ))}
          <button onClick={() => setShowForm(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all">
            <Plus size={20} />
            <span className="text-sm font-medium">Add property</span>
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      {(showForm || editProp) && (
        <PropertyFormModal
          property={editProp}
          isDirect={isDirect}
          onClose={() => { setShowForm(false); setEditProp(null) }}
          onSaved={() => { setShowForm(false); setEditProp(null) }}
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
              "<strong>{deleteProp.name}</strong>" will be permanently deleted.
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
