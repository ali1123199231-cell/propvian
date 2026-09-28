import enCommon from '@/locales/en/common.json'
import enAuth from '@/locales/en/auth.json'
import enMarketing from '@/locales/en/marketing.json'
import enApp from '@/locales/en/app.json'
import enGuest from '@/locales/en/guest.json'
import enGuestpage from '@/locales/en/guestpage.json'

import esCommon from '@/locales/es/common.json'
import esAuth from '@/locales/es/auth.json'
import esMarketing from '@/locales/es/marketing.json'
import esApp from '@/locales/es/app.json'
import esGuest from '@/locales/es/guest.json'
import esGuestpage from '@/locales/es/guestpage.json'

import itCommon from '@/locales/it/common.json'
import itAuth from '@/locales/it/auth.json'
import itMarketing from '@/locales/it/marketing.json'
import itApp from '@/locales/it/app.json'
import itGuest from '@/locales/it/guest.json'
import itGuestpage from '@/locales/it/guestpage.json'

import plCommon from '@/locales/pl/common.json'
import plAuth from '@/locales/pl/auth.json'
import plMarketing from '@/locales/pl/marketing.json'
import plApp from '@/locales/pl/app.json'
import plGuest from '@/locales/pl/guest.json'
import plGuestpage from '@/locales/pl/guestpage.json'

/**
 * All locales are bundled rather than lazy-loaded. Four languages of flat JSON
 * is a few tens of kilobytes — far cheaper than the loading states, race
 * conditions and flash-of-untranslated-content that async backends introduce.
 * Revisit if this grows past roughly a dozen languages.
 */
export const resources = {
  en: { common: enCommon, auth: enAuth, marketing: enMarketing, app: enApp, guest: enGuest, guestpage: enGuestpage },
  es: { common: esCommon, auth: esAuth, marketing: esMarketing, app: esApp, guest: esGuest, guestpage: esGuestpage },
  it: { common: itCommon, auth: itAuth, marketing: itMarketing, app: itApp, guest: itGuest, guestpage: itGuestpage },
  pl: { common: plCommon, auth: plAuth, marketing: plMarketing, app: plApp, guest: plGuest, guestpage: plGuestpage },
} as const

export const NAMESPACES = ['common', 'auth', 'marketing', 'app', 'guest', 'guestpage'] as const
export const DEFAULT_NAMESPACE = 'common'
