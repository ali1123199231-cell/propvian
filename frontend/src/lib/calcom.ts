import { useEffect, useRef, useState } from 'react'
import { logger } from './logger'

const log = logger.child('CALCOM')

/**
 * Cal.com handle for the outbound "15 minutes" event type, e.g. `propvian/15min`.
 * Overridable so the link can be repointed without a rebuild of the page.
 */
export const CAL_LINK = import.meta.env.VITE_CAL_LINK || 'propvian/15min'

const EMBED_SCRIPT = 'https://app.cal.com/embed/embed.js'

/** UTM keys Cal.com stores against the booking when passed through. */
const TRACKED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

/**
 * Campaign parameters from the current URL, forwarded into the booking.
 *
 * A booked call is a conversion that never reaches our own signup endpoint, so
 * `attribution.ts` — which only fires on register — can't see it. Passing the
 * UTMs to Cal.com is what puts the campaign, the email number and the lead slug
 * on the booking itself, which is the only place that conversion is recorded.
 *
 * Outbound links use utm_term for the lead slug and utm_content for the step,
 * e.g. ?utm_campaign=outbound-batch1&utm_content=email3&utm_term=coastal-retreats
 */
export function campaignParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const key of TRACKED_PARAMS) {
    const value = params.get(key)
    if (value) out[key] = value.slice(0, 255)
  }
  return out
}

/** Full-page fallback URL, used when the embed is blocked or JS is unavailable. */
export function calBookingUrl(): string {
  const query = new URLSearchParams(campaignParams()).toString()
  return `https://cal.com/${CAL_LINK}${query ? `?${query}` : ''}`
}

type CalGlobal = ((...args: unknown[]) => void) & { loaded?: boolean; ns?: Record<string, unknown>; q?: unknown[] }

/** The official vanilla-embed bootstrap, which queues calls until the script lands. */
function ensureCalLoaded(onScriptError: () => void): CalGlobal {
  const w = window as unknown as { Cal?: CalGlobal }
  if (w.Cal) return w.Cal

  const cal: CalGlobal = function (...args: unknown[]) {
    cal.q = cal.q || []
    cal.q.push(args)
  } as CalGlobal
  w.Cal = cal

  const script = document.createElement('script')
  script.src = EMBED_SCRIPT
  script.async = true
  script.onerror = () => {
    log.warn('embed script blocked — falling back to link')
    onScriptError()
  }
  document.head.appendChild(script)

  return cal
}

export type CalStatus = 'loading' | 'ready' | 'failed'

/** How long to wait for Cal to say anything before assuming it never will. */
const READY_TIMEOUT_MS = 8000

/**
 * Mounts the Cal.com inline booking widget and reports whether it actually came up.
 *
 * The status matters more than it looks. This page is the only destination in a
 * cold-email sequence, so a widget that spins forever — a mistyped handle, an
 * unpublished event type, a blocked third-party script — loses the lead in
 * silence. On failure the caller shows a plain link instead.
 */
export function useCalInline(elementId: string): CalStatus {
  const [status, setStatus] = useState<CalStatus>('loading')
  const initialised = useRef(false)
  const settled = useRef(false)

  useEffect(() => {
    const settle = (next: CalStatus) => {
      if (settled.current) return
      settled.current = true
      /*
       * Cal injects a <cal-inline> skeleton into the container and keeps it
       * spinning even after the event type 404s. React swapping the container
       * out does not reliably take it with it, so the host page ends up with a
       * dead spinner sitting above the fallback. Clear it explicitly.
       */
      if (next === 'failed') document.getElementById(elementId)?.replaceChildren()
      setStatus(next)
    }

    // The embed itself must only mount once: StrictMode invokes this effect
    // twice in development, and a second `inline` call against the same element
    // stacks a duplicate iframe.
    if (!initialised.current) {
      initialised.current = true
      try {
        const cal = ensureCalLoaded(() => settle('failed'))
        cal('init', { origin: 'https://cal.com' })
        cal('inline', {
          elementOrSelector: `#${elementId}`,
          calLink: CAL_LINK,
          config: { layout: 'month_view', ...campaignParams() },
        })
        cal('ui', {
          hideEventTypeDetails: false,
          styles: { branding: { brandColor: '#4f46e5' } },
        })
        cal('on', { action: 'linkReady', callback: () => settle('ready') })
        cal('on', {
          action: 'linkFailed',
          callback: () => {
            log.warn('cal link failed — %s', CAL_LINK)
            settle('failed')
          },
        })
        log.info('inline embed mounted — link=%s', CAL_LINK)
      } catch (e) {
        log.warn('embed init failed — %s', (e as Error)?.message)
        settle('failed')
      }
    }

    // Armed on every invocation, deliberately. A 404 on the event type makes
    // embed.js throw before it ever emits linkFailed, so this timeout is the
    // only thing standing between a mistyped handle and a permanent spinner.
    const timer = window.setTimeout(() => {
      if (!settled.current) log.warn('cal embed timed out after %dms', READY_TIMEOUT_MS)
      settle('failed')
    }, READY_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [elementId])

  return status
}
