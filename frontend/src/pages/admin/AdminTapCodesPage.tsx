import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CreditCard, Download, Loader2, Printer, QrCode } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { adminTapCodesApi } from '@/api/guestPages'
import type { TapCodeBatch } from '@/types/guestPage'

function pct(part: number, whole: number) {
  return whole ? `${Math.round((part / whole) * 100)}%` : '–'
}

/** One row per code, ready for a print shop or an NFC encoding run. */
async function downloadCsv(label: string) {
  const batch = await adminTapCodesApi.batch(label)
  const rows = [['code', 'qr_url', 'nfc_url', 'claimed_at'], ...(batch.codes ?? []).map((c) => [c.code, c.qrUrl, c.nfcUrl, c.claimedAt ?? ''])]
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `tap-codes-${label}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/*
 * Pre-printed codes for physical stands and cards. The funnel is the point:
 * each batch shows how many units reached a rental (scanned) and how many
 * turned into a host who linked one (claimed).
 */
export function AdminTapCodesPage() {
  const qc = useQueryClient()
  const [label, setLabel] = useState(`stands-${format(new Date(), 'yyyy-MM')}`)
  const [count, setCount] = useState(20)

  const { data: batches = [], isLoading } = useQuery({ queryKey: ['tap-code-batches'], queryFn: adminTapCodesApi.batches })

  const generate = useMutation({
    mutationFn: () => adminTapCodesApi.generate(count, label.trim()),
    onSuccess: (b: TapCodeBatch) => {
      qc.invalidateQueries({ queryKey: ['tap-code-batches'] })
      toast.success(`${b.issued} codes created in ${b.batchLabel}`)
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Could not create the batch'),
  })

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-100">Stands &amp; codes</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">
        Codes to print on physical stands and cards. A buyer taps an unclaimed code, signs up and links it to a
        property; every step shows up in the funnel below.
      </p>

      <form className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-gray-700 bg-gray-800 p-5"
            onSubmit={(e) => { e.preventDefault(); generate.mutate() }}>
        <label>
          <span className="mb-1 block text-xs font-medium text-gray-400">Batch label</span>
          <input className="w-56 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100" value={label}
                 maxLength={100} pattern="[A-Za-z0-9 _.\-]+" onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-gray-400">How many</span>
          <input type="number" min={1} max={1000} className="w-28 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100"
                 value={count} onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))} />
        </label>
        <button type="submit" disabled={generate.isPending || !label.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-50">
          {generate.isPending ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />} Create codes
        </button>
      </form>

      {isLoading ? (
        <Loader2 className="animate-spin text-gray-500" />
      ) : batches.length === 0 ? (
        <p className="text-sm text-gray-400">No batches yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm text-gray-200">
            <thead className="bg-gray-800 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Issued</th>
                <th className="px-4 py-3 text-right font-medium">Scanned</th>
                <th className="px-4 py-3 text-right font-medium">Claimed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.batchLabel} className="border-t border-gray-700">
                  <td className="px-4 py-3 font-mono">{b.batchLabel}</td>
                  <td className="px-4 py-3 text-gray-400">{b.createdAt ? format(parseISO(b.createdAt), 'd MMM yyyy') : ''}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.issued}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.scanned} <span className="text-gray-500">({pct(b.scanned, b.issued)})</span></td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.claimed} <span className="text-gray-500">({pct(b.claimed, b.issued)})</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => downloadCsv(b.batchLabel)} title="Download CSV"
                              className="rounded-lg border border-gray-600 p-2 text-gray-300 hover:bg-gray-700"><Download size={14} /></button>
                      <a href={`/print/tap-codes/${encodeURIComponent(b.batchLabel)}`} target="_blank" rel="noopener noreferrer" title="Print sticker sheet"
                         className="rounded-lg border border-gray-600 p-2 text-gray-300 hover:bg-gray-700"><Printer size={14} /></a>
                      <a href={`/print/tap-codes/${encodeURIComponent(b.batchLabel)}?layout=cards`} target="_blank" rel="noopener noreferrer" title="Print A6 stand cards"
                         className="rounded-lg border border-gray-600 p-2 text-gray-300 hover:bg-gray-700"><CreditCard size={14} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
