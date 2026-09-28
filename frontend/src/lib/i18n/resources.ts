import enCommon from '@/locales/en/common.json'
import enAuth from '@/locales/en/auth.json'
import enMarketing from '@/locales/en/marketing.json'
import enApp from '@/locales/en/app.json'
import enGuest from '@/locales/en/guest.json'

import esCommon from '@/locales/es/common.json'
import esAuth from '@/locales/es/auth.json'
import esMarketing from '@/locales/es/marketing.json'
import esApp from '@/locales/es/app.json'
import esGuest from '@/locales/es/guest.json'

import itCommon from '@/locales/it/common.json'
import itAuth from '@/locales/it/auth.json'
import itMarketing from '@/locales/it/marketing.json'
import itApp from '@/locales/it/app.json'
import itGuest from '@/locales/it/guest.json'

/**
 * All locales are bundled rather than lazy-loaded. Three languages of flat JSON
 * is a few tens of kilobytes — far cheaper than the loading states, race
 * conditions and flash-of-untranslated-content that async backends introduce.
 * Revisit if this grows past roughly a dozen languages.
 */
export const resources = {
  en: { common: enCommon, auth: enAuth, marketing: enMarketing, app: enApp, guest: enGuest },
  es: { common: esCommon, auth: esAuth, marketing: esMarketing, app: esApp, guest: esGuest },
  it: { common: itCommon, auth: itAuth, marketing: itMarketing, app: itApp, guest: itGuest },
} as const

export const NAMESPACES = ['common', 'auth', 'marketing', 'app', 'guest'] as const
export const DEFAULT_NAMESPACE = 'common'
