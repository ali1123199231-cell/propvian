import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LifeBuoy, ChevronLeft, Send, Loader2, CheckCheck, Building2,
} from 'lucide-react'
import { format, parseISO, isToday, isYesterday, differenceInMinutes } from 'date-fns'
import toast from 'react-hot-toast'
import { adminMessagesApi, type SupportTicket } from '@/api/messages'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const date = parseISO(iso)
  const mins = differenceInMinutes(new Date(), date)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

const STATUS_OPTS = [
  { value: 'OPEN',          label: 'Open',              cls: 'bg-blue-900/50 text-blue-400 border-blue-700' },
  { value: 'WAITING_REPLY', label: 'Waiting for Reply', cls: 'bg-amber-900/50 text-amber-400 border-amber-700' },
  { value: 'RESOLVED',      label: 'Resolved',          cls: 'bg-green-900/50 text-green-400 border-green-700' },
] as const

type StatusValue = typeof STATUS_OPTS[number]['value']

function statusCfg(status: string) {
  return STATUS_OPTS.find(s => s.value === status) ?? STATUS_OPTS[0]
}

const FILTER_TABS: { label: string; value: string | undefined }[] = [
  { label: 'All',             value: undefined },
  { label: 'Open',            value: 'OPEN' },
  { label: 'Waiting',         value: 'WAITING_REPLY' },
  { label: 'Resolved',        value: 'RESOLVED' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminSupportPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)
  const [reply, setReply]             = useState('')
  const [mobileView, setMobileView]   = useState<'list' | 'thread'>('list')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin-support-tickets', filterStatus],
    queryFn: () => adminMessagesApi.listAllTickets(0, 50, filterStatus),
    refetchInterval: 30_000,
  })

  const tickets = page?.content ?? []

  const replyMutation = useMutation({
    mutationFn: (body: string) => adminMessagesApi.replyToTicket(selectedId!, body),
    onSuccess: (updated) => {
      qc.setQueryData<typeof page>(['admin-support-tickets', filterStatus], prev =>
        prev ? { ...prev, content: prev.content.map(t => t.id === updated.id ? updated : t) } : prev
      )
      setReply('')
      toast.success('Reply sent')
    },
    onError: () => toast.error('Failed to send reply'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminMessagesApi.updateStatus(selectedId!, status),
    onSuccess: (updated) => {
      qc.setQueryData<typeof page>(['admin-support-tickets', filterStatus], prev =>
        prev ? { ...prev, content: prev.content.map(t => t.id === updated.id ? updated : t) } : prev
      )
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const selected = tickets.find(t => t.id === selectedId) ?? null

  const sendReply = () => {
    if (!reply.trim() || !selectedId || replyMutation.isPending) return
    replyMutation.mutate(reply.trim())
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedId, selected?.messages.length])

  const openCount = tickets.filter(t => t.status === 'OPEN').length

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <LifeBuoy size={20} className="text-amber-400" />
            Support Inbox
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoading ? 'Loading…' : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}${openCount > 0 ? ` · ${openCount} open` : ''}`}
          </p>
        </div>
      </div>

      {/* Main panel */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex h-[calc(100vh-14rem)] min-h-[500px]">

          {/* Left: ticket list */}
          <div className={`w-80 flex-shrink-0 border-r border-gray-700 flex flex-col ${mobileView === 'thread' ? 'hidden md:flex' : 'flex'}`}>
            {/* Filter tabs */}
            <div className="flex border-b border-gray-700 overflow-x-auto">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.label}
                  onClick={() => { setFilterStatus(tab.value); setSelectedId(null) }}
                  className={`flex-1 min-w-fit px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === tab.value
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Ticket list */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={20} className="animate-spin text-gray-600" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 p-4">
                  <LifeBuoy size={28} className="opacity-40" />
                  <p className="text-sm">No tickets</p>
                </div>
              ) : tickets.map(ticket => {
                const sc = statusCfg(ticket.status)
                return (
                  <button
                    key={ticket.id}
                    onClick={() => { setSelectedId(ticket.id); setMobileView('thread') }}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-800 hover:bg-gray-800/60 transition-colors ${
                      selectedId === ticket.id ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <LifeBuoy size={14} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{ticket.subject}</p>
                        {ticket.organizationName && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 size={10} /> {ticket.organizationName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${sc.cls}`}>
                            {sc.label}
                          </span>
                          <span className="text-xs text-gray-600">{relativeTime(ticket.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-1">{ticket.lastMessage ?? '—'}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: thread */}
          {selected ? (
            <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
              {/* Thread header */}
              <div className="px-5 py-3.5 border-b border-gray-700 flex items-center gap-3 flex-wrap">
                <button onClick={() => setMobileView('list')} className="md:hidden p-1 rounded hover:bg-gray-800 text-gray-500">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{selected.subject}</p>
                  {selected.organizationName && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Building2 size={11} /> {selected.organizationName}
                      {selected.organizationSlug && <span className="text-gray-600">· {selected.organizationSlug}</span>}
                    </p>
                  )}
                </div>

                {/* Status selector */}
                <select
                  value={selected.status}
                  onChange={e => statusMutation.mutate(e.target.value)}
                  disabled={statusMutation.isPending}
                  className="text-xs font-medium px-2 py-1.5 rounded-lg border bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer"
                  style={{
                    color: statusCfg(selected.status).cls.match(/text-(\w+-\d+)/)?.[0]?.replace('text-', 'var(--color-') ?? 'inherit',
                  }}
                >
                  {STATUS_OPTS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-gray-800 text-gray-200">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                {selected.messages.length === 0 ? (
                  <p className="text-center text-gray-600 text-sm mt-10">No messages yet</p>
                ) : selected.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'SUPPORT' ? 'justify-end' : 'justify-start'}`}>
                    {msg.senderType === 'HOST' && (
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Building2 size={12} className="text-gray-400" />
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.senderType === 'SUPPORT'
                        ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-br-sm'
                        : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.senderType === 'SUPPORT' && (
                        <p className="text-xs font-semibold text-amber-400 mb-1">Propvian Support (you)</p>
                      )}
                      {msg.senderType === 'HOST' && selected.organizationName && (
                        <p className="text-xs font-semibold text-gray-400 mb-1">{selected.organizationName}</p>
                      )}
                      <p className="leading-relaxed">{msg.body}</p>
                      <p className={`text-xs mt-1.5 ${msg.senderType === 'SUPPORT' ? 'text-amber-500/60' : 'text-gray-500'}`}>
                        {format(parseISO(msg.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box / resolved banner */}
              {selected.status === 'RESOLVED' ? (
                <div className="px-5 py-4 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <CheckCheck size={13} /> Ticket resolved
                  </p>
                  <button
                    onClick={() => statusMutation.mutate('OPEN')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    Reopen
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      placeholder="Reply as Propvian Support… (Enter to send)"
                      rows={2}
                      disabled={replyMutation.isPending}
                      className="flex-1 text-sm bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-500 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none disabled:opacity-50"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim() || replyMutation.isPending}
                      className="p-2.5 bg-amber-500 text-gray-900 rounded-xl hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      {replyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 px-1">
                    Reply appears as "Propvian Support" to the host. Sending changes status to <span className="text-amber-600">Waiting for Reply</span>.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center text-gray-600 gap-3">
              <LifeBuoy size={40} className="opacity-30" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Select a ticket</p>
                <p className="text-xs mt-0.5">Choose a support ticket to reply</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
