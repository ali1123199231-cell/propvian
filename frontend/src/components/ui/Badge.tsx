import clsx from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('badge', variantStyles[variant], className)}>
      {children}
    </span>
  )
}

export function ReservationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    CONFIRMED: { label: 'Confirmed', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'error' },
    CHECKED_IN: { label: 'Checked In', variant: 'info' },
    CHECKED_OUT: { label: 'Checked Out', variant: 'default' },
    NO_SHOW: { label: 'No Show', variant: 'warning' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={variant}>{label}</Badge>
}

export function LockStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    CONNECTED: { label: 'Connected', variant: 'success' },
    DISCONNECTED: { label: 'Disconnected', variant: 'default' },
    ERROR: { label: 'Error', variant: 'error' },
    SYNCING: { label: 'Syncing', variant: 'info' },
  }
  const { label, variant } = config[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={variant}>{label}</Badge>
}

export function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    AIRBNB: { label: 'Airbnb', variant: 'error' },
    BOOKING: { label: 'Booking.com', variant: 'info' },
    VRBO: { label: 'VRBO', variant: 'purple' },
    MANUAL: { label: 'Manual', variant: 'default' },
    OTHER: { label: 'Other', variant: 'default' },
  }
  const { label, variant } = config[source] ?? { label: source, variant: 'default' as BadgeVariant }
  return <Badge variant={variant}>{label}</Badge>
}
