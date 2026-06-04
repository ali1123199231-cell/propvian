import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { MapPin, BedDouble, Bath, Users, Loader2, Home, ArrowRight, Star } from 'lucide-react'

// ── SEO meta tag helper ───────────────────────────────────────────────────────

function updateMeta(title: string, description: string, ogImage: string | null, primary: string) {
  if (title) document.title = title
  const setMeta = (name: string, content: string, prop = false) => {
    const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`
    let el = document.querySelector(sel) as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      prop ? el.setAttribute('property', name) : el.setAttribute('name', name)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }
  if (description) setMeta('description', description)
  if (title) { setMeta('og:title', title, true); setMeta('twitter:title', title, true) }
  if (description) { setMeta('og:description', description, true); setMeta('twitter:description', description, true) }
  if (ogImage) { setMeta('og:image', ogImage, true); setMeta('twitter:image', ogImage, true) }
  setMeta('theme-color', primary)
}

function injectAnalytics(gaId: string | null, gtmId: string | null, pixelId: string | null, tiktokId: string | null) {
  if (gaId && !document.getElementById('ga-script')) {
    const s = document.createElement('script'); s.id = 'ga-script'; s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(s)
    const i = document.createElement('script')
    i.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`
    document.head.appendChild(i)
  }
  if (gtmId && !document.getElementById('gtm-script')) {
    const s = document.createElement('script'); s.id = 'gtm-script'
    s.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
    document.head.appendChild(s)
  }
  if (pixelId && !document.getElementById('meta-pixel')) {
    const s = document.createElement('script'); s.id = 'meta-pixel'
    s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`
    document.head.appendChild(s)
  }
  if (tiktokId && !document.getElementById('tiktok-pixel')) {
    const s = document.createElement('script'); s.id = 'tiktok-pixel'
    s.textContent = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._n=ttq._n||{};ttq._n[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokId}');ttq.page()}(window,document,'ttq');`
    document.head.appendChild(s)
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicPropertyCard {
  id: string
  slug: string
  name: string
  imageUrl: string
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

interface OrgSite {
  orgSlug: string
  orgName: string
  brandName: string
  gaTrackingId?: string
  gtmContainerId?: string
  metaPixelId?: string
  tiktokPixelId?: string
  ogImageUrl?: string
  brandLogoUrl: string
  primaryColor: string
  accentColor: string
  fontFamily: string
  themeStyle: string
  pageTitle: string
  metaDescription: string
  properties: PublicPropertyCard[]
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchOrgSite(orgSlug: string): Promise<OrgSite> {
  const r = await axios.get(`/api/public/sites/${orgSlug}`)
  return r.data.data
}

// ── Logo with broken-image fallback ──────────────────────────────────────────

function LogoImg({ src, alt, className, fallbackChar, primary }: {
  src: string; alt: string; className: string; fallbackChar: string; primary: string
}) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <div className={`flex items-center justify-center text-white font-bold rounded-lg ${className}`}
        style={{ backgroundColor: primary }}>
        {fallbackChar}
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />
}

// ── Property card ─────────────────────────────────────────────────────────────

function PropertyCard({ prop, primaryColor, onBook }: {
  prop: PublicPropertyCard
  primaryColor: string
  onBook: () => void
}) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col cursor-pointer group"
      onClick={onBook}
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-100 overflow-hidden flex-shrink-0">
        {prop.imageUrl ? (
          <img
            src={prop.imageUrl}
            alt={prop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Home size={40} className="text-gray-400" />
          </div>
        )}
        {prop.propertyType && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full">
            {prop.propertyType}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2">
            {prop.name}
          </h3>
          {(prop.city || prop.country) && (
            <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
              <MapPin size={13} className="flex-shrink-0" />
              <span className="truncate">{[prop.city, prop.country].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
            {prop.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble size={14} />
                {prop.bedrooms} bed{prop.bedrooms !== 1 ? 's' : ''}
              </span>
            )}
            {prop.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath size={14} />
                {prop.bathrooms} bath{prop.bathrooms !== 1 ? 's' : ''}
              </span>
            )}
            {prop.maxGuests != null && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {prop.maxGuests} guest{prop.maxGuests !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            {prop.baseNightlyRate ? (
              <>
                <span className="text-lg font-bold text-gray-900">
                  ${Number(prop.baseNightlyRate).toFixed(0)}
                </span>
                <span className="text-sm text-gray-500"> / night</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Contact for rates</span>
            )}
            {prop.minStayNights > 1 && (
              <p className="text-xs text-gray-400">{prop.minStayNights} night min</p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onBook() }}
            className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Book <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrgListingPage({ orgSlug, getPropertyUrl }: {
  orgSlug: string
  getPropertyUrl: (slug: string) => string
}) {
  const navigate = useNavigate()

  const { data: site, isLoading, error } = useQuery({
    queryKey: ['org-site', orgSlug],
    queryFn: () => fetchOrgSite(orgSlug),
    staleTime: 60_000,
  })

  // Auto-redirect when there's only one property
  useEffect(() => {
    if (site?.properties.length === 1) {
      navigate(getPropertyUrl(site.properties[0].slug), { replace: true })
    }
  }, [site])

  // SEO meta tags + analytics injection
  useEffect(() => {
    if (!site) return
    const primary = site.primaryColor || '#6366F1'
    const title = site.pageTitle || site.brandName || site.orgName
    updateMeta(title, site.metaDescription || '', site.ogImageUrl || null, primary)
    injectAnalytics(
      site.gaTrackingId || null,
      site.gtmContainerId || null,
      site.metaPixelId || null,
      site.tiktokPixelId || null,
    )
  }, [site])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-gray-400" />
    </div>
  )

  if (error || !site) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <div className="text-center">
        <Home size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Site not found</p>
      </div>
    </div>
  )

  // Show loading spinner during single-property redirect
  if (site.properties.length === 1) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-gray-400" />
    </div>
  )

  const primary = site.primaryColor || '#6366F1'
  const displayName = site.brandName || site.orgName
  const pageHeading = site.pageTitle || `Welcome to ${displayName}`

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: site.fontFamily || 'Inter' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {site.brandLogoUrl ? (
              <LogoImg src={site.brandLogoUrl} alt={displayName}
                className="h-8 w-auto object-contain"
                fallbackChar={displayName.charAt(0).toUpperCase()} primary={primary} />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: primary }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-gray-900 text-lg">{displayName}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span>Verified properties</span>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div
        className="relative py-16 px-4 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`,
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-6xl mx-auto text-center">
          <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-3">
            {site.orgName}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            {pageHeading}
          </h1>
          {site.metaDescription && (
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              {site.metaDescription}
            </p>
          )}
          {!site.metaDescription && (
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Browse our collection of hand-picked properties and book your perfect stay.
            </p>
          )}
        </div>
      </div>

      {/* ── Properties grid ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Our Properties</h2>
            <p className="text-gray-500 text-sm mt-1">
              {site.properties.length} propert{site.properties.length === 1 ? 'y' : 'ies'} available
            </p>
          </div>
        </div>

        {site.properties.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Home size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No properties available yet</p>
            <p className="text-sm mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {site.properties.map(prop => (
              <PropertyCard
                key={prop.id}
                prop={prop}
                primaryColor={primary}
                onBook={() => navigate(getPropertyUrl(prop.slug))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {site.brandLogoUrl ? (
              <LogoImg src={site.brandLogoUrl} alt={displayName}
                className="h-5 w-auto object-contain"
                fallbackChar={displayName.charAt(0).toUpperCase()} primary={primary} />
            ) : (
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: primary }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium text-gray-700">{displayName}</span>
          </div>
          <span>Powered by <span className="font-semibold text-gray-700">Propvian</span></span>
        </div>
      </footer>
    </div>
  )
}
