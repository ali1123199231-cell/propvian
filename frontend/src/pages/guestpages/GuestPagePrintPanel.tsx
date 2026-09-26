import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Copy, Download, ExternalLink, Nfc, Printer, Link2, Loader2, CheckCircle2, Smartphone } from 'lucide-react'
import clsx from 'clsx'
import { guestPagesApi } from '@/api/guestPages'
import { useAuthStore } from '@/store/authStore'
import type { GuestPage, GuestPageUpdate } from '@/types/guestPage'
import { Sign, CARD_SIZES, signWidthMm, type SignVariant, type CardSize } from '@/components/guestpage/PrintableSign'
import { QrCode, downloadQrSvg } from '@/components/guestpage/QrCode'
import { copyText } from '@/lib/clipboard'
import { apiError } from './editorShared'
import { Toggle } from './GuestPageEditorPage'

// Web NFC ships in Chrome for Android only and has no TypeScript DOM types yet
type NdefWriter = { write: (msg: { records: { recordType: string; data: string }[] }, opts?: { signal?: AbortSignal }) => Promise<void> }
const webNfcAvailable = typeof window !== 'undefined' && 'NDEFReader' in window

const VARIANTS: { id: SignVariant; label: string; note: string }[] = [
  { id: 'card', label: 'Stand card', note: 'Fits A6 and 4×6 in acrylic holders' },
  { id: 'tent', label: 'Table tent', note: 'A4 sheet, fold in half' },
  { id: 'poster', label: 'Poster', note: 'A4 or Letter, for a wall or the fridge' },
]

