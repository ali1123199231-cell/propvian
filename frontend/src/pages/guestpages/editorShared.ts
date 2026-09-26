import type { GuestPage, GuestPageUpdate, PublicGuestPage } from '@/types/guestPage'

export const DEFAULT_BOOK_DIRECT_MESSAGE = 'Loved your stay? Next time, book directly with us.'

export function toDraft(p: GuestPage): GuestPageUpdate {
  return {
    enabled: p.enabled,
    welcomeMessage: p.welcomeMessage ?? '',
    wifiSsid: p.wifiSsid ?? '',
    wifiPassword: p.wifiPassword ?? '',
    wifiSecurity: p.wifiSecurity,
    wifiHidden: p.wifiHidden,
    sections: p.sections.map((s) => ({ ...s, body: s.body ?? '' })),
    contactName: p.contactName ?? '',
    contactPhone: p.contactPhone ?? '',
    contactWhatsapp: p.contactWhatsapp,
    contactEmail: p.contactEmail ?? '',
    bookDirectEnabled: p.bookDirectEnabled,
    bookDirectMessage: p.bookDirectMessage ?? '',
    bookDirectPromoCode: p.bookDirectPromoCode ?? '',
    bookDirectUrl: p.bookDirectUrl ?? '',
    bookDirectHideAirbnb: p.bookDirectHideAirbnb,
    showPoweredBy: p.showPoweredBy,
  }
}

/** Mirrors what the server will show guests, so the preview never promises more than the page delivers. */
export function draftToPublic(p: GuestPage, d: GuestPageUpdate): PublicGuestPage {
  const hasContact = !!(d.contactName?.trim() || d.contactPhone?.trim() || d.contactEmail?.trim())
  const bookUrl = d.bookDirectUrl?.trim() || p.defaultBookDirectUrl
  return {
    status: 'ACTIVE',
    code: p.code,
    propertyName: p.propertyName,
    heroImageUrl: p.heroImageUrl ?? undefined,
    brandColor: p.brandColor,
    welcomeMessage: d.welcomeMessage?.trim() || undefined,
    wifi: d.wifiSsid
      ? { ssid: d.wifiSsid, password: d.wifiSecurity === 'nopass' ? null : d.wifiPassword || null, security: d.wifiSecurity, hidden: d.wifiHidden }
      : undefined,
    checkInTime: p.checkInTime ?? undefined,
    checkOutTime: p.checkOutTime ?? undefined,
    sections: d.sections.filter((s) => s.type === 'HOUSE_RULES' || s.body?.trim()),
    houseRules: p.houseRules,
    contact: hasContact
      ? {
          name: d.contactName?.trim() || undefined,
          phone: d.contactPhone?.trim() || undefined,
          whatsapp: d.contactWhatsapp && !!d.contactPhone?.trim(),
          email: d.contactEmail?.trim() || undefined,
        }
      : undefined,
    bookDirect: d.bookDirectEnabled && bookUrl
      ? { url: bookUrl, message: d.bookDirectMessage?.trim() || DEFAULT_BOOK_DIRECT_MESSAGE, promoCode: d.bookDirectPromoCode?.trim() || undefined }
      : undefined,
    showPoweredBy: d.showPoweredBy,
  }
}

/** The server's own words where it gave some: a field message beats "Validation failed". */
export function apiError(e: unknown, fallback: string): string {
  const data = (e as { response?: { data?: { message?: string; fieldErrors?: Record<string, string> } } })?.response?.data
  const field = data?.fieldErrors && Object.entries(data.fieldErrors)[0]
  if (field) return `${field[0]}: ${field[1]}`
  return data?.message || fallback
}
