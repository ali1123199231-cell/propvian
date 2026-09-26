import { Wifi, Nfc, ScanLine } from 'lucide-react'
import type { WifiSecurity } from '@/types/guestPage'
import { wifiQrPayload } from '@/lib/wifiQr'
import { QrCode } from './QrCode'

export type SignVariant = 'card' | 'tent' | 'poster'
export type CardSize = 'a6' | '4x6'

/*
 * Physical sizes, not screen sizes: the card matches the A6 and 4×6-inch
 * acrylic holders sold for rentals, the poster fits inside A4 and US Letter
 * printable areas, and the tent is two faces on one A4 sheet folded in half.
 */
export const CARD_SIZES: Record<CardSize, { w: number; h: number; label: string }> = {
  a6: { w: 105, h: 148, label: 'A6 (105 × 148 mm)' },
  '4x6': { w: 101.6, h: 152.4, label: '4 × 6 in' },
}

export interface SignContent {
  title: string
  kicker?: string
  guideUrl?: string          // the guest page's QR link; absent on a WiFi-only sign
  wifi?: { ssid: string; password?: string | null; security: WifiSecurity; hidden?: boolean } | null
  showWifiText?: boolean     // print network name and password as text too
  showNfcHint?: boolean      // only when a tag will actually sit under the card
  accent?: string
  footer?: string
}

const mm = (n: number) => `${n}mm`

function CallToAction({ c, compact }: { c: SignContent; compact?: boolean }) {
  const Icon = c.showNfcHint ? Nfc : ScanLine
  const text = c.guideUrl
    ? (c.showNfcHint ? 'Tap your phone here or scan the code' : 'Scan with your phone camera')
    : 'Scan with your phone camera to join'
  return (
    <p className="flex items-center justify-center gap-[1.5mm] font-semibold text-gray-900" style={{ fontSize: compact ? '9pt' : '10.5pt' }}>
      <Icon style={{ width: mm(4.5), height: mm(4.5) }} /> {text}
    </p>
  )
}

function WifiText({ c, size = '9.5pt' }: { c: SignContent; size?: string }) {
  if (!c.wifi) return null
  return (
    <div className="leading-snug" style={{ fontSize: size }}>
      <p className="text-gray-500" style={{ fontSize: '7.5pt', letterSpacing: '0.08em' }}>WIFI NETWORK</p>
      <p className="font-semibold text-gray-900 break-all">{c.wifi.ssid}</p>
      {c.wifi.security !== 'nopass' && c.wifi.password && (
        <>
          <p className="mt-[1mm] text-gray-500" style={{ fontSize: '7.5pt', letterSpacing: '0.08em' }}>PASSWORD</p>
          <p className="font-mono font-semibold text-gray-900 break-all">{c.wifi.password}</p>
        </>
      )}
    </div>
  )
}

/** The portrait card for A6 / 4×6 holders. */
export function SignCard({ c, size = 'a6' }: { c: SignContent; size?: CardSize }) {
  const { w, h } = CARD_SIZES[size]
  const accent = c.accent || '#4f46e5'
  const mainQr = c.guideUrl ?? (c.wifi ? wifiQrPayload(c.wifi) : '')
  const secondaryWifiQr = !!c.guideUrl && !!c.wifi
  return (
    <div className="relative flex flex-col bg-white text-center" style={{ width: mm(w), height: mm(h), padding: mm(8) }}>
      <p className="font-semibold uppercase" style={{ color: accent, fontSize: '8pt', letterSpacing: '0.14em' }}>
        {c.kicker ?? (c.guideUrl ? 'Welcome to' : 'Free WiFi')}
      </p>
      <h2 className="font-bold leading-tight text-gray-900" style={{ fontSize: c.title.length > 22 ? '15pt' : '19pt' }}>{c.title}</h2>

      <div className="mx-auto mt-[4mm] rounded-[3mm] border border-gray-200 bg-white" style={{ padding: mm(3) }}>
        {mainQr && <QrCode value={mainQr} size={mm(secondaryWifiQr ? 46 : 54)} ecc="Q" />}
      </div>
      <div className="mt-[3mm]"><CallToAction c={c} /></div>
      {c.guideUrl && (
        <p className="mt-[1mm] text-gray-500" style={{ fontSize: '8.5pt' }}>WiFi, house guide, check-out &amp; local tips</p>
      )}

      <div className="mt-auto">
        {secondaryWifiQr ? (
          <div className="flex items-center gap-[3mm] border-t border-gray-200 pt-[3mm] text-left">
            <div className="shrink-0 rounded-[2mm] border border-gray-200" style={{ padding: mm(1.5) }}>
              <QrCode value={wifiQrPayload(c.wifi!)} size={mm(20)} ecc="M" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-[1mm] font-semibold text-gray-900" style={{ fontSize: '8.5pt' }}>
                <Wifi style={{ width: mm(3.5), height: mm(3.5) }} /> Scan to join WiFi
              </p>
              {c.showWifiText && <WifiText c={c} size="8.5pt" />}
            </div>
          </div>
        ) : (
          c.showWifiText && <div className="border-t border-gray-200 pt-[3mm]"><WifiText c={c} /></div>
        )}
        {c.footer && <p className="mt-[2.5mm] text-gray-400" style={{ fontSize: '6.5pt' }}>{c.footer}</p>}
      </div>
    </div>
  )
}

