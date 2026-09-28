/**
 * Supported languages.
 *
 * Adding a language is a three-step change: add it here, drop a folder under
 * src/locales/<code>/, and register it in resources.ts. Nothing else needs to
 * know about it — the switcher, the router prefixes and the hreflang tags all
 * read from this list.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as readonly LanguageCode[]

/** localStorage key holding an explicit user choice. Outranks browser detection. */
export const LANGUAGE_STORAGE_KEY = 'propvian_lang'

/**
 * English is served unprefixed so the existing URLs — and the rankings and
 * IndexNow submissions attached to them — keep working. Other languages are
 * prefixed: /es/pricing, /it/pricing.
 */
export function localePrefix(code: LanguageCode): string {
  return code === DEFAULT_LANGUAGE ? '' : `/${code}`
}

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return !!value && (LANGUAGE_CODES as readonly string[]).includes(value)
}

/** Splits "/es/pricing" into its language and the path without the prefix. */
export function splitLocalePath(pathname: string): { lang: LanguageCode; path: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*|$)/)
  if (match && isLanguageCode(match[1])) {
    return { lang: match[1], path: match[2] || '/' }
  }
  return { lang: DEFAULT_LANGUAGE, path: pathname }
}

/** Builds the equivalent URL for another language, preserving the rest of the path. */
export function localizedPath(pathname: string, target: LanguageCode): string {
  const { path } = splitLocalePath(pathname)
  const prefix = localePrefix(target)
  if (path === '/') return prefix || '/'
  return `${prefix}${path}`
}

/** Maps a browser tag such as "es-419" or "it-CH" onto a supported language. */
export function normalizeLanguage(raw: string | null | undefined): LanguageCode {
  if (!raw) return DEFAULT_LANGUAGE
  const base = raw.toLowerCase().split(/[-_]/)[0]
  return isLanguageCode(base) ? base : DEFAULT_LANGUAGE
}
