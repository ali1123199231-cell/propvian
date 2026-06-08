import axios from 'axios'
import { apiClient } from './client'
import { logger, shortId, maskEmail, maskName } from '@/lib/logger'

const log = logger.child('SYSTEM')

const publicClient = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export interface ConversationMessage {
  id: string
  senderType: 'GUEST' | 'HOST'
  body: string
  readAt?: string
  createdAt: string
}

export interface Conversation {
  id: string
  organizationId: string
  propertyId?: string
  propertyName?: string
  directBookingId?: string
  guestName: string
  guestEmail: string
  guestAccessToken: string
  unreadHostCount: number
  lastMessage?: string
  lastMessageAt: string
  messages: ConversationMessage[]
  createdAt: string
}

export interface SupportMessage {
  id: string
  senderType: 'HOST' | 'SUPPORT'
  body: string
  createdAt: string
}

export interface SupportTicket {
  id: string
  organizationId: string
  organizationName?: string
  organizationSlug?: string
  subject: string
  status: 'OPEN' | 'WAITING_REPLY' | 'RESOLVED'
  lastMessage?: string
  lastMessageAt: string
  messages: SupportMessage[]
  createdAt: string
}

export const messagesApi = {
  listConversations: (orgId: string) => {
    log.debug('messages.listConversations — org=%s', shortId(orgId))
    return apiClient.get<{ data: Conversation[] }>(`/organizations/${orgId}/conversations`).then(r => {
      log.debug('messages.listConversations — got %d conversations', r.data.data?.length)
      return r.data.data
    })
  },

  getConversation: (orgId: string, convId: string) => {
    log.debug('messages.getConversation — conv=%s', shortId(convId))
    return apiClient.get<{ data: Conversation }>(`/organizations/${orgId}/conversations/${convId}`).then(r => {
      log.debug('messages.getConversation — %d messages unreadHost=%d',
        r.data.data?.messages?.length, r.data.data?.unreadHostCount)
      return r.data.data
    })
  },

  hostReply: (orgId: string, convId: string, body: string) => {
    log.info('messages.hostReply — conv=%s bodyLen=%d', shortId(convId), body.length)
    return apiClient.post<{ data: Conversation }>(`/organizations/${orgId}/conversations/${convId}/reply`, { body }).then(r => {
      log.info('messages.hostReply — sent')
      return r.data.data
    })
  },

  markRead: (orgId: string, convId: string) => {
    log.debug('messages.markRead — conv=%s', shortId(convId))
    return apiClient.put(`/organizations/${orgId}/conversations/${convId}/read`)
  },

  listTickets: (orgId: string) => {
    log.debug('messages.listTickets — org=%s', shortId(orgId))
    return apiClient.get<{ data: SupportTicket[] }>(`/organizations/${orgId}/support/tickets`).then(r => {
      log.debug('messages.listTickets — got %d tickets', r.data.data?.length)
      return r.data.data
    })
  },

  createTicket: (orgId: string, subject: string, body: string) => {
    log.info('messages.createTicket — org=%s subject=%s', shortId(orgId), subject)
    return apiClient.post<{ data: SupportTicket }>(`/organizations/${orgId}/support/tickets`, { subject, body }).then(r => {
      log.info('messages.createTicket — ticketId=%s', shortId(r.data.data?.id))
      return r.data.data
    })
  },

  replyToTicket: (orgId: string, ticketId: string, body: string) => {
    log.info('messages.replyToTicket — ticket=%s bodyLen=%d', shortId(ticketId), body.length)
    return apiClient.post<{ data: SupportTicket }>(`/organizations/${orgId}/support/tickets/${ticketId}/reply`, { body }).then(r => {
      log.info('messages.replyToTicket — sent')
      return r.data.data
    })
  },
}

export const adminMessagesApi = {
  listAllTickets: (page = 0, size = 30, status?: string) => {
    log.debug('admin.messages.listAllTickets — page=%d status=%s', page, status)
    return apiClient.get<{ data: { content: SupportTicket[]; totalElements: number; totalPages: number; number: number } }>(
      `/admin/support/tickets`, { params: { page, size, ...(status ? { status } : {}) } }
    ).then(r => {
      log.debug('admin.messages.listAllTickets — got %d of %d', r.data.data.content.length, r.data.data.totalElements)
      return r.data.data
    })
  },

  getTicket: (ticketId: string) => {
    log.debug('admin.messages.getTicket — ticket=%s', shortId(ticketId))
    return apiClient.get<{ data: SupportTicket }>(`/admin/support/tickets/${ticketId}`).then(r => r.data.data)
  },

  replyToTicket: (ticketId: string, body: string) => {
    log.info('admin.messages.replyToTicket — ticket=%s', shortId(ticketId))
    return apiClient.post<{ data: SupportTicket }>(`/admin/support/tickets/${ticketId}/reply`, { body }).then(r => {
      log.info('admin.messages.replyToTicket — sent')
      return r.data.data
    })
  },

  updateStatus: (ticketId: string, status: string) => {
    log.info('admin.messages.updateStatus — ticket=%s status=%s', shortId(ticketId), status)
    return apiClient.put<{ data: SupportTicket }>(`/admin/support/tickets/${ticketId}/status`, { status }).then(r => {
      log.info('admin.messages.updateStatus — success')
      return r.data.data
    })
  },
}

export const publicMessagesApi = {
  guestSendMessage: (propertySlug: string, guestName: string, guestEmail: string, body: string) => {
    log.info('public.guestSendMessage — slug=%s guestEmail=%s bodyLen=%d',
      propertySlug, maskEmail(guestEmail), body.length)
    return publicClient.post<{ data: Conversation }>(`/api/public/messaging/properties/${propertySlug}`, { guestName, guestEmail, body }).then(r => {
      log.info('public.guestSendMessage — convId=%s', shortId(r.data.data?.id))
      return r.data.data
    })
  },

  guestViewConversation: (accessToken: string) => {
    log.debug('public.guestViewConversation — loading conversation')
    return publicClient.get<{ data: Conversation }>(`/api/public/messaging/conversations/${accessToken}`).then(r => {
      log.debug('public.guestViewConversation — %d messages', r.data.data?.messages?.length)
      return r.data.data
    })
  },

  guestReply: (accessToken: string, body: string) => {
    log.info('public.guestReply — bodyLen=%d', body.length)
    return publicClient.post<{ data: Conversation }>(`/api/public/messaging/conversations/${accessToken}/reply`, { body }).then(r => {
      log.info('public.guestReply — sent')
      return r.data.data
    })
  },
}
