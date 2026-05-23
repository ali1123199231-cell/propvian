import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, CheckCircle, Clock, Play, SkipForward } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { cleanerTasksApi } from '@/api/cleanerTasks'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import type { CleanerTask } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10',
  IN_PROGRESS: 'text-blue-400 bg-blue-500/10',
  COMPLETED: 'text-emerald-400 bg-emerald-500/10',
  SKIPPED: 'text-slate-400 bg-slate-700',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle,
  SKIPPED: SkipForward,
}

function TaskRow({ task, onAction }: { task: CleanerTask; onAction: (task: CleanerTask) => void }) {
  const Icon = STATUS_ICONS[task.status] ?? Clock

  return (
    <tr
      className="hover:bg-slate-800/30 cursor-pointer transition-colors"
      onClick={() => onAction(task)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
            <Icon size={12} />
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {task.scheduledAt ? format(parseISO(task.scheduledAt as unknown as string), 'MMM d, yyyy HH:mm') : '—'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-400">
        {task.assignedUserId ? (
          <span className="text-slate-300">Assigned</span>
        ) : (
          <span className="text-slate-600">Unassigned</span>
        )}
      </td>
      <td className="px-6 py-4 text-xs text-slate-500">
        {task.checklist?.length ? `${task.checklist.length} items` : '—'}
      </td>
      <td className="px-6 py-4 text-xs text-slate-600">
        {task.completedAt ? format(parseISO(task.completedAt as unknown as string), 'MMM d, HH:mm') : '—'}
      </td>
    </tr>
  )
}

export function CleanerTasksPage() {
  const { activeOrg } = useAuthStore()
  const queryClient = useQueryClient()
  const orgId = activeOrg?.id
  const [page, setPage] = useState(0)
  const [selectedTask, setSelectedTask] = useState<CleanerTask | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cleaner-tasks', orgId, page],
    queryFn: () => cleanerTasksApi.listByOrg(orgId!, page, 20),
    enabled: !!orgId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      cleanerTasksApi.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaner-tasks', orgId] })
      toast.success('Task updated')
      setSelectedTask(null)
    },
  })

  const tasks = data?.content ?? []

  return (
    <div>
      <TopBar title="Cleaner Tasks" />
      <div className="p-6 space-y-4">
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={5} /></div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No cleaner tasks"
              description="Tasks are created automatically after a guest checks out."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Scheduled</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Assigned To</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Checklist</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tasks.map(task => (
                  <TaskRow key={task.id} task={task} onAction={setSelectedTask} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">Page {page + 1} of {data?.totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.totalPages ?? 1) - 1}
              className="btn-secondary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Cleaner Task" size="md">
        {selectedTask && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[selectedTask.status]}`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Scheduled</p>
                <p className="text-slate-200">
                  {selectedTask.scheduledAt
                    ? format(parseISO(selectedTask.scheduledAt as unknown as string), 'MMM d, yyyy HH:mm')
                    : '—'}
                </p>
              </div>
            </div>

            {selectedTask.checklist && selectedTask.checklist.length > 0 && (
              <div>
                <p className="text-sm text-slate-500 mb-2">Checklist</p>
                <ul className="space-y-1.5">
                  {selectedTask.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-4 h-4 rounded border border-slate-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTask.notes && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{selectedTask.notes}</p>
              </div>
            )}

            {selectedTask.status !== 'COMPLETED' && selectedTask.status !== 'SKIPPED' && (
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                {selectedTask.status === 'PENDING' && (
                  <button
                    onClick={() => updateMutation.mutate({ taskId: selectedTask.id, status: 'IN_PROGRESS' })}
                    disabled={updateMutation.isPending}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Play size={14} />
                    Start Task
                  </button>
                )}
                <button
                  onClick={() => updateMutation.mutate({ taskId: selectedTask.id, status: 'COMPLETED' })}
                  disabled={updateMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle size={14} />
                  {updateMutation.isPending ? 'Saving...' : 'Mark Complete'}
                </button>
                <button
                  onClick={() => updateMutation.mutate({ taskId: selectedTask.id, status: 'SKIPPED' })}
                  disabled={updateMutation.isPending}
                  className="btn-secondary flex items-center gap-2 ml-auto text-slate-500"
                >
                  <SkipForward size={14} />
                  Skip
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
