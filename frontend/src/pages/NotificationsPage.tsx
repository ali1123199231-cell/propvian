import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { notificationsApi } from '@/api/notifications'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import type { Notification } from '@/types'

const TYPE_ICONS: Record<string, React.ElementType> = {
  ACCESS_CODE_CREATED: CheckCircle,
  ACCESS_CODE_FAILED: AlertCircle,
  RESERVATION_CREATED: Info,
  RESERVATION_CANCELLED: AlertTriangle,
  RESERVATION_CHECKED_OUT: CheckCircle,
  LOCK_DISCONNECTED: AlertCircle,
  LOCK_BATTERY_LOW: AlertTriangle,
  SYNC_FAILED: AlertCircle,
  SYNC_COMPLETED: CheckCircle,
  CLEANER_TASK_ASSIGNED: Info,
  MEMBER_INVITED: Info,
  SUBSCRIPTION_EXPIRING: AlertTriangle,
  PAYMENT_FAILED: AlertCircle,
}

const TYPE_COLORS: Record<string, string> = {
  ACCESS_CODE_CREATED: 'text-emerald-500',
  ACCESS_CODE_FAILED: 'text-red-500',
  RESERVATION_CREATED: 'text-blue-500',
  RESERVATION_CANCELLED: 'text-amber-500',
  RESERVATION_CHECKED_OUT: 'text-emerald-500',
  LOCK_DISCONNECTED: 'text-red-500',
  LOCK_BATTERY_LOW: 'text-amber-500',
  SYNC_FAILED: 'text-red-500',
  SYNC_COMPLETED: 'text-emerald-500',
  CLEANER_TASK_ASSIGNED: 'text-blue-500',
  MEMBER_INVITED: 'text-primary-600',
  SUBSCRIPTION_EXPIRING: 'text-amber-500',
  PAYMENT_FAILED: 'text-red-500',
}

function NotificationItem({ n, onRead }: { n: Notification; onRead: () => void }) {
  const Icon = TYPE_ICONS[n.type] ?? Info
  const color = TYPE_COLORS[n.type] ?? 'text-gray-400'

  return (
    <div
      className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.readAt ? 'bg-blue-50/40' : ''}`}
      onClick={onRead}
    >
      <div className={`mt-0.5 flex-shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${n.readAt ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!n.readAt && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(0, 30),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      toast.success('All notifications marked as read')
    },
  })

  const notifications: Notification[] = data?.content ?? []
  const unreadCount = notifications.filter(n => !n.readAt).length

  return (
    <div>
      <TopBar title="Notifications" />
      <div className="p-6">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">All Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={6} /></div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You'll see alerts here for access codes, sync status, and more."
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onRead={() => !n.readAt && markReadMutation.mutate(n.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
