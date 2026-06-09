import { useState, useEffect } from 'react'
import {
  Globe, CheckCircle, Clock, XCircle, Plus, ExternalLink, X,
  ChevronRight, Search, Copy, RefreshCw, HelpCircle, Zap, Trash2, Pencil,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { verificationApi } from '@/api/verification'
import { useAuthStore } from '@/store/authStore'

const CNAME_TARGET = 'booking.propvian.com'

// ── DNS Help Modal ────────────────────────────────────────────────────────────

function DnsHelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">How to connect your domain</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step-by-step guide — no tech skills needed</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Enter your domain below</p>
              <p className="text-xs text-gray-500 mt-1">Type the domain name you own, like <code className="bg-gray-100 px-1 rounded">myvilla.com</code> or <code className="bg-gray-100 px-1 rounded">stay.myvilla.com</code>.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Log in to your domain registrar</p>
              <p className="text-xs text-gray-500 mt-1">
                This is the website where you bought your domain — GoDaddy, Namecheap, Cloudflare, Google Domains, etc. Look for a <strong>DNS settings</strong> or <strong>DNS management</strong> section.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Add these 2 records</p>
              <p className="text-xs text-gray-500 mt-1 mb-3">In your registrar's DNS settings, add the CNAME record, then set up the redirect:</p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden text-xs font-mono">
                <div className="grid grid-cols-3 bg-gray-100 text-gray-500 font-sans font-semibold px-3 py-2">
                  <span>Type</span><span>Name / Host</span><span>Value / Points to</span>
                </div>
                <div className="grid grid-cols-3 px-3 py-2.5 text-gray-800 gap-2 border-b border-gray-100">
                  <span className="font-bold text-blue-600">CNAME</span>
                  <span>www</span>
                  <span className="text-green-700 break-all">{CNAME_TARGET}</span>
                </div>
                <div className="grid grid-cols-3 px-3 py-2.5 text-gray-800 gap-2">
                  <span className="font-bold text-purple-600">Redirect</span>
                  <span>@</span>
                  <span className="text-green-700 font-sans">www.yourdomain.com</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 The <strong>Redirect</strong> is a forwarding rule at your registrar — GoDaddy calls it <strong>Forwarding</strong>, Namecheap calls it <strong>URL Redirect</strong>. This makes <em>yourdomain.com</em> redirect to <em>www.yourdomain.com</em>.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Wait and verify</p>
              <p className="text-xs text-gray-500 mt-1">DNS changes can take anywhere from a few minutes to 48 hours to spread across the internet. Once done, come back and click <strong>Check DNS</strong> — we'll confirm automatically and issue your SSL certificate.</p>
            </div>
          </div>

          {/* Registrar quick links */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Jump to DNS settings for popular providers</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'GoDaddy', url: 'https://dcc.godaddy.com/manage/dns' },
                { name: 'Namecheap', url: 'https://ap.www.namecheap.com/Domains/DomainControlPanel' },
                { name: 'Cloudflare', url: 'https://dash.cloudflare.com' },
                { name: 'Google Domains', url: 'https://domains.google.com' },
              ].map(p => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {p.name}
                  <ExternalLink size={11} className="text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Domain Search / Buy Modal ─────────────────────────────────────────────────

function BuyDomainModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function handleSearch() {
    const domain = query.trim().replace(/^https?:\/\//i, '').split('/')[0]
    if (!domain) return
    window.open(
      `https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=${encodeURIComponent(domain)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Find your domain</h2>
            <p className="text-xs text-gray-400 mt-0.5">Search and buy a domain from GoDaddy</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            A custom domain like <strong>myvilla.com</strong> looks more professional and builds trust with guests. Type what you'd like and we'll check if it's available.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. myvilla.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 transition-colors"
            >
              Search <ExternalLink size={13} />
            </button>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>Powered by GoDaddy — domains from ~$10/year</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className="ml-1.5 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DomainsPage() {
  const { activeOrg } = useAuthStore()
  const orgId  = activeOrg?.id   ?? ''
  const orgSlug = activeOrg?.slug ?? ''
  const qc     = useQueryClient()

  const [showForm, setShowForm]         = useState(false)
  const [showDnsHelp, setShowDnsHelp]   = useState(false)
  const [showBuyDomain, setShowBuyDomain] = useState(false)
  const [checkingDns, setCheckingDns]   = useState(false)

  const { data: verification, isLoading } = useQuery({
    queryKey: ['verification', orgId],
    queryFn:  () => verificationApi.getStatus(orgId),
    enabled:  !!orgId,
  })

  const schema = z.object({
    domain: z.string().min(4, 'Enter a valid domain')
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/, 'Invalid domain — no http:// or trailing slash'),
  })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const connectMut = useMutation({
    mutationFn: (data: { domain: string }) => verificationApi.connectDomain(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('Domain saved — add the CNAME record to activate it')
      setShowForm(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: () => verificationApi.deleteDomain(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('Custom domain removed')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove domain'),
  })

  async function checkDns() {
    setCheckingDns(true)
    try {
      const result = await verificationApi.checkDomainDns(orgId)
      if (result.verified) {
        toast.success('DNS verified! SSL is being provisioned.')
        qc.invalidateQueries({ queryKey: ['verification', orgId] })
      } else {
        toast.error(result.message || 'DNS not propagated yet — try again in a few hours')
      }
    } catch {
      toast.error('Check failed — please try again')
    } finally {
      setCheckingDns(false)
    }
  }

  const domainStep    = verification?.domainStep
  const customDomain  = domainStep?.data?.[0] ?? null
  const domainStatus  = domainStep?.status

  const propvianSubdomain = orgSlug ? `${orgSlug}.propvian.com` : null

  const statusBadge = (status?: string) => {
    if (status === 'APPROVED') return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle size={11} /> Active
      </span>
    )
    if (status === 'REJECTED') return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle size={11} /> Rejected
      </span>
    )
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <Clock size={11} /> Pending DNS
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Domain & Website URL</h1>
        <p className="text-gray-500 mt-1 text-sm">Choose how guests access your booking website</p>
      </div>

      {/* Free Propvian subdomain */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-primary-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Your free Propvian address</h2>
          </div>
          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> Ready
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">This link works immediately — no setup needed.</p>
        {propvianSubdomain ? (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <Globe size={15} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm font-mono font-medium text-gray-800 flex-1">{propvianSubdomain}</span>
            <CopyButton text={`https://${propvianSubdomain}`} />
            <a
              href={`https://${propvianSubdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              title="Open"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">Org slug not set</div>
        )}
      </div>

      {/* Custom domain */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Custom domain <span className="text-xs text-gray-400 font-normal">(optional)</span></h2>
          </div>
          {!customDomain && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Plus size={13} /> Connect domain
            </button>
          )}
          {customDomain && !showForm && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Remove this custom domain? Your Propvian subdomain will still work.')) {
                    deleteMut.mutate()
                  }
                }}
                disabled={deleteMut.isPending}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} /> {deleteMut.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Use your own domain like <em>myvilla.com</em> for a more professional look.{' '}
          <button onClick={() => setShowBuyDomain(true)} className="text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors">
            Don't have one? Find a domain →
          </button>
        </p>

        {!customDomain && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={15} /> Connect a custom domain
          </button>
        )}

        {customDomain && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Globe size={15} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{customDomain}</p>
              </div>
              {statusBadge(domainStatus)}
            </div>

            {domainStatus !== 'APPROVED' && (
              <button
                onClick={checkDns}
                disabled={checkingDns}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={checkingDns ? 'animate-spin' : ''} />
                {checkingDns ? 'Checking…' : 'Check DNS status'}
              </button>
            )}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit((d) => connectMut.mutate(d as any))} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your domain name</label>
              <input
                {...register('domain')}
                className="input-base text-sm w-full"
                placeholder="www.myvilla.com"
                autoFocus
              />
              {errors.domain && <p className="mt-1 text-xs text-red-500">{String(errors.domain.message)}</p>}
              <p className="mt-1 text-xs text-gray-400">Use <strong>www.yourdomain.com</strong> — e.g. www.beachvilla.com</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || connectMut.isPending}
                className="btn-primary py-2 px-4 text-sm"
              >
                {connectMut.isPending ? 'Saving…' : 'Save domain'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); reset() }}
                className="btn-secondary py-2 px-4 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* DNS setup card — only shown when custom domain is pending */}
      {customDomain && domainStatus !== 'APPROVED' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">DNS setup required</h2>
            <button
              onClick={() => setShowDnsHelp(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <HelpCircle size={13} />
              How do I do this?
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Add these 2 records at your domain registrar (GoDaddy, Namecheap, etc.) to activate your domain.
          </p>

          {/* DNS record table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 border-b border-gray-200">
              <span>Type</span>
              <span>Host / Name</span>
              <span>Value / Points to</span>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 items-center gap-2 border-b border-gray-100">
              <span className="font-bold text-blue-600 text-xs">CNAME</span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">www</code>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 break-all">{CNAME_TARGET}</code>
                <CopyButton text={CNAME_TARGET} />
              </div>
            </div>
            <div className="grid grid-cols-3 px-4 py-2.5 items-center gap-2">
              <span className="font-bold text-purple-600 text-xs">Redirect</span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">@</code>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 break-all">{customDomain}</code>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-gray-400">
            <Clock size={12} className="flex-shrink-0 mt-0.5" />
            <span>DNS changes take up to 48 hours. The <strong>Redirect</strong> is a forwarding rule, not a DNS record — GoDaddy calls it <strong>Forwarding</strong>, Namecheap calls it <strong>URL Redirect</strong>.</span>
          </div>

          <button
            onClick={() => setShowDnsHelp(true)}
            className="mt-4 w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-gray-600 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <span>Not sure how to add a DNS record? Click here for a step-by-step guide</span>
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showDnsHelp    && <DnsHelpModal onClose={() => setShowDnsHelp(false)} />}
      {showBuyDomain  && <BuyDomainModal onClose={() => setShowBuyDomain(false)} />}
    </div>
  )
}