export function GuestPagePrintPanel({ page, draft, dirty }: { page: GuestPage; draft: GuestPageUpdate; dirty: boolean }) {
  const own = page.codes.find((c) => c.kind === 'PROPERTY') ?? page.codes[0]
  const [variant, setVariant] = useState<SignVariant>('card')
  const [size, setSize] = useState<CardSize>('a6')
  const [includeWifi, setIncludeWifi] = useState(true)
  const [wifiText, setWifiText] = useState(true)
  const [nfcHint, setNfcHint] = useState(false)
  const [title, setTitle] = useState(page.propertyName)

  // The printed WiFi code comes from the saved page, never from unsaved edits
  const wifi = includeWifi && page.wifiSsid
    ? { ssid: page.wifiSsid, password: page.wifiPassword, security: page.wifiSecurity, hidden: page.wifiHidden }
    : null

  const printHref = `/print/guest-page/${page.propertyId}?${new URLSearchParams({
    t: variant, size, wifi: includeWifi ? '1' : '0', text: wifiText ? '1' : '0', nfc: nfcHint ? '1' : '0', title,
  })}`

  const previewScale = Math.min(1, 300 / (signWidthMm(variant, size) * 3.78))

  return (
    <div className="space-y-5">
      {dirty && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          You have unsaved changes on the Content tab. Save them first so the printed WiFi code matches.
        </p>
      )}

      <Section title="Your guest page link" subtitle="Share it in your booking confirmation or house manual too. It never changes, even when the WiFi does.">
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-gray-200 p-2.5"><QrCode value={own.qrUrl} size={96} ecc="Q" /></div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 break-all font-mono text-sm text-gray-800">{own.url}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={async () => { if (await copyText(own.url)) toast.success('Link copied') }}>
                <Copy size={15} /> Copy link
              </button>
              <a href={`${own.url}?s=p`} target="_blank" rel="noopener noreferrer" className="btn-secondary"><ExternalLink size={15} /> Open</a>
              <button type="button" className="btn-secondary" onClick={() => downloadQrSvg(own.qrUrl, `guest-page-${own.code}.svg`)}>
                <Download size={15} /> QR code (SVG)
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Print a sign" subtitle="Print at 100% scale (turn off “fit to page”). Card stock or a laminator makes it last.">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {VARIANTS.map((v) => (
                <button key={v.id} type="button" onClick={() => setVariant(v.id)}
                        className={clsx('rounded-xl border p-3 text-left', variant === v.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                  <p className="text-sm font-semibold text-gray-900">{v.label}</p>
                  <p className="text-xs text-gray-500">{v.note}</p>
                </button>
              ))}
            </div>
            {variant === 'card' && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Card size</span>
                <select className="input-base" value={size} onChange={(e) => setSize(e.target.value as CardSize)}>
                  {Object.entries(CARD_SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Title</span>
              <input className="input-base" maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div className="space-y-3">
              <Check checked={includeWifi} onChange={setIncludeWifi} disabled={!page.wifiSsid}
                     label="Add a WiFi QR code" note={page.wifiSsid ? 'Phones join by scanning it, no typing. Reprint it if you change the password.' : 'Add your WiFi on the Content tab first.'} />
              <Check checked={wifiText} onChange={setWifiText} disabled={!includeWifi || !page.wifiSsid}
                     label="Print the network name and password as text" />
              <Check checked={nfcHint} onChange={setNfcHint}
                     label="“Tap your phone here” hint" note="Only if an NFC tag sits behind the card. See below." />
            </div>
            <a href={printHref} target="_blank" rel="noopener noreferrer" className="btn-primary"><Printer size={15} /> Print or save as PDF</a>
          </div>
          <div className="flex items-start justify-center overflow-hidden rounded-xl bg-gray-100 p-4">
            <div style={{ zoom: previewScale }} className="shadow-md">
              <Sign variant={variant} size={size} c={{
                title, guideUrl: own.qrUrl, wifi, showWifiText: wifiText && !!wifi, showNfcHint: nfcHint,
                accent: page.brandColor, footer: draft.showPoweredBy ? 'Guest page by propvian.com' : undefined,
              }} />
            </div>
          </div>
        </div>
      </Section>

      <NfcSection nfcUrl={own.nfcUrl} />

      <StandsSection page={page} />
    </div>
  )
}

function NfcSection({ nfcUrl }: { nfcUrl: string }) {
  const [state, setState] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  const write = async () => {
    abort.current?.abort()
    abort.current = new AbortController()
    setState('waiting')
    try {
      const Reader = (window as unknown as { NDEFReader: new () => NdefWriter }).NDEFReader
      await new Reader().write({ records: [{ recordType: 'url', data: nfcUrl }] }, { signal: abort.current.signal })
      setState('done')
    } catch (e) {
      if ((e as Error).name === 'AbortError') { setState('idle'); return }
      setState('error')
      setMessage((e as Error).message || 'The tag could not be written.')
    }
  }

  return (
    <Section title="NFC tag" subtitle="A tag behind the card lets guests tap instead of scanning. Any NTAG213/215/216 sticker works, about €0.40 each.">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">The tag should open</p>
          <div className="mb-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-gray-50 px-3 py-2 text-sm">{nfcUrl}</code>
            <button type="button" className="btn-secondary" onClick={async () => { if (await copyText(nfcUrl)) toast.success('Copied') }}><Copy size={15} /></button>
          </div>
          {webNfcAvailable ? (
            <>
              <button type="button" className="btn-primary" onClick={write} disabled={state === 'waiting'}>
                {state === 'waiting' ? <Loader2 size={15} className="animate-spin" /> : <Nfc size={15} />}
                {state === 'waiting' ? 'Hold the tag to the back of your phone…' : 'Write to an NFC tag'}
              </button>
              {state === 'done' && <p className="mt-2 flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 size={15} /> Written. Tap it to test.</p>}
              {state === 'error' && <p className="mt-2 text-sm text-red-600">{message}</p>}
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-gray-600">
              <Smartphone size={16} className="mt-0.5 shrink-0" />
              Open this page in Chrome on an Android phone to write tags here directly.
            </p>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          <p className="mb-2 font-semibold text-gray-900">With an iPhone (or any phone)</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Install the free <span className="font-medium">NFC Tools</span> app.</li>
            <li>Write → Add a record → URL, and paste the link.</li>
            <li>Tap Write and hold the phone on the tag.</li>
            <li>Optional: Other → Lock tag, so nobody can overwrite it. Locking is permanent, which is fine: the link never changes, only the page behind it.</li>
          </ol>
          <p className="mt-3 text-xs text-gray-500">
            Why a link and not a WiFi record: iPhones open links from tags but won't join WiFi from one.
            The link works on both, and the WiFi QR code on the card covers instant joining.
          </p>
        </div>
      </div>
    </Section>
  )
}

function StandsSection({ page }: { page: GuestPage }) {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const qc = useQueryClient()
  const [code, setCode] = useState('')
  const claim = useMutation({
    mutationFn: () => guestPagesApi.claim(orgId, code.trim(), page.propertyId),
    onSuccess: (saved) => {
      qc.setQueryData(['guest-page', orgId, page.propertyId], saved)
      qc.invalidateQueries({ queryKey: ['guest-pages', orgId] })
      setCode('')
      toast.success('Stand linked to this page')
    },
    onError: (e) => toast.error(apiError(e, 'Could not link that stand')),
  })

  return (
    <Section title="Stands and tags that open this page" subtitle="Views in the last 30 days, per code. Each Propvian stand has its own code, so you can see which one guests use.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-4 font-medium">Code</th><th className="py-2 pr-4 font-medium">What</th><th className="py-2 text-right font-medium">Views (30 days)</th>
            </tr>
          </thead>
          <tbody>
            {page.codes.map((c) => (
              <tr key={c.code} className="border-b border-gray-100 last:border-0">
                <td className="py-2.5 pr-4 font-mono">{c.code}</td>
                <td className="py-2.5 pr-4 text-gray-600">{c.kind === 'PROPERTY' ? 'This page’s own link, QR and NFC' : c.kitCode ? `Tag from kit ${c.kitCode}` : `Propvian stand${c.batchLabel ? ` · ${c.batchLabel}` : ''}`}</td>
                <td className="py-2.5 text-right tabular-nums">{c.views30d.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) claim.mutate() }}>
        <label className="min-w-[200px] flex-1">
          <span className="mb-1 block text-sm font-medium text-gray-700">Link a Propvian stand</span>
          <input className="input-base font-mono uppercase" placeholder="Code printed under the QR, e.g. K7M2QX9P" maxLength={16}
                 value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </label>
        <button type="submit" className="btn-secondary" disabled={!code.trim() || claim.isPending}>
          {claim.isPending ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />} Link stand
        </button>
      </form>
    </Section>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="mb-4 mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      {children}
    </section>
  )
}

function Check({ checked, onChange, label, note, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; note?: string; disabled?: boolean }) {
  return (
    <div className={clsx('flex items-start gap-3', disabled && 'opacity-50')}>
      <fieldset disabled={disabled} className="pt-0.5"><Toggle checked={checked && !disabled} onChange={onChange} /></fieldset>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {note && <p className="text-xs text-gray-500">{note}</p>}
      </div>
    </div>
  )
}
