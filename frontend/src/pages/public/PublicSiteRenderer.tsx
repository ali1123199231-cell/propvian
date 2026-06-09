import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Star, MapPin, Wifi, Wind, Waves, Car, Coffee, Laptop, Tv, Flame,
  TreePine, Flower, Utensils, ChevronDown, ChevronUp, Phone, Mail,
  Instagram, Facebook, Twitter, Home, ArrowRight, BedDouble, Bath, Users,
  X, ChevronLeft, ChevronRight, CheckCircle, Loader2,
  Sun, Thermometer, WashingMachine, Dumbbell, PawPrint, ArrowUp,
} from 'lucide-react'
import { logger } from '../../lib/logger'

const log = logger.child('WEBSITE')

export interface PublicSection {
  id: string
  sectionType: string
  title?: string
  enabled: boolean
  position: number
  config: Record<string, any>
}

export interface PublicSiteConfig {
  brandName: string
  brandLogoUrl?: string
  primaryColor: string
  accentColor: string
  fontFamily: string
  buttonStyle: string
  stickyBookButton?: boolean
  exitIntentEnabled?: boolean
  exitIntentMessage?: string
  exitIntentDiscount?: number
}

export interface PublicAmenityItem { name: string; icon?: string }
export interface PublicHouseRuleItem { ruleKey: string; allowed: boolean; notes?: string }

export interface PublicPropertyCard {
  id: string
  slug: string
  name: string
  description?: string
  imageUrl: string
  photoUrls: string[]
  city: string
  country: string
  bedrooms: number
  beds?: number
  bathrooms: number
  maxGuests: number
  baseNightlyRate: number
  cleaningFee: number
  propertyType: string
  minStayNights: number
  checkInTime: string
  checkOutTime: string
  amenities?: PublicAmenityItem[]
  houseRules?: PublicHouseRuleItem[]
}

function btnRadius(style: string) {
  if (style === 'pill') return '999px'
  if (style === 'square') return '3px'
  return '8px'
}

// Keys: both the preset key (wifi, kitchen…) and the icon value saved to DB (utensils, car…)
const AMENITY_ICONS: Record<string, any> = {
  // by preset key
  wifi: Wifi, ac: Wind, pool: Waves, hot_tub: Thermometer, kitchen: Coffee,
  parking: Car, workspace: Laptop, garden: TreePine, balcony: Sun,
  bbq: Flame, washer: WashingMachine, tv: Tv, coffee: Coffee,
  gym: Dumbbell, sauna: Flame, pets: PawPrint, elevator: ArrowUp, fireplace: Flame,
  sea_view: Waves, dishwasher: CheckCircle,
  // by icon value stored in DB (from AMENITY_PRESETS icon field)
  utensils: Coffee, car: Car, waves: Waves, wind: Wind, laptop: Laptop,
  sun: Sun, thermometer: Thermometer, trees: TreePine, flame: Flame,
  'washing-machine': WashingMachine, 'check-circle': CheckCircle,
  dumbbell: Dumbbell, 'paw-print': PawPrint, 'arrow-up': ArrowUp, flower: Flower,
}

// ── FAQ accordion ──────────────────────────────────────────────────────────────

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-medium text-gray-800">{item.q}</span>
            {open === i ? <ChevronUp size={16} className="flex-shrink-0 text-gray-400" /> : <ChevronDown size={16} className="flex-shrink-0 text-gray-400" />}
          </button>
          {open === i && (
            <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Photo lightbox ─────────────────────────────────────────────────────────────

function Lightbox({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % photos.length)
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + photos.length) % photos.length)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [photos.length, onClose])

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + photos.length) % photos.length) }}
      >
        <ChevronLeft size={22} />
      </button>
      <img
        src={photos[current]}
        alt=""
        className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
        onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % photos.length) }}
      >
        <ChevronRight size={22} />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); setCurrent(i) }}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Property card ──────────────────────────────────────────────────────────────

