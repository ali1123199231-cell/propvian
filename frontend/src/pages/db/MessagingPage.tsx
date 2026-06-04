import { useState, useRef, useEffect, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle, Search, Send, Plus, ChevronLeft,
  LifeBuoy, Inbox, X, CheckCheck, Loader2,
} from 'lucide-react'
import { format, parseISO, isToday, isYesterday, differenceInMinutes } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { messagesApi, type Conversation, type SupportTicket } from '@/api/messages'

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

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  OPEN:          { label: 'Open',              cls: 'bg-blue-100 text-blue-700' },
  WAITING_REPLY: { label: 'Waiting for Reply', cls: 'bg-amber-100 text-amber-700' },
  RESOLVED:      { label: 'Resolved',          cls: 'bg-green-100 text-green-700' },
}

// ─── Shared components ────────────────────────────────────────────────────────

function ReplyBox({ value, onChange, onSend, disabled, placeholder = 'Type a message… (Enter to send)' }: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          placeholder={placeholder}
          rows={2}
          disabled={disabled}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )
}

// ─── GuestMessagesSection ─────────────────────────────────────────────────────

function GuestMessagesSection({ orgId }: { orgId: string }) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter]         = useState<'all' | 'unread'>('all')
  const [search, setSearch]         = useState('')
  const [reply, setReply]           = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', orgId],
    queryFn: () => messagesApi.listConversations(orgId),
    refetchInterval: 30_000,
  })

  const replyMutation = useMutation({
    mutationFn: (body: string) => messagesApi.hostReply(orgId, selectedId!, body),
    onSuccess: (updated) => {
      qc.setQueryData<Conversation[]>(['conversations', orgId], prev =>
        prev ? prev.map(c => c.id === updated.id ? updated : c) : [updated]
      )
      setReply('')
    },
    onError: () => toast.error('Failed to send reply'),
  })

  const markReadMutation = useMutation({
    mutationFn: (convId: string) => messagesApi.markRead(orgId, convId),
    onSuccess: (_, convId) => {
      qc.setQueryData<Conversation[]>(['conversations', orgId], prev =>
        prev ? prev.map(c => c.id === convId ? { ...c, unreadHostCount: 0 } : c) : prev ?? []
      )
    },
  })

  const selected    = conversations.find(c => c.id === selectedId) ?? null
  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadHostCount, 0)

  const filtered = conversations.filter(c => {
    if (filter === 'unread' && c.unreadHostCount === 0) return false
    if (search) {
      const q = search.toLowerCase()
      return c.guestName.toLowerCase().includes(q) || (c.propertyName ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const selectConversation = (id: string) => {
    setSelectedId(id)
    setMobileView('thread')
    const conv = conversations.find(c => c.id === id)
    if (conv && conv.unreadHostCount > 0) {
      markReadMutation.mutate(id)
    }
  }

  const sendReply = () => {
    if (!reply.trim() || !selectedId || replyMutation.isPending) return
    replyMutation.mutate(reply.trim())
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedId, selected?.messages.length])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <MessageCircle size={16} className="text-primary-500" />
        <h2 className="font-semibold text-gray-900 flex-1">Guest Messages</h2>
        {unreadCount > 0 && (
          <span className="bg-primary-600 text-white text-xs font-medium rounded-full px-2 py-0.5">
            {unreadCount} unread
          </span>
        )}
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guests…"
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-44"
          />
        </div>
      </div>

      <div className="flex h-[480px]">
        {/* Conversation list */}
        <div className={`w-72 flex-shrink-0 border-r border-gray-100 flex flex-col ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="flex border-b border-gray-100">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  filter === f ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={20} className="animate-spin text-gray-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4">
                <Inbox size={28} className="opacity-30" />
                <p className="text-sm text-center">
                  {filter === 'unread' ? 'No unread messages' : 'No guest messages yet'}
                </p>
              </div>
            ) : filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedId === conv.id ? 'bg-primary-50' : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0">
                    {conv.guestName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm truncate ${conv.unreadHostCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {conv.guestName}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{relativeTime(conv.lastMessageAt)}</span>
                    </div>
                    {conv.propertyName && <p className="text-xs text-gray-400 truncate">{conv.propertyName}</p>}
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadHostCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {conv.lastMessage ?? '—'}
                    </p>
                  </div>
                  {conv.unreadHostCount > 0 && <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread or empty state */}
        {selected ? (
          <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <button onClick={() => setMobileView('list')} className="sm:hidden p-1 rounded-md hover:bg-gray-100 text-gray-500">
                <ChevronLeft size={16} />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0">
                {selected.guestName[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selected.guestName}</p>
                <p className="text-xs text-gray-400">{selected.propertyName ?? selected.guestEmail}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              {selected.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderType === 'HOST' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.senderType === 'HOST'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.body}</p>
                    <p className={`text-xs mt-1.5 ${msg.senderType === 'HOST' ? 'text-primary-200' : 'text-gray-400'}`}>
                      {format(parseISO(msg.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <ReplyBox
              value={reply}
              onChange={setReply}
              onSend={sendReply}
              disabled={replyMutation.isPending}
            />
          </div>
        ) : (
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageCircle size={40} className="opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs mt-0.5">Choose a guest message to view the thread</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── NewSupportTicketModal ────────────────────────────────────────────────────

function NewSupportTicketModal({ onClose, onSubmit, isPending }: {
  onClose: () => void
  onSubmit: (subject: string, body: string) => void
  isPending: boolean
}) {
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')

  const handle = (e: FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    onSubmit(subject.trim(), body.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <LifeBuoy size={16} className="text-primary-500" />
            <h2 className="text-base font-semibold text-gray-900">Contact Support</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="input-base text-sm"
              placeholder="What can we help you with?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              className="input-base text-sm resize-none"
              placeholder="Describe your issue in detail…"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button
              type="submit"
              disabled={!subject.trim() || !body.trim() || isPending}
              className="btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── SupportMessagesSection ───────────────────────────────────────────────────

function SupportMessagesSection({ orgId }: { orgId: string }) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply]           = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', orgId],
    queryFn: () => messagesApi.listTickets(orgId),
    refetchInterval: 60_000,
  })

  const createMutation = useMutation({
    mutationFn: ({ subject, body }: { subject: string; body: string }) =>
      messagesApi.createTicket(orgId, subject, body),
    onSuccess: (ticket) => {
      qc.setQueryData<SupportTicket[]>(['support-tickets', orgId], prev => [ticket, ...(prev ?? [])])
      setSelectedId(ticket.id)
      setMobileView('thread')
      setShowModal(false)
      toast.success('Support ticket created')
    },
    onError: () => toast.error('Failed to create ticket'),
  })

  const replyMutation = useMutation({
    mutationFn: (body: string) => messagesApi.replyToTicket(orgId, selectedId!, body),
    onSuccess: (updated) => {
      qc.setQueryData<SupportTicket[]>(['support-tickets', orgId], prev =>
        prev ? prev.map(t => t.id === updated.id ? updated : t) : [updated]
      )
      setReply('')
    },
    onError: () => toast.error('Failed to send reply'),
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

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <LifeBuoy size={16} className="text-primary-500" />
          <h2 className="font-semibold text-gray-900 flex-1">Support Messages</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Contact Support
          </button>
        </div>

        <div className="flex h-[480px]">
          {/* Ticket list */}
          <div className={`w-72 flex-shrink-0 border-r border-gray-100 flex flex-col ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={20} className="animate-spin text-gray-300" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4">
                  <LifeBuoy size={28} className="opacity-30" />
                  <p className="text-sm text-center">No support tickets yet</p>
                  <button onClick={() => setShowModal(true)} className="text-xs text-primary-600 hover:underline mt-1">
                    Contact Support
                  </button>
                </div>
              ) : tickets.map(ticket => {
                const sc = STATUS_CFG[ticket.status] ?? STATUS_CFG.OPEN
                return (
                  <button
                    key={ticket.id}
                    onClick={() => { setSelectedId(ticket.id); setMobileView('thread') }}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedId === ticket.id ? 'bg-primary-50' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <LifeBuoy size={15} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${sc.cls}`}>{sc.label}</span>
                          <span className="text-xs text-gray-400">{relativeTime(ticket.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-1">{ticket.lastMessage ?? '—'}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Thread or empty state */}
          {selected ? (
            <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setMobileView('list')} className="sm:hidden p-1 rounded-md hover:bg-gray-100 text-gray-500">
                  <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-semibold text-gray-900 flex-1 truncate">{selected.subject}</p>
                {STATUS_CFG[selected.status] && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${STATUS_CFG[selected.status].cls}`}>
                    {STATUS_CFG[selected.status].label}
                  </span>
                )}
              </div>

              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                {selected.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'HOST' ? 'justify-end' : 'justify-start'}`}>
                    {msg.senderType === 'SUPPORT' && (
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <LifeBuoy size={13} className="text-purple-600" />
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.senderType === 'HOST'
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-purple-50 text-gray-800 border border-purple-100 rounded-bl-sm'
                    }`}>
                      {msg.senderType === 'SUPPORT' && (
                        <p className="text-xs font-semibold text-purple-600 mb-1">Propvian Support</p>
                      )}
                      <p className="leading-relaxed">{msg.body}</p>
                      <p className={`text-xs mt-1.5 ${msg.senderType === 'HOST' ? 'text-primary-200' : 'text-gray-400'}`}>
                        {format(parseISO(msg.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selected.status === 'RESOLVED' ? (
                <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 text-center">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                    <CheckCheck size={13} /> This ticket has been resolved
                  </p>
                </div>
              ) : (
                <ReplyBox
                  value={reply}
                  onChange={setReply}
                  onSend={sendReply}
                  disabled={replyMutation.isPending}
                  placeholder="Type a reply… (Enter to send)"
                />
              )}
            </div>
          ) : (
            <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-gray-400 gap-3">
              <LifeBuoy size={40} className="opacity-20" />
              <div className="text-center">
                <p className="text-sm font-medium">Select a ticket</p>
                <p className="text-xs mt-0.5">Choose a support ticket to view the thread</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewSupportTicketModal
          onClose={() => setShowModal(false)}
          onSubmit={(subject, body) => createMutation.mutate({ subject, body })}
          isPending={createMutation.isPending}
        />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MessagingPage() {
  const { activeOrg } = useAuthStore()

  if (!activeOrg) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messaging</h1>
        <p className="text-gray-500 mt-1">Guest conversations and support tickets</p>
      </div>
      <GuestMessagesSection orgId={activeOrg.id} />
      <SupportMessagesSection orgId={activeOrg.id} />
    </div>
  )
}
