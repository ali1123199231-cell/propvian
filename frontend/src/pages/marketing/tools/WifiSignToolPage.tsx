import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Printer, Download, Lock, RefreshCw, Smartphone, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { Sign, CARD_SIZES, signWidthMm, type SignVariant, type CardSize } from '@/components/guestpage/PrintableSign'
import { downloadQrSvg } from '@/components/guestpage/QrCode'
import { wifiQrPayload, SECURITY_LABELS } from '@/lib/wifiQr'
import type { WifiSecurity } from '@/types/guestPage'

const PAGE_URL = 'https://propvian.com/tools/wifi-qr-code-sign'

const FAQ = [
  {
    q: 'Can guests with an iPhone scan it?',
    a: 'Yes. The iPhone camera has recognised WiFi QR codes since iOS 11: guests point the camera at the sign and tap "Join network". Android 10 and later does the same from the camera or Google Lens.',
  },
  {
    q: 'Is my WiFi password stored anywhere?',
    a: 'No. The sign is drawn in your browser and the password never leaves your device. Nothing you type on this page is sent to Propvian.',
  },
  {
    q: 'What happens when I change the WiFi password?',
    a: 'The QR code contains the password itself, so print a new sign. If you change it often, a free Propvian guest page puts a link on the sign instead: you update the password online and the printed sign keeps working.',
  },
  {
    q: 'Can I use an NFC tag instead of a QR code?',
    a: 'Android phones can join WiFi from an NFC tag, but iPhones can\'t: they only open links from tags. A tag that opens a guest page works on both, which is how Propvian stands are set up.',
  },
  {
    q: 'What should I print it on?',
    a: 'The card size fits the A6 and 4 × 6 inch acrylic sign holders sold for rentals. Thick card or a laminated sheet lasts longest. Print at 100% scale so the code stays sharp.',
  },
]

const schema = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'WiFi QR Code Sign Maker',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: PAGE_URL,
    description: 'Free printable WiFi QR code sign for Airbnb and vacation rentals. Guests scan to join, no password typing.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
]

/*
 * Free, no-signup WiFi sign maker. Everything is generated client-side; the
 * password never reaches our servers, which is both the privacy promise on the
 * page and the reason there is no API behind it.
 */