/** One landscape face of the folded table tent. */
function TentFace({ c }: { c: SignContent }) {
  const accent = c.accent || '#4f46e5'
  const mainQr = c.guideUrl ?? (c.wifi ? wifiQrPayload(c.wifi) : '')
  return (
    <div className="flex items-center gap-[7mm] bg-white" style={{ width: mm(180), height: mm(118), padding: mm(9) }}>
      <div className="shrink-0 rounded-[3mm] border border-gray-200" style={{ padding: mm(3) }}>
        {mainQr && <QrCode value={mainQr} size={mm(62)} ecc="Q" />}
      </div>
      <div className="min-w-0 text-left">
        <p className="font-semibold uppercase" style={{ color: accent, fontSize: '8.5pt', letterSpacing: '0.14em' }}>
          {c.kicker ?? (c.guideUrl ? 'Welcome to' : 'Free WiFi')}
        </p>
        <h2 className="mb-[3mm] font-bold leading-tight text-gray-900" style={{ fontSize: '18pt' }}>{c.title}</h2>
        <div className="mb-[3mm] text-left"><CallToAction c={c} compact /></div>
        {c.showWifiText && <WifiText c={c} />}
        {c.footer && <p className="mt-[3mm] text-gray-400" style={{ fontSize: '6.5pt' }}>{c.footer}</p>}
      </div>
    </div>
  )
}

/** A4 sheet: the top face is upside down so both sides read correctly once folded. */
export function SignTent({ c }: { c: SignContent }) {
  return (
    <div className="flex flex-col items-center bg-white" style={{ width: mm(180) }}>
      <div style={{ transform: 'rotate(180deg)' }}><TentFace c={c} /></div>
      <div className="relative w-full border-t border-dashed border-gray-300" aria-hidden>
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-[2mm] text-gray-400" style={{ fontSize: '6.5pt' }}>fold</span>
      </div>
      <TentFace c={c} />
    </div>
  )
}

/** Wall or fridge poster: fits inside the printable area of both A4 and US Letter. */
export function SignPoster({ c }: { c: SignContent }) {
  const accent = c.accent || '#4f46e5'
  return (
    <div className="flex flex-col bg-white text-center" style={{ width: mm(180), height: mm(250), padding: mm(14) }}>
      <p className="font-semibold uppercase" style={{ color: accent, fontSize: '11pt', letterSpacing: '0.16em' }}>
        {c.kicker ?? (c.guideUrl ? 'Welcome to' : 'Free WiFi')}
      </p>
      <h2 className="mb-[8mm] font-bold leading-tight text-gray-900" style={{ fontSize: '30pt' }}>{c.title}</h2>

      <div className={c.guideUrl && c.wifi ? 'grid grid-cols-2 gap-[10mm]' : 'flex justify-center'}>
        {c.wifi && (
          <div className="flex flex-col items-center">
            <div className="rounded-[3mm] border border-gray-200" style={{ padding: mm(4) }}>
              <QrCode value={wifiQrPayload(c.wifi)} size={mm(c.guideUrl ? 58 : 90)} ecc="Q" />
            </div>
            <p className="mt-[3mm] flex items-center gap-[1.5mm] font-semibold text-gray-900" style={{ fontSize: '13pt' }}>
              <Wifi style={{ width: mm(5), height: mm(5) }} /> Scan to join WiFi
            </p>
          </div>
        )}
        {c.guideUrl && (
          <div className="flex flex-col items-center">
            <div className="rounded-[3mm] border border-gray-200" style={{ padding: mm(4) }}>
              <QrCode value={c.guideUrl} size={mm(c.wifi ? 58 : 90)} ecc="Q" />
            </div>
            <p className="mt-[3mm] flex items-center gap-[1.5mm] font-semibold text-gray-900" style={{ fontSize: '13pt' }}>
              <ScanLine style={{ width: mm(5), height: mm(5) }} /> House guide
            </p>
            <p className="text-gray-500" style={{ fontSize: '10pt' }}>Check-out, house rules &amp; local tips</p>
          </div>
        )}
      </div>

      {c.showWifiText && c.wifi && (
        <div className="mx-auto mt-[10mm] rounded-[3mm] bg-gray-50 px-[8mm] py-[5mm] text-left">
          <WifiText c={c} size="14pt" />
        </div>
      )}
      {c.footer && <p className="mt-auto text-gray-400" style={{ fontSize: '8pt' }}>{c.footer}</p>}
    </div>
  )
}

export function Sign({ variant, c, size }: { variant: SignVariant; c: SignContent; size?: CardSize }) {
  if (variant === 'tent') return <SignTent c={c} />
  if (variant === 'poster') return <SignPoster c={c} />
  return <SignCard c={c} size={size} />
}

/** Physical width in mm, so previews can scale a sign to fit their column. */
export function signWidthMm(variant: SignVariant, size: CardSize = 'a6'): number {
  return variant === 'card' ? CARD_SIZES[size].w : 180
}
