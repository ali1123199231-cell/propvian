import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { publicMessagesApi } from '@/api/messages'

export default function GuestConversationPage() {
  const { token } = useParams<{ token: string }>()
  const qc = useQueryClient()
  const [reply, setReply] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: conv, isLoading, isError } = useQuery({
    queryKey: ['guest-conversation', token],
    queryFn: () => publicMessagesApi.guestViewConversation(token!),
    enabled: !!token,
    refetchInterval: 15_000,
  })

  const sendMut = useMutation({
    mutationFn: () => publicMessagesApi.guestReply(token!, reply.trim()),
    onSuccess: () => {
      setReply('')
      qc.invalidateQueries({ queryKey: ['guest-conversation', token] })
    },
    onError: () => toast.error('Failed to send message. Please try again.'),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages?.length])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-amber-500" />
      </div>
    )
  }

  if (isError || !conv) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <MessageCircle size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">Conversation not found</p>
          <p className="text-gray-500 text-sm mt-1">This link may have expired or is invalid.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{conv.propertyName ?? 'Your Booking'}</p>
              <p className="text-gray-400 text-xs">Conversation with your host</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {conv.messages.map((msg) => {
            const isGuest = msg.senderType === 'GUEST'
            return (
              <div key={msg.id} className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isGuest
                    ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100'
                    : 'bg-gray-800 border border-gray-700 text-gray-200'
                }`}>
                  <p className={`text-[10px] font-medium mb-1 ${isGuest ? 'text-amber-400' : 'text-gray-400'}`}>
                    {isGuest ? 'You' : 'Host'}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className={`text-[10px] mt-1.5 ${isGuest ? 'text-amber-400/60' : 'text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Reply box */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); if (reply.trim()) sendMut.mutate() }}
            className="flex gap-2 items-end"
          >
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (reply.trim()) sendMut.mutate() } }}
              placeholder="Reply to your host…"
              rows={2}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
            />
            <button
              type="submit"
              disabled={!reply.trim() || sendMut.isPending}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {sendMut.isPending
                ? <Loader2 size={16} className="animate-spin text-white" />
                : <Send size={16} className="text-white" />}
            </button>
          </form>
          <p className="text-xs text-gray-600 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
      <div className="py-3 text-center border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Powered by{' '}
          <a href="https://propvian.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">Propvian</a>
          {' · '}
          <a href="/legal/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
