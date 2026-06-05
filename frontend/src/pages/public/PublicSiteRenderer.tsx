import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star, MapPin, Wifi, Wind, Waves, Car, Coffee, Laptop, Tv, Flame,
  TreePine, Flower, Utensils, ChevronDown, ChevronUp, Phone, Mail,
  Instagram, Facebook, Twitter, Home, ArrowRight, BedDouble, Bath, Users,
} from 'lucide-react'

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
}

export interface PublicPropertyCard {
  id: string
  slug: string
  name: string
  imageUrl: string
  photoUrls: string[]
  city: string
  country: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  baseNightlyRate: number
  cleaningFee: number
  propertyType: string
  minStayNights: number
  checkInTime: string
  checkOutTime: string
}

function btnRadius(style: string) {
  if (style === 'pill') return '999px'
  if (style === 'square') return '3px'
  return '8px'
}

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi, ac: Wind, pool: Waves, hot_tub: Flame, kitchen: Coffee,
  parking: Car, workspace: Laptop, garden: TreePine, balcony: Flower,
  bbq: Flame, washer: Utensils, tv: Tv,
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
          {prop.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={14} />{prop.bedrooms} bed{prop.bedrooms !== 1 ? 's' : ''}</span>}
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

function HeroSection({ cfg, primary, accent, font, btnStyle, properties, navigate, getPropertyUrl }: SectionBaseProps) {
  const heroImg = cfg.backgroundImageUrl || properties[0]?.photoUrls?.[0] || properties[0]?.imageUrl
  return (
    <section style={{ fontFamily: font }}>
      <div
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: cfg.height === 'small' ? 320 : cfg.height === 'medium' ? 480 : 600 }}
      >
        {heroImg && <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}cc 0%, ${primary}88 100%)` }} />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {cfg.headline || 'Welcome'}
          </h1>
          <p className="text-white/85 text-lg sm:text-xl mb-8 leading-relaxed max-w-2xl mx-auto">
            {cfg.subheadline || 'Book direct for the best rates and a personal experience'}
          </p>
          {cfg.ctaText && properties[0] && (
            <button
              onClick={() => navigate(getPropertyUrl(properties[0].slug))}
              className="px-10 py-4 font-bold text-base text-white shadow-xl hover:opacity-90 transition-opacity"
              style={btnStyle}
            >
              {cfg.ctaText}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ cfg, primary, accent, font, properties }: SectionBaseProps) {
  const allPhotos: string[] = []
  properties.forEach(p => {
    if (p.photoUrls?.length) allPhotos.push(...p.photoUrls)
    else if (p.imageUrl) allPhotos.push(p.imageUrl)
  })
  const photos = allPhotos.slice(0, cfg.maxPhotos || 9)
  const cols = cfg.columns || 3
  if (photos.length === 0) return null
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-6xl mx-auto">
        {cfg.title && <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">{cfg.title}</h2>}
        {cfg.subtitle && <p className="text-gray-500 text-center mb-8">{cfg.subtitle}</p>}
        <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {photos.map((url, i) => (
            <div key={i} className={`rounded-xl overflow-hidden ${i === 0 && cfg.featuredFirst ? 'col-span-2 row-span-2' : ''}`}>
              <img src={url} alt="" className="w-full h-52 object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutSection({ cfg, primary, accent, font, properties }: SectionBaseProps) {
  const aboutImg = cfg.imageUrl || properties[0]?.photoUrls?.[0] || properties[0]?.imageUrl
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <div className={`flex flex-col md:flex-row gap-10 items-center ${cfg.imagePosition === 'left' ? 'md:flex-row-reverse' : ''}`}>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{cfg.title || 'About This Property'}</h2>
            <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
              {cfg.description || 'A beautiful and thoughtfully designed space for your perfect getaway.'}
            </p>
          </div>
          {aboutImg && (
            <div className="w-full md:w-96 h-64 rounded-2xl overflow-hidden flex-shrink-0">
              <img src={aboutImg} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function AmenitiesSection({ cfg, primary, font }: SectionBaseProps) {
  const items: { key?: string; label: string }[] = cfg.items || [
    { key: 'wifi', label: 'WiFi' }, { key: 'kitchen', label: 'Kitchen' },
    { key: 'parking', label: 'Parking' }, { key: 'pool', label: 'Pool' },
    { key: 'ac', label: 'A/C' }, { key: 'workspace', label: 'Workspace' },
    { key: 'tv', label: 'TV' }, { key: 'balcony', label: 'Balcony' },
  ]
  const cols = cfg.columns || 4
  return (
    <section className="py-16 px-4 bg-gray-50" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">{cfg.title || 'Amenities'}</h2>
        {cfg.subtitle && <p className="text-gray-500 text-center mb-2">{cfg.subtitle}</p>}
        <div className={`grid gap-4 mt-8 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {items.map((item, i) => {
            const Icon = (item.key && AMENITY_ICONS[item.key]) || Wifi
            return (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}18` }}>
                  <Icon size={18} style={{ color: primary }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PropertiesListSection({ cfg, primary, buttonStyle, font, properties, navigate, getPropertyUrl }: SectionBaseProps) {
  if (properties.length <= 1) return null
  return (
    <section className="py-16 px-4 bg-gray-50" style={{ fontFamily: font }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{cfg.title || 'Our Properties'}</h2>
        <p className="text-gray-500 mb-8">{properties.length} propert{properties.length === 1 ? 'y' : 'ies'} available</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <PropertyCard key={prop.id} prop={prop} primary={primary} buttonStyle={buttonStyle} onBook={() => navigate(getPropertyUrl(prop.slug))} />
          ))}
        </div>
      </div>
    </section>
  )
}

function BookingWidgetSection({ cfg, primary, font, btnStyle, properties, navigate, getPropertyUrl }: SectionBaseProps) {
  const prop = properties[0]
  if (!prop) return null
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">{cfg.title || 'Book Your Stay'}</h2>
        {cfg.subtitle && <p className="text-gray-500 mb-8">{cfg.subtitle}</p>}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden max-w-lg mx-auto">
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: 'Check-in', val: cfg.checkInNote || (prop.checkInTime ? `From ${prop.checkInTime}` : 'Flexible') },
              { label: 'Check-out', val: cfg.checkOutNote || (prop.checkOutTime ? `By ${prop.checkOutTime}` : 'Flexible') },
            ].map(({ label, val }) => (
              <div key={label} className="p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{val}</p>
              </div>
            ))}
          </div>
          <div className="p-6">
            {prop.baseNightlyRate && (
              <p className="text-center text-2xl font-bold text-gray-900 mb-5">
                ${Number(prop.baseNightlyRate).toFixed(0)}<span className="text-base font-normal text-gray-500"> / night</span>
              </p>
            )}
            <button
              onClick={() => navigate(getPropertyUrl(prop.slug))}
              className="w-full py-4 text-white text-base font-bold shadow-sm hover:opacity-90 transition-opacity"
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
    <section className="py-16 px-4 bg-gray-50" style={{ fontFamily: font }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">{cfg.title || 'Guest Reviews'}</h2>
        <div className="flex items-center justify-center gap-1 mb-10">
          {[1,2,3,4,5].map(i => <Star key={i} size={20} fill={accent} stroke="none" />)}
          <span className="text-base font-semibold text-gray-700 ml-2">{cfg.rating || '4.9'} · {cfg.reviewCount || reviews.length} reviews</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: primary }}>
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                  <div className="flex gap-0.5 mt-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={11} fill={r.rating >= i ? accent : '#d1d5db'} stroke="none" />)}</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">"{r.text}"</p>
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

function HouseRulesSection({ cfg, font }: SectionBaseProps) {
  const rules: { icon: string; text: string }[] = cfg.rules || [
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
    <section className="py-20 px-4 text-center" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`, fontFamily: font }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">{cfg.title || 'Ready to Book?'}</h2>
        <p className="text-white/80 text-lg mb-8">{cfg.subtitle || 'Secure your dates now for the best rates'}</p>
        {properties[0] && (
          <button
            onClick={() => navigate(getPropertyUrl(properties[0].slug))}
            className="px-10 py-4 font-bold text-base shadow-xl hover:opacity-90 transition-opacity text-white"
            style={{ backgroundColor: accent, borderRadius: btnRadius(buttonStyle) }}
          >
            {cfg.buttonText || 'Book Direct & Save'}
          </button>
        )}
      </div>
    </section>
  )
}

