import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, type AdminErrorLog } from '@/api/admin'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

function HttpStatusBadge({ code }: { code: number }) {
  const color = code >= 500 ? 'text-red-400 bg-red-900/30 border-red-700/40'
    : code >= 400 ? 'text-amber-400 bg-amber-900/30 border-amber-700/40'
    : 'text-green-400 bg-green-900/30 border-green-700/40'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium border ${color}`}>
      {code}
    </span>
  )
}

function ErrorRow({ log }: { log: AdminErrorLog }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="border-b border-gray-700 hover:bg-gray-800/50">
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString()}
        </td>
        <td className="px-4 py-3"><HttpStatusBadge code={log.httpStatus} /></td>
        <td className="px-4 py-3 text-xs font-mono text-gray-400 max-w-[200px] truncate">
          {log.requestPath ?? '—'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-300 max-w-[280px] truncate">
          {log.message ?? '—'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {log.userEmail ?? '—'}
        </td>
        <td className="px-4 py-3">
          {log.stackTrace && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && log.stackTrace && (
        <tr className="border-b border-gray-700 bg-gray-900/50">
          <td colSpan={6} className="px-6 py-3">
            <pre className="text-xs text-red-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-64">
              {log.stackTrace}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

export function AdminErrorLogsPage() {
  const [page, setPage] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-errors', page],
    queryFn: () => adminApi.listErrors(page, 50),
    refetchInterval: 30_000,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Error Logs</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {data ? `${data.totalElements} total errors` : ''} · Auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Path</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Message</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : data?.content.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500">No errors — all good!</td></tr>
            ) : data?.content.map(log => (
              <ErrorRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page + 1} of {data.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={data.first} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
            <button disabled={data.last}  onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
