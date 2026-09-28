import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ExternalLink, Wifi, Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Plus,
  ShieldAlert, Loader2, Save, Printer, BarChart3, PenLine, AlertTriangle,
} from 'lucide-react'
import clsx from 'clsx'
import { guestPagesApi } from '@/api/guestPages'
import { useAuthStore } from '@/store/authStore'
import { GuestPageView } from '@/components/guestpage/GuestPageView'
import type { GuestPage, GuestPageUpdate, GuestPageSection, GuestSectionType } from '@/types/guestPage'
import { toDraft, draftToPublic, apiError } from './editorShared'
import { GuestPagePrintPanel } from './GuestPagePrintPanel'
import { GuestPageStatsPanel } from './GuestPageStatsPanel'

// Sections a host can add; titles and writing hints live under editor.presets.<type>
const SECTION_PRESETS: GuestSectionType[] = ['LOCAL_TIPS', 'APPLIANCES', 'PARKING', 'EMERGENCY', 'CUSTOM']

const WIFI_SECURITIES: GuestPageUpdate['wifiSecurity'][] = ['WPA', 'WEP', 'nopass']

type Tab = 'content' | 'print' | 'stats'

export function GuestPageEditorPage() {
  const { t } = useTranslation('guestpage')
  const { propertyId = '' } = useParams<{ propertyId: string }>()
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('content')

  const { data: page, isLoading, isError, error } = useQuery({
    queryKey: ['guest-page', orgId, propertyId],
    queryFn: () => guestPagesApi.get(orgId, propertyId),
    enabled: !!orgId && !!propertyId,
  })

  const [draft, setDraft] = useState<GuestPageUpdate | null>(null)
  // Reset the form only when the server copy actually changes, not on every refetch
  useEffect(() => { if (page) setDraft(toDraft(page)) }, [page?.id, page?.updatedAt])

  const dirty = useMemo(
    () => !!page && !!draft && JSON.stringify(toDraft(page)) !== JSON.stringify(draft),
    [page, draft],
  )

  const save = useMutation({
    mutationFn: () => guestPagesApi.update(orgId, propertyId, clean(draft!, t)),
    onSuccess: (saved) => {
      qc.setQueryData(['guest-page', orgId, propertyId], saved)
      qc.invalidateQueries({ queryKey: ['guest-pages', orgId] })
      toast.success(t('editor.saved'))
    },
    onError: (e) => toast.error(apiError(e, t('editor.saveFailed'))),
  })

  if (isLoading || (page && !draft)) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  }
  if (isError || !page || !draft) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="mb-4 text-gray-600">{apiError(error, t('editor.loadFailed'))}</p>
        <Link to="/guest-pages" className="btn-secondary">{t('editor.backToList')}</Link>
      </div>
    )
  }

  const set = <K extends keyof GuestPageUpdate>(key: K, value: GuestPageUpdate[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d))

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/guest-pages" className="mb-1 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} /> {t('list.title')}
          </Link>
          <h1 className="truncate text-2xl font-bold text-gray-900">{page.propertyName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="mr-2 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <Toggle checked={draft.enabled} onChange={(v) => set('enabled', v)} />
            {draft.enabled ? t('list.live') : t('list.off')}
          </label>
          <a href={`${page.publicUrl}?s=p`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <ExternalLink size={15} /> {t('editor.openPage')}
          </a>
          <button type="button" className="btn-primary" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {dirty ? t('editor.saveChanges') : t('editor.upToDate')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {([['content', t('editor.tabs.content'), PenLine], ['print', t('editor.tabs.print'), Printer], ['stats', t('editor.tabs.stats'), BarChart3]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx('-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium',
              tab === id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700')}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <ContentForm page={page} draft={draft} set={set} />
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">{t('editor.livePreview')}</p>
              <div className="mx-auto h-[720px] w-[375px] overflow-y-auto rounded-[2.2rem] border-[10px] border-gray-900 bg-gray-50 shadow-xl">
                <GuestPageView page={draftToPublic(page, draft)} poweredByHref="#" />
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === 'print' && <GuestPagePrintPanel page={page} draft={draft} dirty={dirty} />}
      {tab === 'stats' && <GuestPageStatsPanel orgId={orgId} propertyId={propertyId} page={page} />}
    </div>
  )
}

/** Blank strings become null so "cleared" and "never set" look the same to the server. */
function clean(d: GuestPageUpdate, t: TFunction): GuestPageUpdate {
  const n = (s?: string | null) => (s && s.trim() ? s : null)
  return {
    ...d,
    welcomeMessage: n(d.welcomeMessage),
    wifiSsid: d.wifiSsid ? d.wifiSsid : null,
    wifiPassword: d.wifiSecurity === 'nopass' ? null : d.wifiPassword ? d.wifiPassword : null,
    sections: d.sections.map((s) => ({ ...s, title: s.title.trim() || t(`editor.sectionTypes.${s.type}`), body: n(s.body) })),
    contactName: n(d.contactName),
    contactPhone: n(d.contactPhone),
    contactEmail: n(d.contactEmail),
    bookDirectMessage: n(d.bookDirectMessage),
    bookDirectPromoCode: n(d.bookDirectPromoCode),
    bookDirectUrl: n(d.bookDirectUrl),
  }
}

// ── Content form ───────────────────────────────────────────────────────────────

function ContentForm({ page, draft, set }: {
  page: GuestPage
  draft: GuestPageUpdate
  set: <K extends keyof GuestPageUpdate>(key: K, value: GuestPageUpdate[K]) => void
}) {
  const { t } = useTranslation('guestpage')
  // Guests see this password on the page anyway, and a masked field makes browsers offer to save it as a login
  const [showPassword, setShowPassword] = useState(true)
  const sections = draft.sections

  const updateSection = (i: number, patch: Partial<GuestPageSection>) =>
    set('sections', sections.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = [...sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    set('sections', next)
  }
  const remove = (i: number) => set('sections', sections.filter((_, j) => j !== i))
  const add = (type: GuestSectionType, title: string) =>
    set('sections', [...sections, { id: Math.random().toString(36).slice(2, 10), type, title, body: '' }])

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <p><Trans t={t} i18nKey="editor.publicWarning" components={{ b: <span className="font-semibold" /> }} /></p>
      </div>

      <Panel title={t('editor.wifi.title')} icon={<Wifi size={16} />} subtitle={t('editor.wifi.subtitle')}>
        {page.legacyWifiDetails && !draft.wifiSsid && (
          <p className="mb-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            {t('editor.wifi.fromProperty')} <span className="font-mono">{page.legacyWifiDetails}</span>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('editor.wifi.network')}>
            <input className="input-base" value={draft.wifiSsid ?? ''} maxLength={32} autoComplete="off" spellCheck={false}
                   onChange={(e) => set('wifiSsid', e.target.value)} placeholder={t('editor.wifi.networkPlaceholder')} />
          </Field>
          <Field label={t('editor.wifi.password')}>
            <div className="relative">
              <input className="input-base pr-10 font-mono" type="text" maxLength={63}
                     style={showPassword ? undefined : ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)}
                     autoComplete="off" data-1p-ignore data-lpignore="true" spellCheck={false} disabled={draft.wifiSecurity === 'nopass'}
                     value={draft.wifiSecurity === 'nopass' ? '' : draft.wifiPassword ?? ''}
                     onChange={(e) => set('wifiPassword', e.target.value)} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? t('editor.wifi.hidePassword') : t('editor.wifi.showPassword')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label={t('editor.wifi.security')}>
            <select className="input-base" value={draft.wifiSecurity} onChange={(e) => set('wifiSecurity', e.target.value as GuestPageUpdate['wifiSecurity'])}>
              {WIFI_SECURITIES.map((v) => <option key={v} value={v}>{t(`editor.wifi.securities.${v}`)}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={draft.wifiHidden} onChange={(e) => set('wifiHidden', e.target.checked)} />
            {t('editor.wifi.hidden')}
          </label>
        </div>
      </Panel>

      <Panel title={t('editor.welcome')}>
        <textarea className="input-base min-h-[88px]" maxLength={2000} value={draft.welcomeMessage ?? ''}
                  onChange={(e) => set('welcomeMessage', e.target.value)} />
      </Panel>

      <Panel title={t('editor.guide.title')} subtitle={t('editor.guide.subtitle')}>
        <div className="space-y-3">
          {sections.map((s, i) => {
            return (
              <div key={s.id ?? i} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="badge bg-gray-100 text-gray-600">{t(`editor.sectionTypes.${s.type}`)}</span>
                  <input className="input-base flex-1 py-1.5 font-medium" value={s.title} maxLength={100}
                         onChange={(e) => updateSection(i, { title: e.target.value })} aria-label={t('editor.guide.sectionTitle')} />
                  <IconButton label={t('editor.guide.moveUp')} onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp size={16} /></IconButton>
                  <IconButton label={t('editor.guide.moveDown')} onClick={() => move(i, 1)} disabled={i === sections.length - 1}><ChevronDown size={16} /></IconButton>
                  <IconButton label={t('editor.guide.remove')} onClick={() => remove(i)}><Trash2 size={16} /></IconButton>
                </div>
                {s.type === 'HOUSE_RULES' && (
                  <p className="mb-2 text-xs text-gray-500">
                    {page.houseRules.length ? t('editor.guide.rulesAuto') : t('editor.guide.rulesAutoOnceSet')}
                  </p>
                )}
                <textarea className="input-base min-h-[96px] text-sm" maxLength={4000} value={s.body ?? ''}
                          placeholder={SECTION_PRESETS.includes(s.type) ? t(`editor.presets.${s.type}.hint`) : ''} onChange={(e) => updateSection(i, { body: e.target.value })} />
              </div>
            )
          })}
        </div>
        {sections.length < 20 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SECTION_PRESETS.map((type) => (
              <button key={type} type="button" onClick={() => add(type, t(`editor.presets.${type}.title`))}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-primary-400 hover:text-primary-700">
                <Plus size={14} /> {t(`editor.presets.${type}.title`)}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={t('editor.contact.title')} subtitle={t('editor.contact.subtitle')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('editor.contact.name')}><input className="input-base" maxLength={100} value={draft.contactName ?? ''} onChange={(e) => set('contactName', e.target.value)} /></Field>
          <Field label={t('editor.contact.phone')}><input className="input-base" maxLength={40} inputMode="tel" placeholder="+34 600 123 456" value={draft.contactPhone ?? ''} onChange={(e) => set('contactPhone', e.target.value)} /></Field>
          <Field label={t('editor.contact.email')}><input className="input-base" type="email" maxLength={255} value={draft.contactEmail ?? ''} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={draft.contactWhatsapp} onChange={(e) => set('contactWhatsapp', e.target.checked)} />
            {t('editor.contact.whatsapp')}
          </label>
        </div>
      </Panel>

      <Panel title={t('editor.bookDirect.title')} subtitle={t('editor.bookDirect.subtitle')}>
        <label className="mb-4 flex items-center gap-3 text-sm font-medium text-gray-800">
          <Toggle checked={draft.bookDirectEnabled} onChange={(v) => set('bookDirectEnabled', v)} />
          {t('editor.bookDirect.show')}
        </label>
        <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="mb-1 font-semibold">{t('editor.bookDirect.airbnbTitle')}</p>
            <p>
              {t('editor.bookDirect.airbnbBody')}{' '}
              <a href="https://www.airbnb.com/help/article/2799" target="_blank" rel="noopener noreferrer" className="underline">{t('editor.bookDirect.readPolicy')}</a>
            </p>
          </div>
        </div>
        <fieldset disabled={!draft.bookDirectEnabled} className={clsx('grid gap-4 sm:grid-cols-2', !draft.bookDirectEnabled && 'opacity-50')}>
          <Field label={t('editor.bookDirect.message')} hint={t('editor.bookDirect.messageHint')} className="sm:col-span-2">
            <input className="input-base" maxLength={300} placeholder={t('view.bookDirectDefault')} value={draft.bookDirectMessage ?? ''}
                   onChange={(e) => set('bookDirectMessage', e.target.value)} />
          </Field>
          <Field label={t('editor.bookDirect.promo')} hint={t('editor.bookDirect.promoHint')}>
            <input className="input-base font-mono uppercase" maxLength={50} value={draft.bookDirectPromoCode ?? ''}
                   onChange={(e) => set('bookDirectPromoCode', e.target.value.toUpperCase())} />
          </Field>
          <Field label={t('editor.bookDirect.link')} hint={page.defaultBookDirectUrl ? t('editor.bookDirect.linkDefault', { url: page.defaultBookDirectUrl }) : t('editor.bookDirect.linkNeeded')}>
            <input className="input-base" type="url" maxLength={500} placeholder="https://" value={draft.bookDirectUrl ?? ''}
                   onChange={(e) => set('bookDirectUrl', e.target.value)} />
          </Field>
          <label className="flex items-center gap-3 text-sm text-gray-800 sm:col-span-2">
            <Toggle checked={draft.bookDirectHideAirbnb} onChange={(v) => set('bookDirectHideAirbnb', v)} />
            {t('editor.bookDirect.hideAirbnb')}
          </label>
        </fieldset>
      </Panel>

      <Panel title={t('editor.branding.title')}>
        <fieldset disabled={!page.canHideBranding} className={clsx('flex items-center gap-3 text-sm text-gray-800', !page.canHideBranding && 'opacity-60')}>
          <Toggle checked={draft.showPoweredBy || !page.canHideBranding} onChange={(v) => set('showPoweredBy', v)} />
          {t('editor.branding.show')}
        </fieldset>
        {!page.canHideBranding && (
          <p className="mt-2 text-xs text-gray-500">
            {t('editor.branding.freeNote')}{' '}
            <Link to="/billing" className="font-medium text-primary-700 hover:underline">{t('editor.branding.seePlans')}</Link>
          </p>
        )}
      </Panel>
    </div>
  )
}

// ── Small building blocks ─────────────────────────────────────────────────────

function Panel({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">{icon}{title}</h2>
      {subtitle && <p className="mb-4 mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </section>
  )
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  )
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30">
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx('relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary-600' : 'bg-gray-300')}
    >
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  )
}