function ContactSection({ cfg, primary, font, btnStyle }: SectionBaseProps) {
  return (
    <section className="py-16 px-4 bg-white" style={{ fontFamily: font }}>
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">{cfg.title || 'Get in Touch'}</h2>
        <p className="text-gray-500 text-center mb-8">{cfg.subtitle || "Have questions? We'd love to hear from you."}</p>
        <div className="space-y-4">
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" placeholder="Your name" />
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400" placeholder="Your email" type="email" />
          <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-gray-400" rows={4} placeholder="Your message" />
          <button className="w-full py-3.5 text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={btnStyle}>Send Message</button>
        </div>
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
            {cfg.instagram && <a href={cfg.instagram} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Instagram size={15} /></a>}
            {cfg.facebook && <a href={cfg.facebook} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Facebook size={15} /></a>}
            {cfg.twitter && <a href={cfg.twitter} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Twitter size={15} /></a>}
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
  const font = config.fontFamily || 'Inter'
  return (
    <>
      <div
        className="relative py-24 px-4 text-white overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`, fontFamily: font }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">{config.brandName}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">Browse our properties and book your perfect stay.</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Properties</h2>
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

// ── Main renderer ──────────────────────────────────────────────────────────────

export function PublicSiteRenderer({ sections, config, properties, getPropertyUrl }: {
  sections: PublicSection[]
  config: PublicSiteConfig
  properties: PublicPropertyCard[]
  getPropertyUrl: (slug: string) => string
}) {
  const navigate = useNavigate()
  const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.position - b.position)

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
    </div>
  )
}
