import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { apiClient } from '@/api/client'
import type { PageResponse } from '@/types'

interface AuditLog {
  id: string
  actorEmail: string
  action: string
  entityType: string
  entityId: string
  success: boolean
  ipAddress?: string
  createdAt: string
}

async function getAuditLogs(orgId: string, page: number): Promise<PageResponse<AuditLog>> {
  const res = await apiClient.get(`/organizations/${orgId}/audit-logs?page=${page}&size=25`)
  return res.data.data
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-emerald-700 bg-emerald-50',
  UPDATE: 'text-blue-700 bg-blue-50',
  DELETE: 'text-red-700 bg-red-50',
  LOGIN: 'text-primary-700 bg-primary-50',
  LOGOUT: 'text-gray-600 bg-gray-100',
  CANCEL: 'text-amber-700 bg-amber-50',
  SYNC: 'text-cyan-700 bg-cyan-50',
}

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action.startsWith(k))
  return key ? ACTION_COLORS[key] : 'text-gray-600 bg-gray-100'
}

export function AuditLogsPage() {
  const { activeOrg } = useAuthStore()
  const orgId = activeOrg?.id
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', orgId, page],
    queryFn: () => getAuditLogs(orgId!, page),
    enabled: !!orgId,
  })

  const logs = data?.content ?? []

  return (
    <div>
      <TopBar title="Audit Logs" />
      <div className="p-6">
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Activity Log</h3>
            <p className="text-sm text-gray-500 mt-0.5">All actions performed within your organization</p>
          </div>
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={8} /></div>
          ) : logs.length === 0 ? (
            <EmptyState icon={BookOpen} title="No audit logs" description="Activity will appear here as team members take actions." />
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <div className={`text-xs font-mono px-2 py-0.5 rounded ${actionColor(log.action)}`}>
                    {log.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium truncate">{log.actorEmail}</span>
                      <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500 truncate">{log.entityType}</span>
                    </div>
                    {log.ipAddress && <p className="text-xs text-gray-400">{log.ipAddress}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${log.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {log.success ? 'OK' : 'FAIL'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(parseISO(log.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page + 1} of {data?.totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1) - 1} className="btn-secondary disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
