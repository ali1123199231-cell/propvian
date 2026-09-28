import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Wifi, Copy, Check, LogIn, LogOut, ScrollText, MapPin, WashingMachine, Car,
  Siren, Info, Phone, MessageCircle, Mail, CalendarHeart, Tag, ChevronDown, QrCode as QrIcon,
} from 'lucide-react'
import clsx from 'clsx'
import type { PublicGuestPage, GuestSectionType, GuestPageEventType } from '@/types/guestPage'
import { ruleText, RULE_ICONS } from '@/lib/houseRules'
import { wifiQrPayload } from '@/lib/wifiQr'
import { copyText } from '@/lib/clipboard'
import { QrCode } from './QrCode'

const SECTION_ICONS: Record<GuestSectionType, typeof Wifi> = {
  CHECKIN: LogIn,
  CHECKOUT: LogOut,
  HOUSE_RULES: ScrollText,
  LOCAL_TIPS: MapPin,
  APPLIANCES: WashingMachine,
  PARKING: Car,
  EMERGENCY: Siren,
  CUSTOM: Info,
}

/** White or near-black text, whichever reads better on the host's brand colour. */
export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return '#ffffff'
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => {
    const c = parseInt(h, 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#111827' : '#ffffff'
}

/** Plain text with bare http(s) links made clickable. Everything else stays escaped text. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g)
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p)
          ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline break-all">{p.replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}</a>
          : <span key={i}>{p}</span>,
      )}
    </>
  )
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx('bg-white rounded-2xl shadow-sm border border-gray-100 p-5', className)}>{children}</section>
}

function CopyButton({ value, label, onCopied, accent, big }: {
  value: string; label: string; onCopied?: () => void; accent: string; big?: boolean
}) {
  const { t } = useTranslation('guestpage')
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    if (await copyText(value)) {
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    }
  }
  return (
    <button
      type="button"
      onClick={handle}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-transform active:scale-[0.98]',
        big ? 'w-full py-3.5 text-base' : 'px-3 py-1.5 text-sm',
      )}
      style={big ? { backgroundColor: accent, color: readableOn(accent) } : { color: accent }}
      aria-live="polite"
    >
      {copied ? <Check size={big ? 18 : 15} /> : <Copy size={big ? 18 : 15} />}
      {copied ? t('view.copied') : label}
    </button>
  )
}

interface GuestPageViewProps {
  page: PublicGuestPage
  /** Absent in the editor preview, so previews never count as guest activity */
  onEvent?: (type: GuestPageEventType) => void
  poweredByHref?: string
}

