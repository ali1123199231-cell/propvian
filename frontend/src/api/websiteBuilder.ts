import { apiClient } from './client'
import { logger, shortId } from '@/lib/logger'

type Res<T> = { success: boolean; data: T }

const log = logger.child('WEBSITE')

export interface WebsiteSection {
  id: string
  websiteId: string
  sectionType: string
  title?: string
  enabled: boolean
  position: number
  config: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface WebsiteConfig {
  id: string
  organizationId: string
  status: 'DRAFT' | 'PUBLISHED'
  setupCompleted: boolean
  brandName?: string
  brandLogoUrl?: string
  primaryColor: string
  accentColor: string
  fontFamily: string
  buttonStyle: string
  themeStyle: string
  pageTitle?: string
  metaDescription?: string
  ogImageUrl?: string
  stickyBookButton: boolean
  exitIntentEnabled: boolean
  exitIntentMessage?: string
  exitIntentDiscount?: number
  countdownEnabled: boolean
  countdownEndDate?: string
  countdownMessage?: string
  gaTrackingId?: string
  gtmContainerId?: string
  metaPixelId?: string
  tiktokPixelId?: string
  defaultLanguage: string
  enabledLanguages: string
  customCss?: string
  customHeadJs?: string
  customFooterJs?: string
  sections: WebsiteSection[]
  createdAt: string
  updatedAt: string
}

export interface PromoCode {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minNights?: number
  maxUses?: number
  usesCount: number
  expiresAt?: string
  active: boolean
  createdAt: string
}

export const websiteBuilderApi = {
  async getConfig(orgId: string): Promise<WebsiteConfig> {
    log.debug('getConfig — org=%s', shortId(orgId))
    const res = await apiClient.get<Res<WebsiteConfig>>(`/organizations/${orgId}/website`)
    log.info('getConfig — status=%s setupCompleted=%s sections=%d',
      res.data.data.status, res.data.data.setupCompleted, res.data.data.sections?.length)
    return res.data.data
  },

  async updateConfig(orgId: string, data: Partial<WebsiteConfig>): Promise<WebsiteConfig> {
    log.info('updateConfig — org=%s fields=%s', shortId(orgId), Object.keys(data).join(','))
    const res = await apiClient.put<Res<WebsiteConfig>>(`/organizations/${orgId}/website`, data)
    log.info('updateConfig — success')
    return res.data.data
  },

  async publish(orgId: string): Promise<WebsiteConfig> {
    log.info('publish — org=%s', shortId(orgId))
    const res = await apiClient.post<Res<WebsiteConfig>>(`/organizations/${orgId}/website/publish`)
    log.info('publish — status=%s', res.data.data.status)
    return res.data.data
  },

  async unpublish(orgId: string): Promise<WebsiteConfig> {
    log.info('unpublish — org=%s', shortId(orgId))
    const res = await apiClient.post<Res<WebsiteConfig>>(`/organizations/${orgId}/website/unpublish`)
    log.info('unpublish — status=%s', res.data.data.status)
    return res.data.data
  },

  async getSections(orgId: string): Promise<WebsiteSection[]> {
    log.debug('getSections — org=%s', shortId(orgId))
    const res = await apiClient.get<Res<WebsiteSection[]>>(`/organizations/${orgId}/website/sections`)
    log.debug('getSections — got %d sections', res.data.data?.length)
    return res.data.data
  },

  async addSection(orgId: string, data: {
    sectionType: string; title?: string; position?: number; config?: Record<string, any>
  }): Promise<WebsiteSection> {
    log.info('addSection — org=%s type=%s pos=%s', shortId(orgId), data.sectionType, data.position)
    const res = await apiClient.post<Res<WebsiteSection>>(`/organizations/${orgId}/website/sections`, data)
    log.info('addSection — success id=%s', shortId(res.data.data?.id))
    return res.data.data
  },

  async updateSection(orgId: string, sectionId: string, data: {
    title?: string; enabled?: boolean; config?: Record<string, any>; position?: number
  }): Promise<WebsiteSection> {
    log.debug('updateSection — section=%s enabled=%s', shortId(sectionId), data.enabled)
    const res = await apiClient.put<Res<WebsiteSection>>(
      `/organizations/${orgId}/website/sections/${sectionId}`, data)
    log.debug('updateSection — success')
    return res.data.data
  },

  async deleteSection(orgId: string, sectionId: string): Promise<void> {
    log.info('deleteSection — org=%s section=%s', shortId(orgId), shortId(sectionId))
    await apiClient.delete(`/organizations/${orgId}/website/sections/${sectionId}`)
    log.info('deleteSection — success')
  },

  async reorderSections(orgId: string, sectionIds: string[]): Promise<WebsiteSection[]> {
    log.debug('reorderSections — org=%s count=%d', shortId(orgId), sectionIds.length)
    const res = await apiClient.post<Res<WebsiteSection[]>>(
      `/organizations/${orgId}/website/sections/reorder`, { sectionIds })
    log.debug('reorderSections — success')
    return res.data.data
  },

  async applyTemplate(orgId: string, templateId: string): Promise<WebsiteConfig> {
    log.info('applyTemplate — org=%s template=%s', shortId(orgId), templateId)
    const res = await apiClient.post<Res<WebsiteConfig>>(
      `/organizations/${orgId}/website/apply-template/${templateId}`)
    log.info('applyTemplate — success sections=%d', res.data.data.sections?.length)
    return res.data.data
  },

  async generateAiContent(orgId: string, type: string, context: string): Promise<{ content: string; type: string }> {
    log.info('generateAiContent — org=%s type=%s', shortId(orgId), type)
    const res = await apiClient.post<Res<{ content: string; type: string }>>(
      `/organizations/${orgId}/website/ai/generate`, null,
      { params: { type, context } })
    log.info('generateAiContent — received content len=%d', res.data.data.content?.length)
    return res.data.data
  },

  async getPromoCodes(orgId: string): Promise<PromoCode[]> {
    log.debug('getPromoCodes — org=%s', shortId(orgId))
    const res = await apiClient.get<Res<PromoCode[]>>(`/organizations/${orgId}/website/promo-codes`)
    log.debug('getPromoCodes — got %d codes', res.data.data?.length)
    return res.data.data
  },

  async createPromoCode(orgId: string, data: {
    code: string; discountType: string; discountValue: number;
    minNights?: number; maxUses?: number; expiresAt?: string
  }): Promise<PromoCode> {
    log.info('createPromoCode — org=%s code=%s type=%s value=%d',
      shortId(orgId), data.code, data.discountType, data.discountValue)
    const res = await apiClient.post<Res<PromoCode>>(`/organizations/${orgId}/website/promo-codes`, data)
    log.info('createPromoCode — success id=%s', shortId(res.data.data?.id))
    return res.data.data
  },

  async deletePromoCode(orgId: string, codeId: string): Promise<void> {
    log.info('deletePromoCode — org=%s code=%s', shortId(orgId), shortId(codeId))
    await apiClient.delete(`/organizations/${orgId}/website/promo-codes/${codeId}`)
    log.info('deletePromoCode — success')
  },
}
