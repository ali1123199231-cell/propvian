import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Loader2, AlertCircle, Nfc, PowerOff } from 'lucide-react'
import { publicGuestPageApi } from '@/api/guestPages'
import { GuestPageView } from '@/components/guestpage/GuestPageView'
import { PropvianLogo } from '@/components/PropvianLogo'
import { savePendingClaim } from '@/lib/pendingClaim'
import { useAuthStore } from '@/store/authStore'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

/*
 * /g/:code — what a guest's phone opens after tapping the NFC tag or scanning
 * the QR code in the rental. NFC tags carry ?s=n and printed codes ?s=q so the
 * host can see which one guests use; the marker is dropped from the address bar
 * after the first load, so a reload or a shared link doesn't count as a new tap.
 */
export function GuestPagePublic() {
  const { t } = useTranslation('guestpage')
  const { code = '' } = useParams<{ code: string }>()
  const source = new URLSearchParams(window.location.search).get('s') ?? undefined

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-guest-page', code],
    queryFn: () => publicGuestPageApi.get(code, source),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (data && source) window.history.replaceState(null, '', window.location.pathname)
  }, [data, source])

  const head = (
    <Helmet>
      <title>{data?.propertyName ? `${data.propertyName} · ${t('view.guideLabel')}` : t('view.guideLabel')}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        {head}
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Message head={head} icon={<AlertCircle size={26} className="text-red-500" />} title={t('public.notFoundTitle')}>
        {t('public.notFoundBody')}
      </Message>
    )
  }

  if (data.status === 'UNCLAIMED') return <UnclaimedStand code={data.code} head={head} />

  if (data.status === 'INACTIVE') {
    return (
      <Message head={head} icon={<PowerOff size={26} className="text-gray-500" />} title={t('public.offTitle')}>
        {t('public.offBody')}
      </Message>
    )
  }

  const poweredByHref =
    `https://propvian.com/?utm_source=guestpage&utm_medium=referral&utm_campaign=poweredby&utm_content=${encodeURIComponent(data.code)}`

  return (
    <>
      {head}
      {/* Guests read the page in their own language; the host's content stays as written */}
      <div className="absolute right-3 top-3 z-10">
        <LanguageSwitcher variant="compact" className="rounded-full bg-white/85 shadow-sm backdrop-blur" />
      </div>
      <GuestPageView page={data} onEvent={(type) => publicGuestPageApi.event(data.code, type)} poweredByHref={poweredByHref} />
    </>
  )
}

function Message({ head, icon, title, children }: { head: JSX.Element; icon: JSX.Element; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      {head}
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">{icon}</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{children}</p>
      </div>
    </div>
  )
}

/*
 * A pre-printed stand nobody has linked yet. Guests land here too, so the page
 * speaks to both: guests are told to ask the host, the owner gets a way in.
 */
function UnclaimedStand({ code, head }: { code: string; head: JSX.Element }) {
  const { t } = useTranslation('guestpage')
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const start = () => {
    savePendingClaim(code)
    if (isAuthenticated) {
      window.location.assign(`/claim/${code}`)
    } else {
      // A full load, so first-touch attribution records the stand as the signup source
      window.location.assign(`/?utm_source=stand&utm_medium=tap&utm_campaign=claim&utm_content=${encodeURIComponent(code)}`)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      {head}
      <div className="absolute right-3 top-3"><LanguageSwitcher variant="compact" /></div>
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-lg">
        <div className="mb-6 flex justify-center"><PropvianLogo size={30} textClassName="font-semibold text-gray-900 text-lg" /></div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
          <Nfc size={26} className="text-primary-600" />
        </div>
        <h1 className="mb-2 text-center text-xl font-bold text-gray-900">{t('unclaimed.title')}</h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          <span className="font-medium text-gray-700">{t('unclaimed.guestLead')}</span> {t('unclaimed.guestBody')}
        </p>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-1 text-sm font-semibold text-gray-900">{t('unclaimed.ownerTitle')}</p>
          <p className="mb-4 text-sm text-gray-500">{t('unclaimed.ownerBody')}</p>
          <button type="button" onClick={start} className="btn-primary w-full">{t('unclaimed.cta')}</button>
          <p className="mt-3 text-center text-xs text-gray-400">{t('unclaimed.codeLabel')} <span className="font-mono">{code}</span></p>
        </div>
      </div>
    </div>
  )
}
