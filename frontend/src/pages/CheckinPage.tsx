import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Lock, Calendar, Wifi, FileText, Clock, Loader2, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { checkinApi } from '@/api/automation'

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-primary-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function formatDate(iso: string, timezone: string) {
  try {
    // Parse as UTC and format for display
    const date = new Date(iso)
    return format(date, 'd MMM yyyy · HH:mm')
  } catch {
    return iso
  }
}

export function CheckinPage() {
  const { code } = useParams<{ code: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['checkin', code],
    queryFn: () => checkinApi.getPage(code!),
    enabled: !!code,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-violet-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-violet-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={26} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Page not found</h2>
          <p className="text-sm text-gray-500">This check-in link is invalid or has expired. Contact your host for assistance.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-violet-50 py-8 px-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Lock size={22} className="text-white" />
          </div>
          <p className="text-xs font-semibold text-primary-500 tracking-widest uppercase mb-1">Propvian</p>
          <h1 className="text-2xl font-bold text-gray-900">{data.propertyName}</h1>
          {data.guestName && (
            <p className="text-sm text-gray-500 mt-1">Welcome, {data.guestName}</p>
          )}
        </div>

        {/* Door code card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-primary-600 to-violet-600 px-6 py-5 text-center">
            <p className="text-xs font-semibold text-primary-100 tracking-widest uppercase mb-2">Door Access Code</p>
            <div className="text-5xl font-bold tracking-[0.2em] text-white font-mono">{data.pin}</div>
            <p className="text-xs text-primary-200 mt-2">Enter this code on the keypad</p>
          </div>

          <div className="px-6 py-4">
            <InfoRow
              icon={Calendar}
              label="Check-in"
              value={formatDate(data.validFrom, data.timezone)}
            />
            <InfoRow
              icon={Clock}
              label="Check-out"
              value={formatDate(data.validTo, data.timezone)}
            />
          </div>
        </div>

        {/* Optional info */}
        {(data.wifiDetails || data.accessInstructions || data.lockNotes) && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div className="px-6 py-4 space-y-0">
              {data.wifiDetails && (
                <InfoRow icon={Wifi} label="WiFi" value={data.wifiDetails} />
              )}
              {data.accessInstructions && (
                <InfoRow icon={FileText} label="Access Instructions" value={data.accessInstructions} />
              )}
              {data.lockNotes && (
                <InfoRow icon={Lock} label="Lock Notes" value={data.lockNotes} />
              )}
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Your code is valid from check-in until 1 hour after check-out.
          <br />Do not share this code with others.
        </p>

        <p className="text-center text-xs text-gray-300 mt-6">Powered by Propvian</p>
      </div>
    </div>
  )
}
