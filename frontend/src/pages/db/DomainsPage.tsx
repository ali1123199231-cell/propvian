import { useState } from 'react'
import { Globe, CheckCircle, Clock, XCircle, Plus, Info } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { verificationApi } from '@/api/verification'
import { useAuthStore } from '@/store/authStore'

export function DomainsPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id ?? ''
  const qc    = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: verification, isLoading } = useQuery({
    queryKey: ['verification', orgId],
    queryFn:  () => verificationApi.getStatus(orgId),
    enabled:  !!orgId,
  })

  const schema = z.object({
    domain: z.string().min(4, 'Enter a valid domain')
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9]$/, 'Invalid domain'),
  })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const connectMut = useMutation({
    mutationFn: (data: { domain: string }) => verificationApi.connectDomain(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification', orgId] })
      toast.success('Domain submitted for DNS validation')
      setShowForm(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const domainStep = verification?.domainStep
  const customDomain = domainStep?.data?.[0] ?? null

  const sslIcon = (status?: string) => {
    if (status === 'APPROVED') return <CheckCircle size={14} className="text-green-500" />
    if (status === 'REJECTED') return <XCircle size={14} className="text-red-500" />
    return <Clock size={14} className="text-amber-500" />
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Domain Connection</h1>
        <p className="text-gray-500 mt-1">Connect your custom domain to your booking website</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 space-y-1">
          <p className="font-medium">How to connect your domain</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-600">
            <li>Add your domain below</li>
            <li>At your DNS provider, add a CNAME: <code className="bg-blue-100 px-1 rounded">booking.propvian.com</code></li>
            <li>DNS propagation takes up to 48 hours</li>
            <li>SSL is auto-provisioned once DNS is validated</li>
          </ol>
        </div>
      </div>

      {/* Current domain */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Your Domain</h2>
          {!customDomain && (
            <button onClick={() => setShowForm(true)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
              <Plus size={12} /> Add domain
            </button>
          )}
        </div>

        {!customDomain ? (
          <div className="text-center py-8 text-gray-400">
            <Globe size={28} className="mb-2 mx-auto opacity-30" />
            <p className="text-sm">No custom domain connected</p>
            <p className="text-xs mt-1">Currently using <code className="bg-gray-100 px-1.5 rounded">propvian.com/host/{activeOrg?.slug}</code></p>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <Globe size={18} className="text-primary-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{customDomain}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                {sslIcon(domainStep?.status)} {domainStep?.status?.toLowerCase() ?? 'pending'}
              </p>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit((d) => connectMut.mutate(d as any))} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Domain name</label>
              <input {...register('domain')} className="input-base text-sm" placeholder="myvilla.com" />
              {errors.domain && <p className="mt-1 text-xs text-red-500">{String(errors.domain.message)}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isSubmitting || connectMut.isPending}
                className="btn-primary py-2 px-4 text-sm">
                {connectMut.isPending ? 'Submitting…' : 'Connect domain'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset() }}
                className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* DNS records */}
      {customDomain && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Required DNS Record</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 text-left font-semibold">Type</th>
                <th className="pb-2 text-left font-semibold">Host</th>
                <th className="pb-2 text-left font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-gray-700">CNAME</td>
                <td className="py-2 text-gray-700">@ or www</td>
                <td className="py-2 font-mono text-xs bg-gray-50 px-2 rounded">booking.propvian.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