export function GuestPageView({ page, onEvent, poweredByHref }: GuestPageViewProps) {
  const { t } = useTranslation('guestpage')
  const { t: tGuest } = useTranslation('guest')
  const accent = page.brandColor || '#4f46e5'
  const onAccent = readableOn(accent)
  const [showWifiQr, setShowWifiQr] = useState(false)
  const sections = page.sections ?? []
  const wifi = page.wifi

  return (
    <div className="min-h-full bg-gray-50 pb-10">
      {/* Header */}
      <header className="relative">
        {page.heroImageUrl ? (
          <div className="h-48 w-full overflow-hidden">
            <img src={page.heroImageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-32 w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }} />
        )}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: page.heroImageUrl ? 'rgba(255,255,255,.85)' : onAccent, opacity: page.heroImageUrl ? 1 : 0.85 }}>
            {t('view.guideLabel')}{page.city ? ` · ${page.city}` : ''}
          </p>
          <h1 className="text-2xl font-bold leading-tight"
              style={{ color: page.heroImageUrl ? '#fff' : onAccent }}>
            {page.propertyName}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {page.welcomeMessage && (
          <p className="whitespace-pre-line px-1 text-[15px] leading-relaxed text-gray-700">
            <Linkified text={page.welcomeMessage} />
          </p>
        )}

        {/* WiFi first: it is what nearly every guest opened the page for */}
        {wifi && (
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}1a`, color: accent }}>
                <Wifi size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('view.wifiNetwork')}</p>
                <p className="truncate text-lg font-semibold text-gray-900">{wifi.ssid}</p>
              </div>
            </div>
            {wifi.password ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('view.password')}</p>
                <p className="mb-4 break-all font-mono text-xl font-semibold tracking-wide text-gray-900">{wifi.password}</p>
                <CopyButton big value={wifi.password} label={t('view.copyPassword')} accent={accent} onCopied={() => onEvent?.('WIFI_COPY')} />
                <p className="mt-3 text-center text-xs text-gray-500">
                  {t('view.pasteHint', { ssid: wifi.ssid })}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">{t('view.noPassword')}</p>
            )}
            <button
              type="button"
              onClick={() => setShowWifiQr((v) => !v)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-gray-500"
              aria-expanded={showWifiQr}
            >
              <QrIcon size={15} /> {t('view.connectAnother')}
              <ChevronDown size={15} className={clsx('transition-transform', showWifiQr && 'rotate-180')} />
            </button>
            {showWifiQr && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <QrCode value={wifiQrPayload(wifi)} size={168} label={t('view.joinLabel', { ssid: wifi.ssid })} />
                </div>
                <p className="text-center text-xs text-gray-500">{t('view.otherPhoneHint')}</p>
              </div>
            )}
          </Card>
        )}

        {(page.checkInTime || page.checkOutTime) && (
          <div className="grid grid-cols-2 gap-3">
            {page.checkInTime && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('view.checkIn')}</p>
                <p className="text-lg font-semibold text-gray-900">{t('view.fromTime', { time: page.checkInTime })}</p>
              </div>
            )}
            {page.checkOutTime && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('view.checkOut')}</p>
                <p className="text-lg font-semibold text-gray-900">{t('view.byTime', { time: page.checkOutTime })}</p>
              </div>
            )}
          </div>
        )}

        {sections.map((s, i) => {
          const Icon = SECTION_ICONS[s.type] ?? Info
          const rules = s.type === 'HOUSE_RULES' ? page.houseRules ?? [] : []
          if (s.type === 'HOUSE_RULES' && !rules.length && !s.body) return null
          return (
            <Card key={s.id ?? i}>
              <h2 className="mb-2 flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <Icon size={18} style={{ color: accent }} /> {s.title}
              </h2>
              {rules.length > 0 && (
                <ul className="mb-2 space-y-1.5">
                  {rules.map((r) => (
                    <li key={r.key} className="flex items-start gap-2 text-[15px] text-gray-700">
                      <span aria-hidden>{RULE_ICONS[r.key] ?? '•'}</span>
                      <span>{ruleText(r.key, r.allowed, r.notes ?? undefined, tGuest)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.body && (
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
                  <Linkified text={s.body} />
                </p>
              )}
            </Card>
          )
        })}

        {page.contact && (
          <Card>
            <h2 className="mb-1 text-base font-semibold text-gray-900">{t('view.needAnything')}</h2>
            <p className="mb-4 text-sm text-gray-500">{page.contact.name ? t('view.hostHelps', { name: page.contact.name }) : t('view.hostHelpsDefault')}</p>
            <div className="grid gap-2">
              {page.contact.phone && (
                <a href={`tel:${page.contact.phone.replace(/[^+\d]/g, '')}`} onClick={() => onEvent?.('CONTACT_CLICK')}
                   className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 font-medium text-gray-800">
                  <Phone size={17} /> {t('view.call', { phone: page.contact.phone })}
                </a>
              )}
              {page.contact.phone && page.contact.whatsapp && (
                <a href={`https://wa.me/${page.contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                   onClick={() => onEvent?.('CONTACT_CLICK')}
                   className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 font-medium text-gray-800">
                  <MessageCircle size={17} /> WhatsApp
                </a>
              )}
              {page.contact.email && (
                <a href={`mailto:${page.contact.email}`} onClick={() => onEvent?.('CONTACT_CLICK')}
                   className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 font-medium text-gray-800">
                  <Mail size={17} /> {t('view.email')}
                </a>
              )}
            </div>
          </Card>
        )}

        {page.bookDirect && (
          <section className="rounded-2xl p-5 shadow-sm" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}d9)`, color: onAccent }}>
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
              <CalendarHeart size={18} /> {t('view.comeBack')}
            </h2>
            <p className="mb-4 text-[15px] opacity-90">{page.bookDirect.message || t('view.bookDirectDefault')}</p>
            {page.bookDirect.promoCode && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-white/15 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide opacity-80">
                    <Tag size={12} className="-mt-0.5 mr-1 inline" />{t('view.code')}{page.bookDirect.discountLabel ? ` · ${page.bookDirect.discountLabel}` : ''}
                  </p>
                  <p className="font-mono text-lg font-bold tracking-wider">{page.bookDirect.promoCode}</p>
                </div>
                <CopyButton value={page.bookDirect.promoCode} label={t('view.copy')} accent={onAccent} />
              </div>
            )}
            <a
              href={withPromo(page.bookDirect.url, page.bookDirect.promoCode, page.code)}
              target="_blank" rel="noopener noreferrer"
              onClick={() => onEvent?.('BOOK_DIRECT_CLICK')}
              className="flex w-full items-center justify-center rounded-xl bg-white py-3.5 font-semibold"
              style={{ color: accent }}
            >
              {t('view.seeDates')}
            </a>
          </section>
        )}

        <footer className="pt-4 text-center text-xs text-gray-400">
          {page.showPoweredBy && poweredByHref && (
            <p className="mb-1">
              <a href={poweredByHref} target="_blank" rel="noopener" onClick={() => onEvent?.('POWERED_BY_CLICK')}
                 className="hover:text-gray-500">
                {t('view.poweredByPrefix')} <span className="font-semibold text-gray-500">Propvian</span> · {t('view.poweredByCta')}
              </a>
            </p>
          )}
          <a href="https://propvian.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500">{t('view.privacy')}</a>
        </footer>
      </main>
    </div>
  )
}

/** Carries the promo code and the source into the booking page's own attribution. */
function withPromo(url: string, promo: string | undefined, code: string): string {
  try {
    const u = new URL(url)
    if (promo) u.searchParams.set('promo', promo)
    u.searchParams.set('utm_source', 'guestpage')
    u.searchParams.set('utm_medium', 'stay')
    u.searchParams.set('utm_content', code)
    return u.toString()
  } catch {
    return url
  }
}
