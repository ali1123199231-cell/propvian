import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Nfc, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { guestPagesApi, publicGuestPageApi } from '@/api/guestPages'
import { propertiesApi } from '@/api/properties'
import { useAuthStore } from '@/store/authStore'
import { clearPendingClaim, savePendingClaim } from '@/lib/pendingClaim'
import { apiError } from './editorShared'

/** /claim/:code — links a pre-printed stand to one of the signed-in host's properties. */
export function ClaimStandPage() {
  const { t } = useTranslation('guestpage')
  const { code: raw = '' } = useParams<{ code: string }>()
  const code = raw.toUpperCase().replace(/[^0-9A-Z]/g, '')
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const navigate = useNavigate()
  const [propertyId, setPropertyId] = useState('')

  const status = useQuery({
    queryKey: ['claim-status', code],
    queryFn: () => publicGuestPageApi.get(code, 'p'),
    retry: false,
    enabled: !!code,
  })
  const properties = useQuery({
    queryKey: ['properties', orgId, 'claim'],
    queryFn: () => propertiesApi.list(orgId, 0, 100),
    enabled: !!orgId,
  })
  const list = properties.data?.content ?? []

  useEffect(() => { if (!propertyId && list.length === 1) setPropertyId(list[0].id) }, [list, propertyId])
  // Keep the code while the host goes off to create a property, drop it if it's dead
  useEffect(() => { if (status.data) savePendingClaim(code) }, [status.data, code])
  useEffect(() => { if (status.isError) clearPendingClaim() }, [status.isError])

  const claim = useMutation({
    mutationFn: () => guestPagesApi.claim(orgId, code, propertyId),
    onSuccess: (page) => {
      clearPendingClaim()
      toast.success(t('claim.linkedToast'))
      navigate(`/guest-pages/${page.propertyId}`)
    },
    onError: (e) => toast.error(apiError(e, t('claim.linkFailed'))),
  })

  const notNow = () => { clearPendingClaim(); navigate('/guest-pages') }

  return (
    <div className="mx-auto max-w-lg pt-6">
      <div className="card p-7">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50"><Nfc size={24} className="text-primary-600" /></div>
        <h1 className="mb-1 text-xl font-bold text-gray-900">{t('claim.title')}</h1>
        <p className="mb-6 text-sm text-gray-500">
          {t('unclaimed.codeLabel')} <span className="font-mono font-medium text-gray-700">{code}</span>. {t('claim.intro')}
        </p>

        {status.isLoading || properties.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : status.isError ? (
          <div className="flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{t('claim.notFound')}</p>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-5 text-center">
            <Building2 size={22} className="mx-auto mb-2 text-gray-400" />
            <p className="mb-4 text-sm text-gray-600">{t('claim.noProperties')}</p>
            <Link to="/properties" className="btn-primary">{t('claim.addProperty')}</Link>
          </div>
        ) : (
          <>
            {status.data?.status !== 'UNCLAIMED' && (
              <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                {t('claim.alreadyLinked')}
              </p>
            )}
            <label className="mb-5 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">{t('claim.property')}</span>
              <select className="input-base" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                <option value="">{t('claim.chooseProperty')}</option>
                {list.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ''}</option>)}
              </select>
            </label>
            <button type="button" className="btn-primary w-full" disabled={!propertyId || claim.isPending} onClick={() => claim.mutate()}>
              {claim.isPending && <Loader2 size={15} className="animate-spin" />} {t('claim.submit')}
            </button>
          </>
        )}
        <button type="button" onClick={notNow} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700">{t('claim.notNow')}</button>
      </div>
    </div>
  )
}
