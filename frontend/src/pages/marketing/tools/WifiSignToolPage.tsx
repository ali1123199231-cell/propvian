import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Printer, Download, Lock, RefreshCw, Smartphone, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SEOHead } from '@/components/seo/SEOHead'
import { Sign, CARD_SIZES, signWidthMm, type SignVariant, type CardSize } from '@/components/guestpage/PrintableSign'
import { downloadQrSvg } from '@/components/guestpage/QrCode'
import { wifiQrPayload } from '@/lib/wifiQr'
import { localizedPath } from '@/lib/i18n/config'
import { currentLanguage } from '@/lib/i18n'
import type { WifiSecurity } from '@/types/guestPage'

const PAGE_PATH = '/tools/wifi-qr-code-sign'
const FAQ_KEYS = ['iphone', 'stored', 'change', 'nfc', 'paper'] as const
const SECURITIES: WifiSecurity[] = ['WPA', 'WEP', 'nopass']
const VARIANTS: SignVariant[] = ['card', 'tent', 'poster']

/*
 * Free, no-signup WiFi sign maker. Everything is generated client-side; the
 * password never reaches our servers, which is both the privacy promise on the
 * page and the reason there is no API behind it.
 */
export function WifiSignToolPage() {
  const { t } = useTranslation('guestpage')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [security, setSecurity] = useState<WifiSecurity>('WPA')
  const [hidden, setHidden] = useState(false)
  const [showPw, setShowPw] = useState(true)
  const [title, setTitle] = useState('')
  const [variant, setVariant] = useState<SignVariant>('card')
  const [size, setSize] = useState<CardSize>('a6')
  const [showText, setShowText] = useState(true)

  const faq = FAQ_KEYS.map((k) => ({ q: t(`tool.faq.${k}.q`), a: t(`tool.faq.${k}.a`) }))
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t('tool.schemaName'),
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: `https://propvian.com${localizedPath(PAGE_PATH, currentLanguage())}`,
      description: t('tool.schemaDescription'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]

  const ready = ssid.length > 0 && (security === 'nopass' || password.length > 0)
  const wifi = { ssid: ssid || t('tool.yourNetwork'), password: password || '••••••••', security, hidden }
  const content = {
    title: title || t('sign.welcome'),
    kicker: t('sign.freeWifi'),
    wifi,
    showWifiText: showText,
    footer: t('sign.toolFooter'),
  }
  const previewScale = Math.min(1, 330 / (signWidthMm(variant, size) * 3.78))

  return (
    <>
      <SEOHead
        title={t('tool.seoTitle')}
        description={t('tool.seoDescription')}
        canonical={PAGE_PATH}
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-600">{t('tool.kicker')}</p>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">{t('tool.h1')}</h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">{t('tool.lead')}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-500"><Lock size={14} /> {t('tool.privacy')}</p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="card space-y-4 p-5">
              <h2 className="font-semibold text-gray-900">{t('tool.step1')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{t('editor.wifi.network')}</span>
                  <input className="input-base" value={ssid} maxLength={32} autoComplete="off" spellCheck={false}
                         onChange={(e) => setSsid(e.target.value)} placeholder={t('tool.networkPlaceholder')} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{t('editor.wifi.password')}</span>
                  <div className="relative">
                    <input className="input-base pr-10 font-mono" type="text" maxLength={63}
                           style={showPw ? undefined : ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)}
                           autoComplete="off" data-1p-ignore data-lpignore="true" spellCheck={false} disabled={security === 'nopass'}
                           value={security === 'nopass' ? '' : password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t('editor.wifi.hidePassword') : t('editor.wifi.showPassword')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{t('editor.wifi.security')}</span>
                  <select className="input-base" value={security} onChange={(e) => setSecurity(e.target.value as WifiSecurity)}>
                    {SECURITIES.map((v) => <option key={v} value={v}>{t(`editor.wifi.securities.${v}`)}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-gray-700">
                  <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> {t('tool.hidden')}
                </label>
              </div>
            </div>

            <div className="card space-y-4 p-5">
              <h2 className="font-semibold text-gray-900">{t('tool.step2')}</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {VARIANTS.map((id) => (
                  <button key={id} type="button" onClick={() => setVariant(id)}
                          className={clsx('rounded-xl border p-3 text-left', variant === id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                    <p className="text-sm font-semibold text-gray-900">{t(`print.variants.${id}.label`)}</p>
                    <p className="text-xs text-gray-500">{t(`tool.variantNotes.${id}`)}</p>
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{t('print.sign.titleField')}</span>
                  <input className="input-base" value={title} maxLength={40} placeholder={t('sign.welcome')} onChange={(e) => setTitle(e.target.value)} />
                </label>
                {variant === 'card' && (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">{t('print.sign.cardSize')}</span>
                    <select className="input-base" value={size} onChange={(e) => setSize(e.target.value as CardSize)}>
                      {(Object.keys(CARD_SIZES) as CardSize[]).map((k) => <option key={k} value={k}>{t(`print.sizes.${k}`)}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
                {t('tool.alsoText')}
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" disabled={!ready} onClick={() => window.print()}>
                <Printer size={16} /> {t('print.sign.print')}
              </button>
              <button type="button" className="btn-secondary" disabled={!ready}
                      onClick={() => downloadQrSvg(wifiQrPayload({ ssid, password, security, hidden }), 'wifi-qr-code.svg')}>
                <Download size={16} /> {t('tool.qrOnly')}
              </button>
            </div>
            {!ready && <p className="text-sm text-gray-500">{security !== 'nopass' ? t('tool.needBoth') : t('tool.needName')}</p>}
          </div>

          <div>
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">{t('tool.preview')}</p>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary-600">{t('tool.hostsKicker')}</p>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">{t('tool.hostsTitle')}</h2>
              <p className="mb-5 text-gray-600">{t('tool.hostsBody')}</p>
              <Link to="/?utm_source=tool&utm_medium=organic&utm_campaign=wifi-sign" className="btn-primary">{t('tool.hostsCta')}</Link>
            </div>
            <ul className="space-y-3">
              {([
                [RefreshCw, t('tool.benefits.update')],
                [Smartphone, t('tool.benefits.nfc')],
                [CheckCircle2, t('tool.benefits.guide')],
                [Eye, t('tool.benefits.stats')],
              ] as const).map(([Icon, text], i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700"><Icon size={18} className="shrink-0 text-primary-600" /> {text}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">{t('tool.questions')}</h2>
          <div className="divide-y divide-gray-200">
            {faq.map((f) => (
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