export function WifiSignToolPage() {
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [security, setSecurity] = useState<WifiSecurity>('WPA')
  const [hidden, setHidden] = useState(false)
  const [showPw, setShowPw] = useState(true)
  const [title, setTitle] = useState('Welcome')
  const [variant, setVariant] = useState<SignVariant>('card')
  const [size, setSize] = useState<CardSize>('a6')
  const [showText, setShowText] = useState(true)

  const ready = ssid.length > 0 && (security === 'nopass' || password.length > 0)
  const wifi = { ssid: ssid || 'Your network', password: password || '••••••••', security, hidden }
  const content = {
    title: title || 'Welcome',
    kicker: 'Free WiFi',
    wifi,
    showWifiText: showText,
    footer: 'Made free at propvian.com/tools',
  }
  const previewScale = Math.min(1, 330 / (signWidthMm(variant, size) * 3.78))

  return (
    <>
      <SEOHead
        title="Free WiFi QR Code Sign Maker for Airbnb & Rentals"
        description="Make a printable WiFi QR code sign in seconds. Guests scan it with their camera and join, with no password typing. Free, no sign-up, and your password never leaves your browser."
        canonical="/tools/wifi-qr-code-sign"
        schema={schema}
      />
      <style>{`
        @page { margin: 10mm; }
        @media print {
          /* display:none, not visibility:hidden: hidden sections still take up
             space and would print as trailing blank pages */
          #wifi-tool-root > *:not(#wifi-sign-print) { display: none !important; }
          #wifi-tool-root { min-height: 0 !important; }
          html, body { background: #fff !important; }
          #wifi-sign-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div id="wifi-tool-root" className="flex min-h-screen flex-col bg-white">
        <MarketingNav />

        <section className="bg-gradient-to-b from-gray-50 to-white px-4 pb-10 pt-14 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-600">Free tool · no sign-up</p>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">WiFi QR code sign maker</h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Print a sign your guests scan to join the WiFi. No typing, no "what's the password?" messages.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-500"><Lock size={14} /> Made in your browser. Your password is never sent anywhere.</p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="card space-y-4 p-5">
              <h2 className="font-semibold text-gray-900">1. Your WiFi</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Network name</span>
                  <input className="input-base" value={ssid} maxLength={32} autoComplete="off" spellCheck={false}
                         onChange={(e) => setSsid(e.target.value)} placeholder="Exactly as it appears on phones" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Password</span>
                  <div className="relative">
                    <input className="input-base pr-10 font-mono" type="text" maxLength={63}
                           style={showPw ? undefined : ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)}
                           autoComplete="off" data-1p-ignore data-lpignore="true" spellCheck={false} disabled={security === 'nopass'}
                           value={security === 'nopass' ? '' : password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Security</span>
                  <select className="input-base" value={security} onChange={(e) => setSecurity(e.target.value as WifiSecurity)}>
                    {Object.entries(SECURITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-gray-700">
                  <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Hidden network
                </label>
              </div>
            </div>

            <div className="card space-y-4 p-5">
              <h2 className="font-semibold text-gray-900">2. Your sign</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {([['card', 'Stand card', 'A6 / 4×6 in holders'], ['tent', 'Table tent', 'Fold in half'], ['poster', 'Poster', 'A4 or Letter']] as const).map(([id, l, n]) => (
                  <button key={id} type="button" onClick={() => setVariant(id)}
                          className={clsx('rounded-xl border p-3 text-left', variant === id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                    <p className="text-sm font-semibold text-gray-900">{l}</p><p className="text-xs text-gray-500">{n}</p>
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Title</span>
                  <input className="input-base" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
                </label>
                {variant === 'card' && (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">Card size</span>
                    <select className="input-base" value={size} onChange={(e) => setSize(e.target.value as CardSize)}>
                      {Object.entries(CARD_SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
                Also print the network name and password as text
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" disabled={!ready} onClick={() => window.print()}>
                <Printer size={16} /> Print or save as PDF
              </button>
              <button type="button" className="btn-secondary" disabled={!ready}
                      onClick={() => downloadQrSvg(wifiQrPayload({ ssid, password, security, hidden }), 'wifi-qr-code.svg')}>
                <Download size={16} /> Just the QR code (SVG)
              </button>
            </div>
            {!ready && <p className="text-sm text-gray-500">Enter your network name{security !== 'nopass' ? ' and password' : ''} to print.</p>}
          </div>

          <div>
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">Preview</p>
            <div className="flex justify-center rounded-2xl bg-gray-100 p-5">
              <div style={{ zoom: previewScale }} className="shadow-md"><Sign variant={variant} size={size} c={content} /></div>
            </div>
          </div>
        </section>

        {/* Printed copy at true size; only this reaches the printer */}
        {ready && (
          <div id="wifi-sign-print" className="hidden print:block">
            <Sign variant={variant} size={size} c={{ ...content, wifi: { ssid, password, security, hidden } }} />
          </div>
        )}

        <section className="border-y border-gray-100 bg-gray-50 px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-600">For rental hosts</p>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">A sign that never goes out of date</h2>
              <p className="mb-5 text-gray-600">
                Put a Propvian guest page behind your sign. Guests tap or scan and get the WiFi with a copy button,
                your house guide, check-out steps and how to reach you. Change anything online, and the printed sign
                keeps working.
              </p>
              <Link to="/?utm_source=tool&utm_medium=organic&utm_campaign=wifi-sign" className="btn-primary">Create a free guest page</Link>
            </div>
            <ul className="space-y-3">
              {[
                [RefreshCw, 'Update the WiFi password without reprinting'],
                [Smartphone, 'Works with an NFC tag on iPhone and Android'],
                [CheckCircle2, 'House rules, check-out checklist and local tips in one place'],
                [Eye, 'See how many guests open it, and from which sign'],
              ].map(([Icon, text], i) => {
                const I = Icon as typeof Lock
                return <li key={i} className="flex items-center gap-3 text-gray-700"><I size={18} className="shrink-0 text-primary-600" /> {text as string}</li>
              })}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Questions</h2>
          <div className="divide-y divide-gray-200">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium text-gray-900">{f.q}</summary>
                <p className="mt-2 text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  )
}
