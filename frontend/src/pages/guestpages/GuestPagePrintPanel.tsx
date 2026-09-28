import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Copy, Download, ExternalLink, Nfc, Printer, Link2, Loader2, CheckCircle2, Smartphone } from 'lucide-react'
import clsx from 'clsx'
import { guestPagesApi } from '@/api/guestPages'
import { useAuthStore } from '@/store/authStore'
import type { GuestPage, GuestPageUpdate } from '@/types/guestPage'
import { Sign, CARD_SIZES, signWidthMm, type SignVariant, type CardSize } from '@/components/guestpage/PrintableSign'
import { LANGUAGES, normalizeLanguage } from '@/lib/i18n/config'
import { QrCode, downloadQrSvg } from '@/components/guestpage/QrCode'
import { copyText } from '@/lib/clipboard'
import { apiError } from './editorShared'
import { Toggle } from './GuestPageEditorPage'

// Web NFC ships in Chrome for Android only and has no TypeScript DOM types yet
type NdefWriter = { write: (msg: { records: { recordType: string; data: string }[] }, opts?: { signal?: AbortSignal }) => Promise<void> }
const webNfcAvailable = typeof window !== 'undefined' && 'NDEFReader' in window

// Labels and notes live under print.variants.<id>
const VARIANTS: SignVariant[] = ['card', 'tent', 'poster']

