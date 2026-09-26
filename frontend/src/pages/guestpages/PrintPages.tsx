import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Printer } from 'lucide-react'
import { guestPagesApi, adminTapCodesApi } from '@/api/guestPages'
import { useAuthStore } from '@/store/authStore'
import { Sign, CARD_SIZES, type SignVariant, type CardSize } from '@/components/guestpage/PrintableSign'
import { QrCode } from '@/components/guestpage/QrCode'

/*
 * Print sheets live outside the app layout so nothing but the sign reaches the
 * printer. No @page size is set: the host's default paper (A4 or US Letter)
 * applies, and every layout here fits inside both printable areas.
 */
const PRINT_CSS = `
  @page { margin: 10mm; }
  @media print {
    .no-print { display: none !important; }
    html, body { background: #fff !important; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`

function Toolbar({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="no-print mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{hint}</p>
      </div>
      <button type="button" className="btn-primary" onClick={() => window.print()}><Printer size={15} /> Print</button>
    </div>
  )
}

export function PrintGuestSignPage() {
  const { propertyId = '' } = useParams<{ propertyId: string }>()
  const { isAuthenticated, activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const params = new URLSearchParams(window.location.search)
  const variant = (['card', 'tent', 'poster'].includes(params.get('t') ?? '') ? params.get('t') : 'card') as SignVariant
  const size = (params.get('size') === '4x6' ? '4x6' : 'a6') as CardSize

  const { data: page, isLoading } = useQuery({
    queryKey: ['guest-page', orgId, propertyId],
    queryFn: () => guestPagesApi.get(orgId, propertyId),
    enabled: isAuthenticated && !!orgId,
  })

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (isLoading || !page) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  const own = page.codes.find((c) => c.kind === 'PROPERTY') ?? page.codes[0]
  const wifi = params.get('wifi') !== '0' && page.wifiSsid
    ? { ssid: page.wifiSsid, password: page.wifiPassword, security: page.wifiSecurity, hidden: page.wifiHidden }
    : null
  const cut = variant === 'card'

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <style>{PRINT_CSS}</style>
      <Toolbar
        title={`${page.propertyName} · ${variant === 'card' ? CARD_SIZES[size].label + ' card' : variant === 'tent' ? 'table tent' : 'poster'}`}
        hint={variant === 'tent' ? 'Print at 100%, then fold along the dashed line.' : 'Print at 100% scale ("actual size"), not "fit to page".'}
      />
      <div className="flex justify-center">
        <div className={cut ? 'border border-dashed border-gray-400 shadow-lg print:shadow-none' : 'shadow-lg print:shadow-none'}>
          <Sign variant={variant} size={size} c={{
            title: params.get('title') || page.propertyName,
            guideUrl: own.qrUrl,
            wifi,
            showWifiText: params.get('text') !== '0' && !!wifi,
            showNfcHint: params.get('nfc') === '1',
            accent: page.brandColor,
            footer: page.showPoweredBy ? 'Guest page by propvian.com' : undefined,
          }} />
        </div>
      </div>
    </div>
  )
}

/**
 * Print output for a production batch of pre-printed codes:
 * - stickers (default): 4 × 5 per page, QR code plus the code in letters
 * - ?layout=cards: one A6 stand card per page, for acrylic holders; the
 *   owner scans it to set the stand up, guests scan it once it is set up
 */
export function PrintTapCodeSheetPage() {
  const { batchLabel = '' } = useParams<{ batchLabel: string }>()
  const cards = new URLSearchParams(window.location.search).get('layout') === 'cards'
  // Acrylic kits carry the tag behind the card; the 3D stand hides it under its tap pad
  const [tapPad, setTapPad] = useState(new URLSearchParams(window.location.search).get('tap') === 'pad')
  const { isAuthenticated, user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const { data: batch, isLoading } = useQuery({
    queryKey: ['tap-code-batch', batchLabel],
    queryFn: () => adminTapCodesApi.batch(batchLabel),
    enabled: isAuthenticated && isAdmin,
  })

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  if (isLoading || !batch?.codes) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  if (cards) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
        <style>{PRINT_CSS}</style>
        <Toolbar title={`Batch ${batch.batchLabel} · ${batch.codes.length} stand cards`}
                 hint="One A6 card per page. Print at 100%, cut along the dashed line, then write the same code's link onto the NFC tag behind it." />
        <div className="no-print mx-auto -mt-3 mb-6 flex max-w-3xl gap-2 text-sm">
          <span className="self-center text-gray-500">The NFC tag is</span>
          {([[false, 'behind the card (acrylic kit)'], [true, 'in the stand\u2019s tap pad (3D stand)']] as const).map(([pad, label]) => (
            <button key={label} type="button" onClick={() => setTapPad(pad)}
                    className={tapPad === pad ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-white' : 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700'}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-6 print:gap-0">
          {/* One card per unit: a kit (tag trio) gets a single card, with its kit code's QR */}
          {batch.codes.filter((c) => !c.kitCode || c.kitCode === c.code).map((c) => {
            const kit = c.kitCode ? batch.codes!.filter((k) => k.kitCode === c.kitCode).map((k) => k.code) : []
            return (
            <div key={c.code} className="border border-dashed border-gray-400 bg-white shadow-md print:shadow-none"
                 style={{ breakAfter: 'page', breakInside: 'avoid' }}>
              <Sign variant="card" size="a6" c={{
                title: 'Guest guide & WiFi',
                kicker: 'Welcome',
                guideUrl: c.qrUrl,
                showNfcHint: true,
                nfcHintText: tapPad ? 'Tap your phone on the pad below, or scan' : undefined,
                writeInWifi: true,
                footer: kit.length
                  ? `New tags? Owners scan this card to set up all ${kit.length}: ${kit.join(' · ')} · propvian.com`
                  : `New stand? Owners scan it to set it up · code ${c.code} · propvian.com`,
              }} />
            </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <style>{PRINT_CSS}</style>
      <Toolbar title={`Batch ${batch.batchLabel} · ${batch.codes.length} stickers`}
               hint="Each sticker is 45 × 52 mm. Print at 100% on sticker paper or card, then cut along the grid." />
      <div className="mx-auto grid w-[190mm] grid-cols-4 bg-white print:w-full">
        {batch.codes.map((c) => (
          <div key={c.code} className="flex flex-col items-center justify-center border border-dashed border-gray-300"
               style={{ height: '52mm', breakInside: 'avoid' }}>
            <QrCode value={c.qrUrl} size="30mm" ecc="Q" />
            <p className="mt-[2mm] font-mono font-semibold tracking-wider" style={{ fontSize: '10pt' }}>{c.code}</p>
            <p className="text-gray-500" style={{ fontSize: '6.5pt' }}>Scan or tap · propvian.com</p>
          </div>
        ))}
      </div>
    </div>
  )
}
