export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

export type GuestSectionType =
  | 'CHECKIN' | 'CHECKOUT' | 'HOUSE_RULES' | 'LOCAL_TIPS'
  | 'APPLIANCES' | 'PARKING' | 'EMERGENCY' | 'CUSTOM'

export interface GuestPageSection {
  id?: string
  type: GuestSectionType
  title: string
  body?: string | null
}

export interface GuestHouseRule {
  key: string
  allowed: boolean
  notes?: string | null
}

export interface TapCodeInfo {
  code: string
  kind: 'PROPERTY' | 'PRODUCT'
  url: string
  qrUrl: string
  nfcUrl: string
  batchLabel?: string | null
  claimedAt?: string | null
  views30d: number
}

/** The host's editable guest page. */
export interface GuestPage {
  id: string
  propertyId: string
  propertyName: string
  enabled: boolean
  welcomeMessage?: string | null
  wifiSsid?: string | null
  wifiPassword?: string | null
  wifiSecurity: WifiSecurity
  wifiHidden: boolean
  legacyWifiDetails?: string | null
  sections: GuestPageSection[]
  houseRules: GuestHouseRule[]
  checkInTime?: string | null
  checkOutTime?: string | null
  heroImageUrl?: string | null
  contactName?: string | null
  contactPhone?: string | null
  contactWhatsapp: boolean
  contactEmail?: string | null
  bookDirectEnabled: boolean
  bookDirectMessage?: string | null
  bookDirectPromoCode?: string | null
  bookDirectUrl?: string | null
  bookDirectHideAirbnb: boolean
  defaultBookDirectUrl?: string | null
  showPoweredBy: boolean
  brandColor: string
  code: string
  publicUrl: string
  codes: TapCodeInfo[]
  updatedAt?: string
}

export type GuestPageUpdate = Omit<GuestPage,
  'id' | 'propertyId' | 'propertyName' | 'legacyWifiDetails' | 'houseRules' | 'checkInTime' | 'checkOutTime'
  | 'heroImageUrl' | 'defaultBookDirectUrl' | 'brandColor' | 'code' | 'publicUrl' | 'codes' | 'updatedAt'>

/** What a guest's phone receives. */
export interface PublicGuestPage {
  status: 'ACTIVE' | 'UNCLAIMED' | 'INACTIVE'
  code: string
  propertyName?: string
  city?: string
  country?: string
  heroImageUrl?: string
  brandName?: string
  brandColor?: string
  welcomeMessage?: string
  wifi?: { ssid: string; password?: string | null; security: WifiSecurity; hidden: boolean }
  checkInTime?: string
  checkOutTime?: string
  sections?: GuestPageSection[]
  houseRules?: GuestHouseRule[]
  contact?: { name?: string; phone?: string; whatsapp: boolean; email?: string }
  bookDirect?: { url: string; message: string; promoCode?: string; discountLabel?: string }
  showPoweredBy?: boolean
}

export type GuestPageEventType = 'WIFI_COPY' | 'BOOK_DIRECT_CLICK' | 'CONTACT_CLICK' | 'POWERED_BY_CLICK'

export interface GuestPageSummary {
  propertyId: string
  propertyName: string
  city?: string
  imageUrl?: string
  configured: boolean
  enabled: boolean
  hasWifi: boolean
  code?: string
  publicUrl?: string
  views30d: number
  linkedStands: number
}

export interface GuestPageStats {
  days: number
  views: number
  viewsBySource: Record<'NFC' | 'QR' | 'LINK', number>
  wifiCopies: number
  bookDirectClicks: number
  contactClicks: number
  daily: { date: string; views: number }[]
}

export interface TapCodeBatch {
  batchLabel: string
  issued: number
  scanned: number
  claimed: number
  createdAt?: string
  codes?: TapCodeInfo[]
}
