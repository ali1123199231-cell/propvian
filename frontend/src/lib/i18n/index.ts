import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { logger } from '@/lib/logger'
import { resources, NAMESPACES, DEFAULT_NAMESPACE } from './resources'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguageCode,
  localizedPath,
  normalizeLanguage,
  splitLocalePath,
  type LanguageCode,
} from './config'

const log = logger.child('I18N')

/**
 * Resolves the language for this page load. **The URL is authoritative.**
 *
 *   1. URL path prefix  — /es/pricing. An ad or a shared link wins outright.
 *   2. ?lang= parameter — escape hatch for testing and for the TWA shell.
 *   3. Stored choice    — the visitor used the switcher before. The URL is
 *                         rewritten to match (below) so the two never disagree.
 *   4. English.
 *
 * Note what is deliberately absent: navigator.language. Serving different
 * content at the same URL based on the browser's language is exactly what
 * Google tells you not to do — its crawler requests in English, so it would
 * only ever index the English copy while real Spanish visitors saw a page whose
 * canonical pointed somewhere else. Spanish and Italian visitors arrive on
 * /es/ and /it/ URLs from the ads, and can switch languages by hand otherwise.
 *
 * The logged-in host's saved profile locale is applied later by syncUserLocale(),
 * once the session is known.
 */
export function resolveInitialLanguage(): LanguageCode {
  const { lang: pathLang } = splitLocalePath(window.location.pathname)
  if (pathLang !== DEFAULT_LANGUAGE) return pathLang

  const params = new URLSearchParams(window.location.search)
  const queryLang = params.get('lang')
  if (isLanguageCode(queryLang)) return queryLang

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguageCode(stored) && stored !== DEFAULT_LANGUAGE) {
      // Align the URL with the stored preference before the router mounts and
      // reads its basename. replaceState, not a redirect: no reload, no loop,
      // and the canonical then matches what the visitor is actually reading.
      const aligned = localizedPath(window.location.pathname, stored)
      if (aligned !== window.location.pathname) {
        window.history.replaceState(null, '', aligned + window.location.search + window.location.hash)
      }
      return stored
    }
  } catch {
    /* private browsing — fall through to English */
  }

  /*
   * The one exception to "the URL decides": guest pages opened from a printed QR
   * code or an NFC tag. Those links carry no language prefix (one stand serves
   * guests from everywhere), and the pages are noindex, so the SEO reason for
   * ignoring the browser doesn't apply. The guest's own phone language wins.
   */
  if (/^\/g\//.test(splitLocalePath(window.location.pathname).path)) {
    const browser = navigator.languages?.[0] ?? navigator.language
    return normalizeLanguage(browser)
  }

  return DEFAULT_LANGUAGE
}

const initialLanguage = resolveInitialLanguage()

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  ns: NAMESPACES as unknown as string[],
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: {
    // React already escapes rendered values.
    escapeValue: false,
  },
  returnNull: false,
  // A missing key should show the English string, never a raw key path.
  parseMissingKeyHandler: (key) => {
    log.warn('missing key — %s', key)
    return key.split('.').pop() ?? key
  },
})

document.documentElement.lang = initialLanguage
log.info('initialised — language=%s', initialLanguage)

/** Changes language, persists the choice, and keeps <html lang> in step. */
export async function setLanguage(code: LanguageCode): Promise<void> {
  if (i18n.language === code) return
  await i18n.changeLanguage(code)
  document.documentElement.lang = code
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
  } catch {
    /* ignore — the choice just won't survive the session */
  }
  log.info('language changed — %s', code)
}

/**
 * Applies a logged-in host's saved locale, but never overrides a choice the
 * visitor made in this browser. Someone who deliberately switched to English on
 * a shared laptop should not be flipped back on their next sign-in.
 *
 * Called when a session is restored and at sign-in (see authStore). It also
 * stands aside when the URL already names a language (a prefix or ?lang=), and
 * on guest pages, which follow the guest's phone.
 */
export async function syncUserLocale(userLocale: string | null | undefined): Promise<void> {
  if (!userLocale) return
  const { lang: pathLang, path } = splitLocalePath(window.location.pathname)
  if (pathLang !== DEFAULT_LANGUAGE || /^\/g\//.test(path)) return
  if (isLanguageCode(new URLSearchParams(window.location.search).get('lang'))) return
  try {
    if (localStorage.getItem(LANGUAGE_STORAGE_KEY)) return
  } catch {
    /* no storage — treat as no explicit choice */
  }
  const normalized = normalizeLanguage(userLocale)
  if (normalized !== i18n.language) {
    await i18n.changeLanguage(normalized)
    document.documentElement.lang = normalized
    log.info('applied profile locale — %s', normalized)
  }
}

export function currentLanguage(): LanguageCode {
  return isLanguageCode(i18n.language) ? i18n.language : DEFAULT_LANGUAGE
}

export default i18n
