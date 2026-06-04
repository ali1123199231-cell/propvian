import axios from 'axios'
import { apiClient } from './client'

const publicClient = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── Types (mirror backend response DTOs) ────────────────────────────────────

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

// ─── Host-facing API (authenticated) ─────────────────────────────────────────

export const messagesApi = {
  listConversations: (orgId: string) =>
    apiClient.get<{ data: Conversation[] }>(`/organizations/${orgId}/conversations`).then(r => r.data.data),

  getConversation: (orgId: string, convId: string) =>
    apiClient.get<{ data: Conversation }>(`/organizations/${orgId}/conversations/${convId}`).then(r => r.data.data),

  hostReply: (orgId: string, convId: string, body: string) =>
    apiClient.post<{ data: Conversation }>(`/organizations/${orgId}/conversations/${convId}/reply`, { body }).then(r => r.data.data),

  markRead: (orgId: string, convId: string) =>
    apiClient.put(`/organizations/${orgId}/conversations/${convId}/read`),

  listTickets: (orgId: string) =>
    apiClient.get<{ data: SupportTicket[] }>(`/organizations/${orgId}/support/tickets`).then(r => r.data.data),

  createTicket: (orgId: string, subject: string, body: string) =>
    apiClient.post<{ data: SupportTicket }>(`/organizations/${orgId}/support/tickets`, { subject, body }).then(r => r.data.data),

  replyToTicket: (orgId: string, ticketId: string, body: string) =>
    apiClient.post<{ data: SupportTicket }>(`/organizations/${orgId}/support/tickets/${ticketId}/reply`, { body }).then(r => r.data.data),
}

// ─── Admin API (authenticated, cross-org) ────────────────────────────────────

export const adminMessagesApi = {
  listAllTickets: (page = 0, size = 30, status?: string) =>
    apiClient.get<{ data: { content: SupportTicket[]; totalElements: number; totalPages: number; number: number } }>(
      `/admin/support/tickets`, { params: { page, size, ...(status ? { status } : {}) } }
    ).then(r => r.data.data),

  getTicket: (ticketId: string) =>
    apiClient.get<{ data: SupportTicket }>(`/admin/support/tickets/${ticketId}`).then(r => r.data.data),

  replyToTicket: (ticketId: string, body: string) =>
    apiClient.post<{ data: SupportTicket }>(`/admin/support/tickets/${ticketId}/reply`, { body }).then(r => r.data.data),

  updateStatus: (ticketId: string, status: string) =>
    apiClient.put<{ data: SupportTicket }>(`/admin/support/tickets/${ticketId}/status`, { status }).then(r => r.data.data),
}

// ─── Public API (no auth — called from guest booking website) ─────────────────

export const publicMessagesApi = {
  guestSendMessage: (propertySlug: string, guestName: string, guestEmail: string, body: string) =>
    publicClient.post<{ data: Conversation }>(`/api/public/messaging/properties/${propertySlug}`, { guestName, guestEmail, body }).then(r => r.data.data),

  guestViewConversation: (accessToken: string) =>
    publicClient.get<{ data: Conversation }>(`/api/public/messaging/conversations/${accessToken}`).then(r => r.data.data),

  guestReply: (accessToken: string, body: string) =>
    publicClient.post<{ data: Conversation }>(`/api/public/messaging/conversations/${accessToken}/reply`, { body }).then(r => r.data.data),
}
