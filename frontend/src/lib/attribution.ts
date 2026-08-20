import { logger } from './logger'

const log = logger.child('ATTRIB')

const STORAGE_KEY = 'propvian_attribution'

/**
 * Marketing attribution captured on the visitor's first landing.
 *
 * Google Ads only ever sees the signup event. The event that decides whether an
 * ad paid for itself — a subscription reaching ACTIVE in Stripe — happens ~30
 * days later, server-side. Storing the click id on the user row is what lets
 * those two be joined back together.
 */
export interface Attribution {
  gclid?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  landingPage?: string
  signupReferrer?: string
}

/** Column widths in the users table. Trim rather than have the API reject the signup. */
const LIMITS: Record<keyof Attribution, number> = {
  gclid: 255,
  utmSource: 100,
  utmMedium: 100,
  utmCampaign: 150,
  utmTerm: 255,
  utmContent: 150,
  landingPage: 500,
  signupReferrer: 500,
}

const trim = (value: string | null, max: number): string | undefined => {
  if (!value) return undefined
  const cleaned = value.trim()
  return cleaned ? cleaned.slice(0, max) : undefined
}

/**
 * Reads attribution from the current URL and stores it, but only on the visit
 * that actually carried the parameters.
 *
 * First touch wins: a visitor who arrives from an ad, leaves, then returns
 * organically a week later is still credited to the ad. Overwriting here would
 * quietly hand every paid signup to whichever source happened to be last.
 */
export function captureAttribution(): void {
  try {
    const params = new URLSearchParams(window.location.search)

    const captured: Attribution = {
      gclid: trim(params.get('gclid'), LIMITS.gclid),
      utmSource: trim(params.get('utm_source'), LIMITS.utmSource),
      utmMedium: trim(params.get('utm_medium'), LIMITS.utmMedium),
      utmCampaign: trim(params.get('utm_campaign'), LIMITS.utmCampaign),
      utmTerm: trim(params.get('utm_term'), LIMITS.utmTerm),
      utmContent: trim(params.get('utm_content'), LIMITS.utmContent),
    }

    const referrer = document.referrer || ''
    const isExternal = referrer !== '' && !referrer.startsWith(window.location.origin)
    const hasAdParams = Object.values(captured).some(Boolean)

    // The Android app is a TWA, so a visit launched from it arrives with an
    // android-app:// referrer. That is the only signal the Play listing produces.
    const isTwa = referrer.startsWith('android-app://')

    if (!hasAdParams && !isExternal && !isTwa) return
    if (localStorage.getItem(STORAGE_KEY)) return

    captured.landingPage = trim(window.location.pathname, LIMITS.landingPage)
    captured.signupReferrer = trim(referrer, LIMITS.signupReferrer)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(captured))
    log.info(
      'captured — source=%s campaign=%s gclid=%s twa=%s',
      captured.utmSource ?? 'none',
      captured.utmCampaign ?? 'none',
      captured.gclid ? 'present' : 'none',
      isTwa,
    )
  } catch (e) {
    // Private browsing can throw on localStorage. Attribution is never worth
    // breaking a page load over.
    log.warn('capture failed — %s', (e as Error)?.message)
  }
}

/** Returns the stored attribution, or an empty object when the visit was organic. */
export function getAttribution(): Attribution {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Attribution) : {}
  } catch {
    return {}
  }
}

/** Called after a successful signup — the attribution has served its purpose. */
export function clearAttribution(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
