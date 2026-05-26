import { Bell, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function TopBar({ title, action }: TopBarProps) {
  const navigate = useNavigate()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  })

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
          )}
        </button>

        {/* Primary action */}
        {action && (
          <button onClick={action.onClick} className="btn-primary">
            <Plus size={16} />
            {action.label}
          </button>
        )}
      </div>
    </header>
  )
}