function PropertyCard({ prop, primary, buttonStyle, onBook }: {
  prop: PublicPropertyCard
  primary: string
  buttonStyle: string
  onBook: () => void
}) {
  const img = prop.photoUrls?.[0] || prop.imageUrl
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col cursor-pointer group"
      onClick={onBook}
    >
      <div className="relative h-56 bg-gray-100 overflow-hidden flex-shrink-0">
        {img ? (
          <img src={img} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200"><Home size={40} className="text-gray-400" /></div>
        )}
        {prop.propertyType && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full">
            {prop.propertyType}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2">{prop.name}</h3>
        {(prop.city || prop.country) && (
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{[prop.city, prop.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
          {prop.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={14} />{prop.bedrooms} br</span>}
          {prop.beds != null && <span className="flex items-center gap-1"><BedDouble size={14} />{prop.beds} bed{prop.beds !== 1 ? 's' : ''}</span>}
          {prop.bathrooms != null && <span className="flex items-center gap-1"><Bath size={14} />{prop.bathrooms} bath{prop.bathrooms !== 1 ? 's' : ''}</span>}
          {prop.maxGuests != null && <span className="flex items-center gap-1"><Users size={14} />{prop.maxGuests} guest{prop.maxGuests !== 1 ? 's' : ''}</span>}
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
          <div>
            {prop.baseNightlyRate
              ? <><span className="text-lg font-bold text-gray-900">${Number(prop.baseNightlyRate).toFixed(0)}</span><span className="text-sm text-gray-500"> / night</span></>
              : <span className="text-sm text-gray-500">Contact for rates</span>}
            {prop.minStayNights > 1 && <p className="text-xs text-gray-400">{prop.minStayNights} night min</p>}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onBook() }}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary, borderRadius: btnRadius(buttonStyle) }}
          >
            Book <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Section components ─────────────────────────────────────────────────────────

interface SectionBaseProps {
  cfg: Record<string, any>
  primary: string
  accent: string
  font: string
  btnStyle: React.CSSProperties
  buttonStyle: string
  properties: PublicPropertyCard[]
  navigate: (to: string) => void
  getPropertyUrl: (slug: string) => string
}

function HeroSection({ cfg, primary, accent, font, btnStyle, buttonStyle, properties, navigate, getPropertyUrl }: SectionBaseProps) {
  const heroImg = cfg.backgroundImageUrl || properties[0]?.photoUrls?.[0] || properties[0]?.imageUrl
  const minH = cfg.height === 'small' ? 360 : cfg.height === 'medium' ? 520 : 680
  return (
    <section style={{ fontFamily: font }}>
      <div
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: minH }}
      >
        {heroImg ? (
          <>
            <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${primary}bb 0%, ${primary}77 45%, ${accent}55 100%)` }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}ff 0%, ${primary}cc 45%, ${accent}99 100%)` }} />
        )}
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight drop-shadow-sm">
            {cfg.headline || properties[0]?.name || 'Welcome'}
          </h1>
          <p className="text-white/90 text-lg sm:text-xl mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
            {properties[0]?.description || cfg.subheadline || 'Book direct for the best rates and a personal experience'}
          </p>
          {(cfg.ctaText || 'Check Availability') && properties[0] && (
            <button
              onClick={() => navigate(getPropertyUrl(properties[0].slug))}
              className="px-10 py-4 font-bold text-base shadow-2xl hover:opacity-90 transition-all hover:scale-105"
              style={{ backgroundColor: accent, color: '#fff', borderRadius: btnRadius(buttonStyle) }}
            >
              {cfg.ctaText || 'Check Availability'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ cfg, primary, font, properties }: SectionBaseProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const allPhotos: string[] = []
  properties.forEach(p => {
    if (p.photoUrls?.length) allPhotos.push(...p.photoUrls)
    else if (p.imageUrl) allPhotos.push(p.imageUrl)
  })
  const photos = allPhotos.slice(0, cfg.maxPhotos || 9)
  const cols = cfg.columns || 3
  if (photos.length === 0) return null
  const featured = photos.length >= 3
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      {lightboxIndex !== null && (
        <Lightbox photos={photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
      <div className="max-w-6xl mx-auto">
        {cfg.title && (
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{cfg.title}</h2>
            {cfg.subtitle && <p className="text-gray-500 mt-1">{cfg.subtitle}</p>}
            <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: primary }} />
          </div>
        )}
        {featured ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              className="col-span-2 row-span-2 rounded-2xl overflow-hidden cursor-pointer"
              style={{ height: 420 }}
              onClick={() => setLightboxIndex(0)}
            >
              <img src={photos[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            {photos.slice(1, 5).map((url, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ height: 200 }}
                onClick={() => setLightboxIndex(i + 1)}
              >
                <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {photos.map((url, i) => (
              <div key={i} className="rounded-2xl overflow-hidden cursor-pointer" onClick={() => setLightboxIndex(i)}>
                <img src={url} alt="" className="w-full h-60 object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        )}
        {photos.length > 1 && (
          <p className="text-center text-xs text-gray-400 mt-4">Click any photo to view full size</p>
        )}
      </div>
    </section>
  )
}

function AboutSection({ cfg, primary, accent, font, properties }: SectionBaseProps) {
  const aboutImg = cfg.imageUrl || properties[0]?.photoUrls?.[1] || properties[0]?.photoUrls?.[0] || properties[0]?.imageUrl
  return (
    <section className="py-20 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <div className={`flex flex-col md:flex-row gap-12 items-center ${cfg.imagePosition === 'left' ? 'md:flex-row-reverse' : ''}`}>
          <div className="flex-1">
            <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: accent }} />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5 leading-tight">{cfg.title || 'About This Property'}</h2>
            <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line text-lg">
              {properties[0]?.description || cfg.description || 'A beautiful and thoughtfully designed space for your perfect getaway.'}
            </p>
          </div>
          {aboutImg && (
            <div className="w-full md:w-[420px] rounded-3xl overflow-hidden flex-shrink-0 shadow-xl" style={{ height: 320 }}>
              <img src={aboutImg} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function AmenitiesSection({ cfg, primary, accent, font, properties }: SectionBaseProps) {
  const propAmenities = properties[0]?.amenities
  // Property admin data always wins — website-builder config is only a fallback
  const items: { key?: string; label: string }[] =
    propAmenities && propAmenities.length > 0
      ? propAmenities.map(a => ({ key: a.icon, label: a.name }))
      : cfg.items?.length > 0
        ? cfg.items
        : [
            { key: 'wifi', label: 'WiFi' }, { key: 'kitchen', label: 'Kitchen' },
            { key: 'parking', label: 'Parking' }, { key: 'pool', label: 'Pool' },
            { key: 'ac', label: 'A/C' }, { key: 'workspace', label: 'Workspace' },
            { key: 'tv', label: 'TV' }, { key: 'balcony', label: 'Balcony' },
          ]
  const cols = cfg.columns || 4
  return (
    <section className="py-20 px-4 bg-gray-50" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{cfg.title || 'Amenities'}</h2>
          {cfg.subtitle && <p className="text-gray-500 text-base mt-2">{cfg.subtitle}</p>}
          <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: accent }} />
        </div>
        <div className={`grid gap-4 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {items.map((item, i) => {
            const Icon = (item.key && AMENITY_ICONS[item.key]) || Wifi
            return (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primary}22, ${primary}11)` }}>
                  <Icon size={20} style={{ color: primary }} />
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PropertiesListSection({ cfg, primary, accent, buttonStyle, font, properties, navigate, getPropertyUrl }: SectionBaseProps) {
  if (properties.length <= 1) return null
  return (
    <section className="py-20 px-4 bg-gray-50" style={{ fontFamily: font }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="w-10 h-1 rounded-full mb-4" style={{ backgroundColor: accent }} />
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{cfg.title || 'Our Properties'}</h2>
          <p className="text-gray-500">{properties.length} propert{properties.length === 1 ? 'y' : 'ies'} available</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <PropertyCard key={prop.id} prop={prop} primary={primary} buttonStyle={buttonStyle} onBook={() => navigate(getPropertyUrl(prop.slug))} />
          ))}
        </div>
      </div>
    </section>
  )
}

function BookingWidgetSection({ cfg, primary, accent, font, btnStyle, properties, navigate, getPropertyUrl }: SectionBaseProps) {
  const prop = properties[0]
  if (!prop) return null
  return (
    <section className="py-20 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: accent }} />
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{cfg.title || 'Book Your Stay'}</h2>
        {cfg.subtitle && <p className="text-gray-500 text-base mb-8">{cfg.subtitle}</p>}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden max-w-md mx-auto mt-8">
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: 'Check-in', val: prop.checkInTime ? `From ${prop.checkInTime}` : cfg.checkInNote || 'Flexible' },
              { label: 'Check-out', val: prop.checkOutTime ? `By ${prop.checkOutTime}` : cfg.checkOutNote || 'Flexible' },
            ].map(({ label, val }) => (
              <div key={label} className="p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
                <p className="text-sm font-bold text-gray-900">{val}</p>
              </div>
            ))}
          </div>
          <div className="p-6">
            {prop.baseNightlyRate && (
              <div className="text-center mb-5">
                <span className="text-3xl font-extrabold text-gray-900">${Number(prop.baseNightlyRate).toFixed(0)}</span>
                <span className="text-sm font-medium text-gray-400"> / night</span>
              </div>
            )}
            <button
              onClick={() => navigate(getPropertyUrl(prop.slug))}
              className="w-full py-4 text-white text-base font-bold shadow-sm hover:opacity-90 transition-all hover:shadow-md"
              style={btnStyle}
            >
              {cfg.ctaText || (cfg.instantBooking ? 'Reserve Now' : 'Check Availability')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReviewsSection({ cfg, primary, accent, font }: SectionBaseProps) {
  const reviews: { name: string; text: string; rating: number }[] = cfg.reviews || [
    { name: 'Sarah M.', text: 'Absolutely stunning property! The views were breathtaking and the host was incredibly responsive.', rating: 5 },
    { name: 'James R.', text: 'Perfect for our family trip. Spotlessly clean, well-equipped, and exactly as described.', rating: 5 },
  ]
  return (
    <section className="py-20 px-4 bg-gray-50" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{cfg.title || 'Guest Reviews'}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {[1,2,3,4,5].map(i => <Star key={i} size={22} fill={accent} stroke="none" />)}
            <span className="text-base font-bold text-gray-700 ml-2">{cfg.rating || '4.9'}</span>
            <span className="text-gray-400 text-sm">· {cfg.reviewCount || reviews.length} reviews</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(j => <Star key={j} size={14} fill={r.rating >= j ? accent : '#e5e7eb'} stroke="none" />)}</div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{r.text}"</p>
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
                  {r.name[0]}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqSection({ cfg, font }: SectionBaseProps) {
  const items: { q: string; a: string }[] = cfg.items || [
    { q: 'What time is check-in/check-out?', a: 'Check-in is at 3:00 PM and check-out is at 11:00 AM.' },
    { q: 'Is parking available?', a: 'Yes, free parking is available on the premises.' },
    { q: 'Are pets allowed?', a: 'Please contact us for our pet policy.' },
  ]
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">{cfg.title || 'Frequently Asked Questions'}</h2>
        {cfg.subtitle && <p className="text-gray-500 text-center mb-8">{cfg.subtitle}</p>}
        <div className="mt-8"><FaqAccordion items={items} /></div>
      </div>
    </section>
  )
}

function HostInfoSection({ cfg, primary, accent, font, btnStyle }: SectionBaseProps) {
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">{cfg.title || 'Your Host'}</h2>
        <div className="flex flex-col items-center gap-5">
          {cfg.hostPhotoUrl
            ? <img src={cfg.hostPhotoUrl} alt={cfg.hostName || 'Host'} className="w-24 h-24 rounded-full object-cover shadow-lg" />
            : <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }}>{(cfg.hostName || 'H')[0]}</div>
          }
          <div>
            <p className="text-xl font-bold text-gray-900">{cfg.hostName || 'Your Host'}</p>
            <p className="text-sm text-gray-500 mt-1">{cfg.hostSince ? `Host since ${cfg.hostSince}` : 'Superhost'}</p>
            {cfg.hostBio && <p className="text-gray-600 mt-4 leading-relaxed max-w-xl mx-auto">{cfg.hostBio}</p>}
            {cfg.showContactButton && (
              <button className="mt-5 px-6 py-3 text-white font-semibold hover:opacity-90 transition-opacity" style={btnStyle}>Contact Host</button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const RULE_LABELS: Record<string, string> = {
  SMOKING: 'Smoking', PARTIES: 'Parties / events', PETS: 'Pets',
  QUIET_HOURS: 'Quiet hours', CHILDREN: 'Children',
}
const RULE_ICONS: Record<string, string> = {
  SMOKING: '🚬', PARTIES: '🎉', PETS: '🐾', QUIET_HOURS: '🌙', CHILDREN: '👶',
}

function HouseRulesSection({ cfg, font, properties }: SectionBaseProps) {
  const propRules = properties[0]?.houseRules
  // Property admin data always wins — website-builder config is only a fallback
  const rules: { icon: string; text: string }[] =
    propRules && propRules.length > 0
      ? propRules.map(r => ({
          icon: r.allowed ? '✅' : (RULE_ICONS[r.ruleKey] ?? '🚫'),
          text: `${RULE_LABELS[r.ruleKey] ?? r.ruleKey.replace(/_/g, ' ')}${r.allowed ? ' allowed' : ' not allowed'}${r.notes ? ` (${r.notes})` : ''}`,
        }))
      : cfg.rules?.length > 0
        ? cfg.rules
        : [
            { icon: '🚫', text: 'No smoking' }, { icon: '🎉', text: 'No parties or events' },
            { icon: '🌙', text: 'Quiet hours: 10 PM – 8 AM' }, { icon: '🐾', text: 'No pets without approval' },
          ]
  return (
    <section className="py-16 px-4 bg-gray-50" style={{ fontFamily: font }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">{cfg.title || 'House Rules'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
              <span className="text-2xl flex-shrink-0">{rule.icon}</span>
              <span className="text-sm font-medium text-gray-700">{rule.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LocationSection({ cfg, primary, font }: SectionBaseProps) {
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">{cfg.title || 'Location'}</h2>
        {cfg.description && <p className="text-gray-500 mb-6">{cfg.description}</p>}
        {cfg.mapEmbedUrl ? (
          <iframe src={cfg.mapEmbedUrl} className="w-full h-80 rounded-2xl border border-gray-200" loading="lazy" title="Map" />
        ) : (
          <div className="h-64 rounded-2xl flex items-center justify-center bg-gray-100 border border-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 40px, ${primary}30 40px, ${primary}30 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, ${primary}30 40px, ${primary}30 41px)` }} />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primary }}>
                <MapPin size={20} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-700 bg-white px-4 py-1.5 rounded-full shadow-sm">{cfg.address || 'View on Map'}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function NearbySection({ cfg, primary, font }: SectionBaseProps) {
  const items: { name: string; category: string; distance: string }[] = cfg.items || [
    { name: 'City Center', category: 'Culture', distance: '2 km' },
    { name: 'Main Beach', category: 'Nature', distance: '500 m' },
    { name: 'Local Market', category: 'Shopping', distance: '1 km' },
  ]
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">{cfg.title || 'Nearby Attractions'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${primary}18` }}>
                <MapPin size={20} style={{ color: primary }} />
              </div>
              <p className="text-sm font-bold text-gray-800">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: primary }}>{item.distance}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SpecialOffersSection({ cfg, accent, font }: SectionBaseProps) {
  const offers: { title: string; description: string; discount: string; validUntil?: string }[] = cfg.offers || [
    { title: 'Early Bird Discount', description: 'Book 30+ days in advance', discount: '15%', validUntil: 'Dec 31' },
  ]
  return (
    <section className="py-16 px-4" style={{ background: `linear-gradient(135deg, #f8f9ff 0%, #fffbf0 100%)`, fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{cfg.title || 'Special Offers'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {offers.map((offer, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border-l-4" style={{ borderColor: accent }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{offer.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{offer.description}</p>
                </div>
                <span className="text-3xl font-black" style={{ color: accent }}>{offer.discount}</span>
              </div>
              {offer.validUntil && <p className="text-xs text-gray-400 mt-2">Valid until {offer.validUntil}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection({ cfg, primary, accent, font, buttonStyle, properties, navigate, getPropertyUrl }: SectionBaseProps) {
  return (
    <section className="py-24 px-4 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 50%, ${accent}99 100%)`, fontFamily: font }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
      <div className="relative z-10 max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">{cfg.title || 'Ready to Book?'}</h2>
        <p className="text-white/85 text-lg sm:text-xl mb-10">{cfg.subtitle || 'Secure your dates now for the best rates'}</p>
        {properties[0] && (
          <button
            onClick={() => navigate(getPropertyUrl(properties[0].slug))}
            className="px-12 py-4 font-bold text-base shadow-2xl hover:opacity-90 transition-all hover:scale-105 text-white"
            style={{ backgroundColor: accent, borderRadius: btnRadius(buttonStyle) }}
          >
            {cfg.buttonText || 'Book Direct & Save'}
          </button>
        )}
      </div>
    </section>
  )
}

function ContactSection({ cfg, primary, font, btnStyle, properties }: SectionBaseProps) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    const slug = properties[0]?.slug
    if (!slug) return
    setStatus('submitting')
    try {
      await axios.post(`/api/public/messaging/properties/${slug}`, {
        guestName: form.name.trim(),
        guestEmail: form.email.trim(),
        body: form.message.trim(),
      })
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">{cfg.title || 'Get in Touch'}</h2>
        <p className="text-gray-500 text-center mb-8">{cfg.subtitle || "Have questions? We'd love to hear from you."}</p>

        {status === 'success' ? (
          <div className="text-center py-10">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <p className="text-xl font-bold text-gray-900 mb-2">Message Sent!</p>
            <p className="text-gray-500 mb-6">We'll get back to you as soon as possible.</p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm font-medium underline"
              style={{ color: primary }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              placeholder="Your email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-gray-400"
              rows={4}
              placeholder="Your message"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
            {status === 'error' && (
              <p className="text-sm text-red-500 text-center">Something went wrong. Please try again.</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={status === 'submitting' || !form.name || !form.email || !form.message}
              className="w-full py-3.5 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={btnStyle}
            >
              {status === 'submitting' ? <><Loader2 size={16} className="animate-spin" />Sending…</> : 'Send Message'}
            </button>
          </div>
        )}

        {(cfg.phone || cfg.email) && (
          <div className="flex flex-wrap justify-center gap-6 mt-7 text-sm text-gray-500">
            {cfg.phone && <div className="flex items-center gap-1.5"><Phone size={14} style={{ color: primary }} />{cfg.phone}</div>}
            {cfg.email && <div className="flex items-center gap-1.5"><Mail size={14} style={{ color: primary }} />{cfg.email}</div>}
          </div>
        )}
      </div>
    </section>
  )
}

function VideoSection({ cfg, font }: SectionBaseProps) {
  if (!cfg.videoUrl && !cfg.embedUrl) return null
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-4xl mx-auto">
        {cfg.title && <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{cfg.title}</h2>}
        <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
          {cfg.embedUrl
            ? <iframe src={cfg.embedUrl} className="w-full h-full" allowFullScreen title="Property video" />
            : <video src={cfg.videoUrl} controls className="w-full h-full object-cover" />
          }
        </div>
        {cfg.caption && <p className="text-sm text-gray-500 text-center mt-3">{cfg.caption}</p>}
      </div>
    </section>
  )
}

function FooterSection({ cfg, accent, font, config }: SectionBaseProps & { config: PublicSiteConfig }) {
  const links: { label: string; url?: string }[] = cfg.links || []
  return (
    <footer className="py-12 px-4 bg-gray-900 text-white" style={{ fontFamily: font }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-lg" style={{ color: accent }}>{cfg.brandName || config.brandName}</p>
            <p className="text-sm text-gray-400 mt-1">© {new Date().getFullYear()} {cfg.copyright || 'All rights reserved'}</p>
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-5 justify-center">
              {links.map((link, i) => (
                <a key={i} href={link.url || '#'} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</a>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Instagram size={15} /></a>}
            {cfg.facebook && <a href={cfg.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Facebook size={15} /></a>}
            {cfg.twitter && <a href={cfg.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Twitter size={15} /></a>}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Single section dispatcher ──────────────────────────────────────────────────

function SectionDispatcher({ section, config, properties, navigate, getPropertyUrl }: {
  section: PublicSection
  config: PublicSiteConfig
  properties: PublicPropertyCard[]
  navigate: (to: string) => void
  getPropertyUrl: (slug: string) => string
}) {
  if (!section.enabled) return null
  const cfg = section.config || {}
  const primary = config.primaryColor || '#6366F1'
  const accent = config.accentColor || '#F59E0B'
  const font = config.fontFamily || 'Inter'
  const buttonStyle = config.buttonStyle || 'rounded'
  const btnStyle: React.CSSProperties = { backgroundColor: primary, borderRadius: btnRadius(buttonStyle), fontFamily: font }
  const props: SectionBaseProps = { cfg, primary, accent, font, btnStyle, buttonStyle, properties, navigate, getPropertyUrl }

  switch (section.sectionType) {
    case 'hero': return <HeroSection {...props} />
    case 'gallery': return <GallerySection {...props} />
    case 'about': return <AboutSection {...props} />
    case 'amenities': return <AmenitiesSection {...props} />
    case 'properties': return <PropertiesListSection {...props} />
    case 'booking-widget': return <BookingWidgetSection {...props} />
    case 'reviews': return <ReviewsSection {...props} />
    case 'faq': return <FaqSection {...props} />
    case 'host-info': return <HostInfoSection {...props} />
    case 'house-rules': return <HouseRulesSection {...props} />
    case 'location': return <LocationSection {...props} />
    case 'nearby': return <NearbySection {...props} />
    case 'special-offers': return <SpecialOffersSection {...props} />
    case 'cta': return <CtaSection {...props} />
    case 'contact': return <ContactSection {...props} />
    case 'video': return <VideoSection {...props} />
    case 'footer': return <FooterSection {...props} config={config} />
    default: return null
  }
}

// ── Fallback property listing ──────────────────────────────────────────────────

function DefaultPropertyListing({ properties, config, getPropertyUrl, navigate }: {
  properties: PublicPropertyCard[]
  config: PublicSiteConfig
  getPropertyUrl: (slug: string) => string
  navigate: (to: string) => void
}) {
  const primary = config.primaryColor || '#6366F1'
  const accent = config.accentColor || '#F59E0B'
  const font = config.fontFamily || 'Inter'
  return (
    <>
      <div
        className="relative py-28 px-4 text-white overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 50%, ${accent}99 100%)`, fontFamily: font }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight drop-shadow-sm">{config.brandName}</h1>
          <p className="text-white/85 text-lg sm:text-xl max-w-2xl mx-auto">Browse our properties and book your perfect stay.</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Our Properties</h2>
        <p className="text-gray-500 text-sm mb-8">{properties.length} propert{properties.length === 1 ? 'y' : 'ies'} available</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <PropertyCard key={prop.id} prop={prop} primary={primary} buttonStyle={config.buttonStyle} onBook={() => navigate(getPropertyUrl(prop.slug))} />
          ))}
        </div>
      </div>
    </>
  )
}

// ── Exit intent popup ──────────────────────────────────────────────────────────

function ExitIntentPopup({ config, properties, getPropertyUrl, onDismiss }: {
  config: PublicSiteConfig
  properties: PublicPropertyCard[]
  getPropertyUrl: (slug: string) => string
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  const primary = config.primaryColor || '#6366F1'
  const accent = config.accentColor || '#F59E0B'
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onDismiss}>
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-all"
        >
          <X size={16} />
        </button>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl" style={{ backgroundColor: `${accent}20` }}>
          🎁
        </div>
        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
          {config.exitIntentMessage || 'Wait! Before you go…'}
        </h3>
        {config.exitIntentDiscount && (
          <p className="text-gray-500 mb-6">
            Book now and save <span className="font-bold text-2xl" style={{ color: accent }}>{config.exitIntentDiscount}%</span> on your stay
          </p>
        )}
        {properties[0] && (
          <button
            onClick={() => { onDismiss(); navigate(getPropertyUrl(properties[0].slug)) }}
            className="w-full py-4 text-white font-bold rounded-2xl hover:opacity-90 transition-all hover:shadow-lg mb-3"
            style={{ backgroundColor: primary }}
          >
            Claim My Discount
          </button>
        )}
        <button onClick={onDismiss} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          No thanks, I'll pay full price
        </button>
      </div>
    </div>
  )
}

// ── Main renderer ──────────────────────────────────────────────────────────────

export function PublicSiteRenderer({ sections, config, properties, getPropertyUrl }: {
  sections: PublicSection[]
  config: PublicSiteConfig
  properties: PublicPropertyCard[]
  getPropertyUrl: (slug: string) => string
}) {
  const navigate = useNavigate()
  const [showExitIntent, setShowExitIntent] = useState(false)
  const exitShown = useRef(false)
  const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.position - b.position)

  useEffect(() => {
    const prop = properties[0]
    log.info(`Site loaded: sections=${sections.length} enabled=${enabledSections.length} properties=${properties.length}`)
    if (!prop) return

    log.info(`Primary property: id='${prop.id}' name='${prop.name}'`)

    // ── Per-section sync audit ──────────────────────────────────────────────
    const src = (hasCustom: boolean, fallback: string) => hasCustom ? 'website-builder config' : fallback

    for (const s of sections.filter(sec => sec.enabled)) {
      const c = s.config || {}
      switch (s.sectionType) {
        case 'hero':
          log.info(`[hero] headline: ${src(!!c.headline, prop.name ? `property.name='${prop.name}'` : 'hardcoded "Welcome"')} | subheadline: ${src(!!c.subheadline, prop.description ? `property.description (${prop.description.length} chars)` : 'hardcoded fallback')} | image: ${src(!!c.backgroundImageUrl, prop.photoUrls?.length ? `property.photoUrls[0]` : 'gradient only')}`)
          break
        case 'about':
          log.info(`[about] description: ${src(!!c.description, prop.description ? `property.description (${prop.description.length} chars)` : 'hardcoded placeholder')} | image: ${src(!!c.imageUrl, prop.photoUrls?.length ? 'property.photoUrls' : 'none')}`)
          break
        case 'amenities': {
          const propA = prop.amenities?.length ?? 0
          const cfgItems = c.items?.length ?? 0
          const source = propA > 0 ? `property.amenities (${propA} items) ✅ synced` : cfgItems > 0 ? `website-builder fallback (${cfgItems} items)` : 'hardcoded defaults (8 items)'
          log.info(`[amenities] source: ${source}`)
          if (propA > 0) log.debug(`[amenities] items: ${prop.amenities!.map(a => a.name).join(', ')}`)
          if (propA === 0 && cfgItems > 0) log.warn(`[amenities] ⚠️ showing website-builder config — no amenities set in property admin`)
          break
        }
        case 'house-rules': {
          const propR = prop.houseRules?.length ?? 0
          const cfgRules = c.rules?.length ?? 0
          const source = propR > 0 ? `property.houseRules (${propR} rules) ✅ synced` : cfgRules > 0 ? `website-builder fallback (${cfgRules} rules)` : 'hardcoded defaults (4 rules)'
          log.info(`[house-rules] source: ${source}`)
          if (propR > 0) log.debug(`[house-rules] rules: ${prop.houseRules!.map(r => `${r.ruleKey}=${r.allowed}${r.notes ? ` (${r.notes})` : ''}`).join(', ')}`)
          if (propR === 0 && cfgRules > 0) log.warn(`[house-rules] ⚠️ showing website-builder config — no rules set in property admin`)
          break
        }
        case 'booking-widget':
          log.info(`[booking-widget] checkIn: ${src(!!c.checkInNote, `property.checkInTime='${prop.checkInTime}'`)} | checkOut: ${src(!!c.checkOutNote, `property.checkOutTime='${prop.checkOutTime}'`)} | rate: $${prop.baseNightlyRate}/night`)
          break
        case 'gallery': {
          const photoCount = (prop.photoUrls?.length ?? 0) + (prop.imageUrl ? 1 : 0)
          log.info(`[gallery] source: property.photoUrls (${photoCount} photos available, showing up to ${c.maxPhotos ?? 9})`)
          break
        }
        case 'reviews':
          log.info(`[reviews] source: ${c.reviews?.length > 0 ? `website-builder (${c.reviews.length} reviews)` : 'hardcoded sample reviews'}`)
          break
        case 'faq':
          log.info(`[faq] source: ${c.items?.length > 0 ? `website-builder (${c.items.length} Q&As)` : 'hardcoded sample FAQs'}`)
          break
        case 'location':
          log.info(`[location] address: ${src(!!c.address, `property.city='${prop.city}' country='${prop.country}'`)} | map: ${c.mapEmbedUrl ? 'custom embed' : 'no map'}`)
          break
        default:
          log.debug(`[${s.sectionType}] website-builder only (no property data sync needed)`)
      }
    }
    // Warn about sections that exist in property but not in the site
    const sectionTypes = new Set(sections.filter(s => s.enabled).map(s => s.sectionType))
    if (!sectionTypes.has('amenities') && (prop.amenities?.length ?? 0) > 0)
      log.warn(`Property has ${prop.amenities!.length} amenities but NO amenities section is enabled on this site`)
    if (!sectionTypes.has('house-rules') && (prop.houseRules?.length ?? 0) > 0)
      log.warn(`Property has ${prop.houseRules!.length} house rules but NO house-rules section is enabled on this site`)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.length, sections.length])

  useEffect(() => {
    if (!config.exitIntentEnabled) return
    const handle = (e: MouseEvent) => {
      if (e.clientY < 10 && !exitShown.current) {
        exitShown.current = true
        setShowExitIntent(true)
      }
    }
    document.addEventListener('mouseleave', handle)
    return () => document.removeEventListener('mouseleave', handle)
  }, [config.exitIntentEnabled])

  if (enabledSections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: config.fontFamily || 'Inter' }}>
        <DefaultPropertyListing properties={properties} config={config} getPropertyUrl={getPropertyUrl} navigate={navigate} />
      </div>
    )
  }

  // Auto-inject a properties listing if multi-property and no section handles it
  const hasListingSection = enabledSections.some(s => s.sectionType === 'properties' || s.sectionType === 'booking-widget')
  const hasFooter = enabledSections.some(s => s.sectionType === 'footer')

  const sectionsToRender: PublicSection[] = [...enabledSections]
  if (!hasListingSection && properties.length > 1) {
    sectionsToRender.push({ id: '__auto_properties', sectionType: 'properties', enabled: true, position: 9000, config: { title: 'Our Properties' } })
  }
  if (!hasFooter) {
    sectionsToRender.push({ id: '__auto_footer', sectionType: 'footer', enabled: true, position: 99999, config: {} })
  }
  sectionsToRender.sort((a, b) => a.position - b.position)

  const primary = config.primaryColor || '#6366F1'

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: config.fontFamily || 'Inter' }}>
      {sectionsToRender.map(section => (
        <SectionDispatcher
          key={section.id}
          section={section}
          config={config}
          properties={properties}
          navigate={navigate}
          getPropertyUrl={getPropertyUrl}
        />
      ))}

      {/* Sticky book button */}
      {config.stickyBookButton && properties[0] && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={() => navigate(getPropertyUrl(properties[0].slug))}
            className="flex items-center gap-2 px-5 py-3.5 text-white font-bold text-sm shadow-2xl hover:opacity-90 hover:scale-105 transition-all rounded-2xl"
            style={{ backgroundColor: primary }}
          >
            <ArrowRight size={16} />
            Book Now
          </button>
        </div>
      )}

      {/* Exit intent popup */}
      {showExitIntent && (
        <ExitIntentPopup
          config={config}
          properties={properties}
          getPropertyUrl={getPropertyUrl}
          onDismiss={() => setShowExitIntent(false)}
        />
      )}
    </div>
  )
}