export function GuestPagePrintPanel({ page, draft, dirty }: { page: GuestPage; draft: GuestPageUpdate; dirty: boolean }) {
  const { t, i18n } = useTranslation('guestpage')
  const own = page.codes.find((c) => c.kind === 'PROPERTY') ?? page.codes[0]
  // What the printed sign says; guests of a Polish flat need Polish even when the host works in English
  const [signLang, setSignLang] = useState<string>(normalizeLanguage(i18n.language))
  const tSign = i18n.getFixedT(signLang, 'guestpage')
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
    t: variant, size, wifi: includeWifi ? '1' : '0', text: wifiText ? '1' : '0', nfc: nfcHint ? '1' : '0', title, sl: signLang,
  })}`

  const previewScale = Math.min(1, 300 / (signWidthMm(variant, size) * 3.78))

  return (
    <div className="space-y-5">
      {dirty && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t('print.unsaved')}
        </p>
      )}

      <Section title={t('print.link.title')} subtitle={t('print.link.subtitle')}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-gray-200 p-2.5"><QrCode value={own.qrUrl} size={96} ecc="Q" /></div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 break-all font-mono text-sm text-gray-800">{own.url}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={async () => { if (await copyText(own.url)) toast.success(t('print.link.copied')) }}>
                <Copy size={15} /> {t('print.link.copy')}
              </button>
              <a href={`${own.url}?s=p`} target="_blank" rel="noopener noreferrer" className="btn-secondary"><ExternalLink size={15} /> {t('print.link.open')}</a>
              <button type="button" className="btn-secondary" onClick={() => downloadQrSvg(own.qrUrl, `guest-page-${own.code}.svg`)}>
                <Download size={15} /> {t('print.link.qrSvg')}
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title={t('print.sign.title')} subtitle={t('print.sign.subtitle')}>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {VARIANTS.map((v) => (
                <button key={v} type="button" onClick={() => setVariant(v)}
                        className={clsx('rounded-xl border p-3 text-left', variant === v ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                  <p className="text-sm font-semibold text-gray-900">{t(`print.variants.${v}.label`)}</p>
                  <p className="text-xs text-gray-500">{t(`print.variants.${v}.note`)}</p>
                </button>
              ))}
            </div>
            {variant === 'card' && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{t('print.sign.cardSize')}</span>
                <select className="input-base" value={size} onChange={(e) => setSize(e.target.value as CardSize)}>
                  {(Object.keys(CARD_SIZES) as CardSize[]).map((k) => <option key={k} value={k}>{t(`print.sizes.${k}`)}</option>)}
                </select>
              </label>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{t('print.sign.titleField')}</span>
                <input className="input-base" maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{t('print.sign.language')}</span>
                <select className="input-base" value={signLang} onChange={(e) => setSignLang(e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeLabel}</option>)}
                </select>
              </label>
            </div>
            <div className="space-y-3">
              <Check checked={includeWifi} onChange={setIncludeWifi} disabled={!page.wifiSsid}
                     label={t('print.sign.wifiQr')} note={page.wifiSsid ? t('print.sign.wifiQrNote') : t('print.sign.wifiQrMissing')} />
              <Check checked={wifiText} onChange={setWifiText} disabled={!includeWifi || !page.wifiSsid}
                     label={t('print.sign.wifiText')} />
              <Check checked={nfcHint} onChange={setNfcHint}
                     label={t('print.sign.nfcHint')} note={t('print.sign.nfcHintNote')} />
            </div>
            <a href={printHref} target="_blank" rel="noopener noreferrer" className="btn-primary"><Printer size={15} /> {t('print.sign.print')}</a>
          </div>
          <div className="flex items-start justify-center overflow-hidden rounded-xl bg-gray-100 p-4">
            <div style={{ zoom: previewScale }} className="shadow-md">
              <Sign variant={variant} size={size} c={{
                title, guideUrl: own.qrUrl, wifi, showWifiText: wifiText && !!wifi, showNfcHint: nfcHint,
                accent: page.brandColor, footer: draft.showPoweredBy ? tSign('sign.footerGuestPage') : undefined, lang: signLang,
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
  const { t } = useTranslation('guestpage')
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
      setMessage((e as Error).message || t('print.nfc.writeFailed'))
    }
  }

  return (
    <Section title={t('print.nfc.title')} subtitle={t('print.nfc.subtitle')}>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">{t('print.nfc.shouldOpen')}</p>
          <div className="mb-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-gray-50 px-3 py-2 text-sm">{nfcUrl}</code>
            <button type="button" className="btn-secondary" onClick={async () => { if (await copyText(nfcUrl)) toast.success(t('view.copied')) }} aria-label={t('view.copy')}><Copy size={15} /></button>
          </div>
          {webNfcAvailable ? (
            <>
              <button type="button" className="btn-primary" onClick={write} disabled={state === 'waiting'}>
                {state === 'waiting' ? <Loader2 size={15} className="animate-spin" /> : <Nfc size={15} />}
                {state === 'waiting' ? t('print.nfc.holdTag') : t('print.nfc.write')}
              </button>
              {state === 'done' && <p className="mt-2 flex items-center gap-1.5 text-sm text-green-700"><CheckCircle2 size={15} /> {t('print.nfc.written')}</p>}
              {state === 'error' && <p className="mt-2 text-sm text-red-600">{message}</p>}
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-gray-600">
              <Smartphone size={16} className="mt-0.5 shrink-0" />
              {t('print.nfc.androidOnly')}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          <p className="mb-2 font-semibold text-gray-900">{t('print.nfc.anyPhone')}</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t('print.nfc.step1')}</li>
            <li>{t('print.nfc.step2')}</li>
            <li>{t('print.nfc.step3')}</li>
            <li>{t('print.nfc.step4')}</li>
          </ol>
          <p className="mt-3 text-xs text-gray-500">{t('print.nfc.whyLink')}</p>
        </div>
      </div>
    </Section>
  )
}

function StandsSection({ page }: { page: GuestPage }) {
  const { t } = useTranslation('guestpage')
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
      toast.success(t('print.stands.linked'))
    },
    onError: (e) => toast.error(apiError(e, t('claim.linkFailed'))),
  })

  return (
    <Section title={t('print.stands.title')} subtitle={t('print.stands.subtitle')}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-4 font-medium">{t('print.stands.code')}</th><th className="py-2 pr-4 font-medium">{t('print.stands.what')}</th><th className="py-2 text-right font-medium">{t('print.stands.views')}</th>
            </tr>
          </thead>
          <tbody>
            {page.codes.map((c) => (
              <tr key={c.code} className="border-b border-gray-100 last:border-0">
                <td className="py-2.5 pr-4 font-mono">{c.code}</td>
                <td className="py-2.5 pr-4 text-gray-600">{c.kind === 'PROPERTY' ? t('print.stands.own') : c.kitCode ? t('print.stands.kitTag', { kit: c.kitCode }) : `${t('print.stands.stand')}${c.batchLabel ? ` · ${c.batchLabel}` : ''}`}</td>
                <td className="py-2.5 text-right tabular-nums">{c.views30d.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) claim.mutate() }}>
        <label className="min-w-[200px] flex-1">
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('print.stands.linkLabel')}</span>
          <input className="input-base font-mono uppercase" placeholder={t('print.stands.placeholder')} maxLength={16}
                 value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </label>
        <button type="submit" className="btn-secondary" disabled={!code.trim() || claim.isPending}>
          {claim.isPending ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />} {t('claim.submit')}
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
