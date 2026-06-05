import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Loader2, Home, Star } from 'lucide-react'
import { PublicSiteRenderer } from './PublicSiteRenderer'
import type { PublicSection, PublicPropertyCard, PublicSiteConfig } from './PublicSiteRenderer'

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

interface OrgSite {
  orgSlug: string
  orgName: string
  brandName: string
  brandLogoUrl?: string
  primaryColor: string
  accentColor: string
  fontFamily: string
  buttonStyle: string
  themeStyle: string
  pageTitle?: string
  metaDescription?: string
  ogImageUrl?: string
  gaTrackingId?: string
  gtmContainerId?: string
  metaPixelId?: string
  tiktokPixelId?: string
  sections: PublicSection[]
  properties: PublicPropertyCard[]
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchOrgSite(orgSlug: string): Promise<OrgSite> {
  const r = await axios.get(`/api/public/sites/${orgSlug}`)
  return r.data.data
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function LogoImg({ src, alt, className, fallbackChar, primary }: {
  src: string; alt: string; className: string; fallbackChar: string; primary: string
}) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <div className={`flex items-center justify-center text-white font-bold rounded-lg ${className}`} style={{ backgroundColor: primary }}>
        {fallbackChar}
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />
}

function SiteNavbar({ site }: { site: OrgSite }) {
  const primary = site.primaryColor || '#6366F1'
  const displayName = site.brandName || site.orgName
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {site.brandLogoUrl ? (
            <LogoImg src={site.brandLogoUrl} alt={displayName}
              className="h-9 w-auto object-contain max-w-[160px]"
              fallbackChar={displayName.charAt(0).toUpperCase()} primary={primary} />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ backgroundColor: primary }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-gray-900 text-lg">{displayName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          <span className="hidden sm:inline">Verified properties</span>
        </div>
      </div>
    </nav>
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
    retry: false,
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

  // Show spinner during single-property redirect
  if (site.properties.length === 1) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-gray-400" />
    </div>
  )

  const siteConfig: PublicSiteConfig = {
    brandName: site.brandName || site.orgName,
    brandLogoUrl: site.brandLogoUrl,
    primaryColor: site.primaryColor || '#6366F1',
    accentColor: site.accentColor || '#F59E0B',
    fontFamily: site.fontFamily || 'Inter',
    buttonStyle: site.buttonStyle || 'rounded',
  }

  return (
    <div style={{ fontFamily: siteConfig.fontFamily }}>
      <SiteNavbar site={site} />
      <PublicSiteRenderer
        sections={site.sections || []}
        config={siteConfig}
        properties={site.properties}
        getPropertyUrl={getPropertyUrl}
      />
    </div>
  )
}
