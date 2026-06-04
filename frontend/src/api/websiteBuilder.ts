import { apiClient } from './client'

type Res<T> = { success: boolean; data: T }

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
    const res = await apiClient.get<Res<WebsiteConfig>>(`/organizations/${orgId}/website`)
    return res.data.data
  },

  async updateConfig(orgId: string, data: Partial<WebsiteConfig>): Promise<WebsiteConfig> {
    const res = await apiClient.put<Res<WebsiteConfig>>(`/organizations/${orgId}/website`, data)
    return res.data.data
  },

  async publish(orgId: string): Promise<WebsiteConfig> {
    const res = await apiClient.post<Res<WebsiteConfig>>(`/organizations/${orgId}/website/publish`)
    return res.data.data
  },

  async unpublish(orgId: string): Promise<WebsiteConfig> {
    const res = await apiClient.post<Res<WebsiteConfig>>(`/organizations/${orgId}/website/unpublish`)
    return res.data.data
  },

  async getSections(orgId: string): Promise<WebsiteSection[]> {
    const res = await apiClient.get<Res<WebsiteSection[]>>(`/organizations/${orgId}/website/sections`)
    return res.data.data
  },

  async addSection(orgId: string, data: {
    sectionType: string; title?: string; position?: number; config?: string
  }): Promise<WebsiteSection> {
    const res = await apiClient.post<Res<WebsiteSection>>(`/organizations/${orgId}/website/sections`, data)
    return res.data.data
  },

  async updateSection(orgId: string, sectionId: string, data: {
    title?: string; enabled?: boolean; config?: string; position?: number
  }): Promise<WebsiteSection> {
    const res = await apiClient.put<Res<WebsiteSection>>(
      `/organizations/${orgId}/website/sections/${sectionId}`, data)
    return res.data.data
  },

  async deleteSection(orgId: string, sectionId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}/website/sections/${sectionId}`)
  },

  async reorderSections(orgId: string, sectionIds: string[]): Promise<WebsiteSection[]> {
    const res = await apiClient.post<Res<WebsiteSection[]>>(
      `/organizations/${orgId}/website/sections/reorder`, { sectionIds })
    return res.data.data
  },

  async applyTemplate(orgId: string, templateId: string): Promise<WebsiteConfig> {
    const res = await apiClient.post<Res<WebsiteConfig>>(
      `/organizations/${orgId}/website/apply-template/${templateId}`)
    return res.data.data
  },

  async generateAiContent(orgId: string, type: string, context: string): Promise<{ content: string; type: string }> {
    const res = await apiClient.post<Res<{ content: string; type: string }>>(
      `/organizations/${orgId}/website/ai/generate`, null,
      { params: { type, context } })
    return res.data.data
  },

  async getPromoCodes(orgId: string): Promise<PromoCode[]> {
    const res = await apiClient.get<Res<PromoCode[]>>(`/organizations/${orgId}/website/promo-codes`)
    return res.data.data
  },

  async createPromoCode(orgId: string, data: {
    code: string; discountType: string; discountValue: number;
    minNights?: number; maxUses?: number; expiresAt?: string
  }): Promise<PromoCode> {
    const res = await apiClient.post<Res<PromoCode>>(`/organizations/${orgId}/website/promo-codes`, data)
    return res.data.data
  },

  async deletePromoCode(orgId: string, codeId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}/website/promo-codes/${codeId}`)
  },
}
