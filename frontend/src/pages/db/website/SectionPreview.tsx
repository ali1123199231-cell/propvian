import { Star, MapPin, Wifi, Wind, Waves, Car, Coffee, Laptop, Tv, Flame, TreePine, Flower, Utensils, ChevronDown, Phone, Mail, Instagram, Facebook, Twitter, Calendar } from 'lucide-react'
import type { WebsiteSection, WebsiteConfig } from '@/api/websiteBuilder'

interface Props {
  section: WebsiteSection
  config: WebsiteConfig
  isSelected: boolean
  onClick: () => void
}

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi, ac: Wind, pool: Waves, hot_tub: Flame, kitchen: Coffee,
  parking: Car, workspace: Laptop, garden: TreePine, balcony: Flower,
  bbq: Flame, washer: Utensils, tv: Tv,
}

function btnRadius(style: string) {
  if (style === 'pill') return '999px'
  if (style === 'square') return '3px'
  return '8px'
}

export function SectionPreview({ section, config, isSelected, onClick }: Props) {
  const cfg = section.config || {}
  const primary = config.primaryColor || '#6366F1'
  const accent = config.accentColor || '#F59E0B'
  const font = config.fontFamily || 'Inter'
  const btnStyle = { backgroundColor: primary, borderRadius: btnRadius(config.buttonStyle), fontFamily: font }

  const wrapper = `relative cursor-pointer transition-all ${
    isSelected
      ? 'ring-2 ring-primary-500 ring-offset-1'
      : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
  }`

  if (!section.enabled) {
    return (
      <div onClick={onClick} className={`${wrapper} bg-gray-50 border border-dashed border-gray-200 p-4 flex items-center gap-3 opacity-50`}>
        <div className="w-1 h-full bg-gray-300 rounded" />
        <p className="text-xs text-gray-400 font-medium">{SECTION_LABELS[section.sectionType] || section.sectionType} — Hidden</p>
      </div>
    )
  }

  switch (section.sectionType) {
    case 'hero':
      return (
        <div onClick={onClick} className={wrapper}>
          <div
            className="relative flex flex-col items-center justify-center text-center py-20 px-6"
            style={{
              background: `linear-gradient(135deg, ${primary}ee 0%, ${primary}99 50%, ${accent}66 100%)`,
              minHeight: cfg.height === 'small' ? 260 : cfg.height === 'medium' ? 340 : 440,
              fontFamily: font,
            }}
          >
            <div className="relative z-10 max-w-xl">
              <h1 className="text-3xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: font }}>
                {cfg.headline || 'Welcome to Our Property'}
              </h1>
              <p className="text-white/85 text-base mb-6 leading-relaxed">
                {cfg.subheadline || 'Book direct for the best rates and a personal experience'}
              </p>
              <button className="px-8 py-3 font-semibold text-sm text-white shadow-lg" style={btnStyle}>
                {cfg.ctaText || 'Check Availability'}
              </button>
            </div>
          </div>
        </div>
      )

    case 'gallery':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-10 px-6 bg-white">
            <div className={`grid gap-2 ${(cfg.columns || 3) === 2 ? 'grid-cols-2' : (cfg.columns || 3) === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`rounded-lg overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <div
                    className="w-full h-28 flex items-center justify-center"
                    style={{
                      background: i === 0
                        ? `linear-gradient(135deg, ${primary}33 0%, ${accent}22 100%)`
                        : `linear-gradient(${60 * i}deg, ${primary}22 0%, ${accent}11 100%)`,
                    }}
                  >
                    <span className="text-2xl">📷</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'about':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white">
            <div className={`flex gap-8 items-center ${cfg.imagePosition === 'left' ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: font }}>
                  {cfg.title || 'About This Property'}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {cfg.description || 'A beautiful and thoughtfully designed space for your perfect getaway.'}
                </p>
              </div>
              <div className="w-48 h-40 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${primary}22 0%, ${accent}22 100%)` }}>
                <span className="text-4xl">🏡</span>
              </div>
            </div>
          </div>
        </div>
      )

    case 'amenities':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center" style={{ fontFamily: font }}>
              {cfg.title || 'Amenities'}
            </h2>
            <div className={`grid gap-3 ${cfg.columns === 2 ? 'grid-cols-2' : cfg.columns === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {['WiFi', 'Kitchen', 'Parking', 'Pool', 'A/C', 'Workspace', 'TV', 'Balcony'].map((a, i) => {
                const icons = [Wifi, Coffee, Car, Waves, Wind, Laptop, Tv, Flower]
                const Icon = icons[i] || Wifi
                return (
                  <div key={a} className="flex items-center gap-2.5 bg-white rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${primary}15` }}>
                      <Icon size={14} style={{ color: primary }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{a}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )

    case 'booking-widget':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center" style={{ fontFamily: font }}>
              {cfg.title || 'Book Your Stay'}
            </h2>
            <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                {[
                  { label: 'Check-in', val: cfg.checkInNote || 'From 3:00 PM', icon: Calendar },
                  { label: 'Check-out', val: cfg.checkOutNote || 'By 11:00 AM', icon: Calendar },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} style={{ color: primary }} />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{val}</p>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-600">Guests</span>
                  <div className="flex items-center gap-3">
                    <button className="w-7 h-7 rounded-full border border-gray-200 text-sm">−</button>
                    <span className="font-semibold">2</span>
                    <button className="w-7 h-7 rounded-full border border-gray-200 text-sm">+</button>
                  </div>
                </div>
                {cfg.showPricing && (
                  <div className="space-y-1.5 text-sm py-3 border-t border-gray-100 mb-4">
                    <div className="flex justify-between text-gray-600"><span>$150 × 3 nights</span><span>$450</span></div>
                    <div className="flex justify-between text-gray-600"><span>Cleaning fee</span><span>$45</span></div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-100"><span>Total</span><span>$495</span></div>
                  </div>
                )}
                <button className="w-full py-3 text-white text-sm font-semibold shadow-sm" style={btnStyle}>
                  {cfg.instantBooking ? 'Reserve Now' : 'Request to Book'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )

    case 'reviews':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: font }}>
              {cfg.title || 'Guest Reviews'}
            </h2>
            <div className="flex items-center justify-center gap-1 mb-6">
              {[1,2,3,4,5].map(i => <Star key={i} size={16} fill={accent} stroke="none" />)}
              <span className="text-sm font-semibold text-gray-700 ml-2">4.9 · 47 reviews</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Sarah M.', text: 'Absolutely stunning property! The views were breathtaking and the host was incredibly responsive.', rating: 5 },
                { name: 'James R.', text: 'Perfect for our family trip. Spotlessly clean, well-equipped, and exactly as described.', rating: 5 },
              ].map(r => (
                <div key={r.name} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: primary }}>
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{r.name}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} size={8} fill={accent} stroke="none" />)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">"{r.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'faq':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center" style={{ fontFamily: font }}>
              {cfg.title || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-2">
              {((cfg.items as any[]) || [
                { q: 'What time is check-in/check-out?', a: 'Check-in is at 3:00 PM and check-out is at 11:00 AM.' },
                { q: 'Is parking available?', a: 'Yes, free parking is available on the premises.' },
                { q: 'Are pets allowed?', a: 'Please contact us for our pet policy.' },
              ]).slice(0, 4).map((item: any, i: number) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-800">{item.q}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                  {i === 0 && (
                    <div className="px-4 pb-4 text-xs text-gray-600 border-t border-gray-100 pt-3">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'host-info':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: font }}>
              {cfg.title || 'Your Host'}
            </h2>
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }}>
                H
              </div>
              <div>
                <p className="font-bold text-gray-900">{cfg.hostName || 'Your Host'}</p>
                <p className="text-sm text-gray-500 mt-1">Host since 2020 · Superhost</p>
                <p className="text-xs text-gray-600 mt-3 max-w-sm leading-relaxed">
                  {cfg.hostBio || 'We love welcoming guests and ensuring every stay is memorable. Reach out anytime!'}
                </p>
                {cfg.showContactButton && (
                  <button className="mt-4 px-5 py-2 text-white text-xs font-semibold" style={btnStyle}>
                    Contact Host
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )

    case 'house-rules':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: font }}>
              {cfg.title || 'House Rules'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {((cfg.rules as any[]) || [
                { icon: '🚫', text: 'No smoking' },
                { icon: '🎉', text: 'No parties or events' },
                { icon: '🌙', text: 'Quiet hours: 10 PM - 8 AM' },
                { icon: '🐾', text: 'No pets without approval' },
              ]).map((rule: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <span className="text-lg">{rule.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{rule.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'location':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: font }}>
              {cfg.title || 'Location'}
            </h2>
            {cfg.description && (
              <p className="text-sm text-gray-600 mb-4">{cfg.description}</p>
            )}
            <div className="h-44 rounded-2xl flex items-center justify-center bg-gray-100 border border-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20"
                style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 40px, ${primary}30 40px, ${primary}30 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, ${primary}30 40px, ${primary}30 41px)` }} />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: primary }}>
                  <MapPin size={14} className="text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm">
                  View on Map
                </p>
              </div>
            </div>
          </div>
        </div>
      )

    case 'nearby':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: font }}>
              {cfg.title || 'Nearby Attractions'}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {((cfg.items as any[]) || [
                { name: 'City Center', category: 'Culture', distance: '2 km' },
                { name: 'Main Beach', category: 'Nature', distance: '500 m' },
                { name: 'Local Market', category: 'Shopping', distance: '1 km' },
              ]).slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: `${primary}20` }}>
                    <MapPin size={16} style={{ color: primary }} />
                  </div>
                  <p className="text-xs font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: primary }}>{item.distance}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'special-offers':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8" style={{ background: `linear-gradient(135deg, ${primary}08 0%, ${accent}08 100%)` }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center" style={{ fontFamily: font }}>
              {cfg.title || 'Special Offers'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {((cfg.offers as any[]) || [
                { title: 'Early Bird Discount', description: 'Book 30+ days in advance', discount: '15%', validUntil: 'Dec 31' },
              ]).slice(0, 2).map((offer: any, i: number) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm border-l-4" style={{ borderColor: accent }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{offer.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{offer.description}</p>
                    </div>
                    <span className="text-xl font-black" style={{ color: accent }}>{offer.discount}</span>
                  </div>
                  {offer.validUntil && <p className="text-xs text-gray-400 mt-2">Valid until {offer.validUntil}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'cta':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-14 px-8 text-center"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`, fontFamily: font }}>
            <h2 className="text-2xl font-bold text-white mb-2">
              {cfg.title || 'Ready to Book?'}
            </h2>
            <p className="text-white/80 text-sm mb-6">
              {cfg.subtitle || 'Secure your dates now for the best rates'}
            </p>
            <button className="px-8 py-3 font-semibold text-sm shadow-lg"
              style={{ backgroundColor: accent, borderRadius: btnRadius(config.buttonStyle), color: '#fff' }}>
              {cfg.buttonText || 'Book Direct & Save'}
            </button>
          </div>
        </div>
      )

    case 'contact':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: font }}>
              {cfg.title || 'Get in Touch'}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">{cfg.subtitle || 'Have questions? We\'d love to hear from you.'}</p>
            <div className="max-w-sm mx-auto space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none" placeholder="Your name" />
              <input className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none" placeholder="Your email" />
              <textarea className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none" rows={3} placeholder="Your message" />
              <button className="w-full py-2.5 text-white text-sm font-semibold" style={btnStyle}>Send Message</button>
            </div>
            {(cfg.showPhone || cfg.showEmail) && (
              <div className="flex justify-center gap-6 mt-5">
                {cfg.showPhone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={12} style={{ color: primary }} /> +1 (555) 000-0000</div>}
                {cfg.showEmail && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail size={12} style={{ color: primary }} /> hello@property.com</div>}
              </div>
            )}
          </div>
        </div>
      )

    case 'video':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-12 px-8 bg-white text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: font }}>
              {cfg.title || 'Experience Our Property'}
            </h2>
            <div className="aspect-video rounded-2xl flex items-center justify-center bg-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30"
                style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }} />
              <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-all">
                <div className="w-0 h-0 border-l-[24px] border-l-white border-y-[14px] border-y-transparent ml-1" />
              </div>
            </div>
            {cfg.caption && <p className="text-xs text-gray-500 mt-3">{cfg.caption}</p>}
          </div>
        </div>
      )

    case 'footer':
      return (
        <div onClick={onClick} className={wrapper}>
          <div className="py-10 px-8 bg-gray-900 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm" style={{ color: accent }}>{config.brandName || 'My Property'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  © {new Date().getFullYear()} {cfg.copyright || 'All rights reserved'}
                </p>
              </div>
              <div className="flex gap-4">
                {((cfg.links as any[]) || []).map((link: any, i: number) => (
                  <span key={i} className="text-xs text-gray-400 hover:text-white cursor-pointer transition-colors">{link.label}</span>
                ))}
              </div>
              <div className="flex gap-3">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-all">
                    <Icon size={12} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div onClick={onClick} className={`${wrapper} bg-gray-50 border border-gray-200 p-6 text-center`}>
          <p className="text-sm text-gray-500">{SECTION_LABELS[section.sectionType] || section.sectionType}</p>
        </div>
      )
  }
}

export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  gallery: 'Photo Gallery',
  about: 'About Property',
  amenities: 'Amenities',
  location: 'Location & Map',
  'booking-widget': 'Booking Widget',
  reviews: 'Guest Reviews',
  faq: 'FAQ',
  'host-info': 'Host Information',
  'house-rules': 'House Rules',
  cta: 'Call to Action',
  contact: 'Contact Form',
  nearby: 'Nearby Attractions',
  'special-offers': 'Special Offers',
  video: 'Video Section',
  footer: 'Footer',
}

export const SECTION_ICONS: Record<string, string> = {
  hero: '🌟', gallery: '🖼️', about: '📖', amenities: '✨',
  location: '📍', 'booking-widget': '📅', reviews: '⭐', faq: '❓',
  'host-info': '👤', 'house-rules': '📋', cta: '🎯', contact: '✉️',
  nearby: '🗺️', 'special-offers': '🏷️', video: '🎬', footer: '🔗',
}
