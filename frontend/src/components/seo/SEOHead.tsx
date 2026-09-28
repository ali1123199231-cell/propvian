import { Helmet } from 'react-helmet-async'
import { LANGUAGES, localizedPath } from '@/lib/i18n/config'
import { currentLanguage } from '@/lib/i18n'

const SITE_NAME = 'Propvian'
const SITE_URL = 'https://propvian.com'
const SITE_DESCRIPTION =
  'Accept direct bookings, automate guest access, and manage your short-term rental properties — all in one place. Start your free trial today.'

interface SEOHeadProps {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  article?: {
    publishedTime?: string
    modifiedTime?: string
    author?: string
    tags?: string[]
  }
  noIndex?: boolean
  schema?: Record<string, unknown> | Record<string, unknown>[]
}

export function SEOHead({
  title,
  description = SITE_DESCRIPTION,
  canonical,
  ogImage = `${SITE_URL}/og-image.png`,
  ogType = 'website',
  article,
  noIndex = false,
  schema,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Direct Booking Platform for Short-Term Rentals`

  /*
   * The canonical must point at THIS language's URL, not the English one.
   * Pointing every translation at the English canonical tells Google the
   * translations are duplicates and should be dropped from the index — the
   * exact opposite of why they were built.
   */
  const lang = currentLanguage()
  const canonicalUrl = canonical ? `${SITE_URL}${localizedPath(canonical, lang)}` : undefined

  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : []

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang — tells search engines these pages are translations of each
          other rather than competing duplicates. x-default points at English. */}
      {canonical && !noIndex && LANGUAGES.map((l) => (
        <link
          key={l.code}
          rel="alternate"
          hrefLang={l.code}
          href={`${SITE_URL}${localizedPath(canonical, l.code)}`}
        />
      ))}
      {canonical && !noIndex && (
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${canonical}`} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Article-specific OG */}
      {ogType === 'article' && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {ogType === 'article' && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {ogType === 'article' && article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {ogType === 'article' && article?.tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD structured data */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  )
}

export const SITE_URL_EXPORT = SITE_URL
export const SITE_NAME_EXPORT = SITE_NAME
