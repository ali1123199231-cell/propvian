import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, QrCode, Nfc, Printer, Wifi, Link2, Building2, Eye } from 'lucide-react'
import clsx from 'clsx'
import { guestPagesApi } from '@/api/guestPages'
import { useAuthStore } from '@/store/authStore'

export function GuestPagesListPage() {
  const { t } = useTranslation('guestpage')
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['guest-pages', orgId],
    queryFn: () => guestPagesApi.list(orgId),
    enabled: !!orgId,
  })

  const anyConfigured = rows.some((r) => r.configured)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('list.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('list.intro')}</p>
        </div>
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate(`/claim/${code.trim()}`) }}>
          <label>
            <span className="mb-1 block text-xs font-medium text-gray-600">{t('list.gotStand')}</span>
            <input className="input-base w-44 font-mono uppercase" placeholder={t('list.standCode')} maxLength={16}
                   value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </label>
          <button type="submit" className="btn-secondary" disabled={!code.trim()}><Link2 size={15} /> {t('list.link')}</button>
        </form>
      </div>

      {!anyConfigured && rows.length > 0 && (
        <div className="mb-6 grid gap-3 rounded-2xl border border-primary-100 bg-primary-50/50 p-5 sm:grid-cols-3">
          {[
            [Wifi, t('list.step1Title'), t('list.step1Body')],
            [Printer, t('list.step2Title'), t('list.step2Body')],
            [QrCode, t('list.step3Title'), t('list.step3Body')],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof Wifi
            return (
              <div key={i} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm"><I size={18} /></span>
                <div><p className="text-sm font-semibold text-gray-900">{title as string}</p><p className="text-sm text-gray-600">{text as string}</p></div>
              </div>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : rows.length === 0 ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <Building2 size={28} className="mb-3 text-gray-400" />
          <p className="mb-1 font-semibold text-gray-900">{t('list.noPropertiesTitle')}</p>
          <p className="mb-5 text-sm text-gray-500">{t('list.noPropertiesBody')}</p>
          <Link to="/properties" className="btn-primary">{t('list.goToProperties')}</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.propertyId} className="card flex flex-col overflow-hidden">
              <div className="relative h-28 bg-gray-100">
                {r.imageUrl && <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />}
                <span className={clsx('badge absolute left-3 top-3 shadow-sm',
                  !r.configured ? 'bg-white text-gray-600' : r.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700')}>
                  {!r.configured ? t('list.notSetUp') : r.enabled ? t('list.live') : t('list.off')}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="truncate font-semibold text-gray-900">{r.propertyName}</p>
                <p className="mb-3 text-sm text-gray-500">{r.city || ' '}</p>
                {r.configured && (
                  <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Eye size={13} /> {t('list.views30d', { count: r.views30d })}</span>
                    {r.linkedStands > 0 && <span className="flex items-center gap-1"><Nfc size={13} /> {t('list.stands', { count: r.linkedStands })}</span>}
                    {!r.hasWifi && <span className="text-amber-700">{t('list.noWifi')}</span>}
                  </div>
                )}
                <div className="mt-auto flex gap-2">
                  <Link to={`/guest-pages/${r.propertyId}`} className={r.configured ? 'btn-secondary flex-1' : 'btn-primary flex-1'}>
                    {r.configured ? t('list.edit') : t('list.setUp')}
                  </Link>
                  {r.configured && r.publicUrl && (
                    <a href={`${r.publicUrl}?s=p`} target="_blank" rel="noopener noreferrer" className="btn-secondary" title={t('list.openPage')}>
                      <Eye size={15} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
