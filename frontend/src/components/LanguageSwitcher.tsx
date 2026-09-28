import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { LANGUAGES, localizedPath, type LanguageCode } from '@/lib/i18n/config'
import { setLanguage } from '@/lib/i18n'

interface LanguageSwitcherProps {
  /**
   * Languages to offer. Guest booking sites pass the host's enabled set;
   * omit it inside the host dashboard to offer every supported language.
   */
  available?: readonly LanguageCode[]
  /**
   * Marketing pages are indexed per language, so switching must change the URL
   * (/pricing → /es/pricing). App and guest surfaces switch in place.
   */
  syncUrl?: boolean
  /** Called after the language changes — used to persist the host's preference. */
  onChange?: (code: LanguageCode) => void
  variant?: 'button' | 'compact'
  className?: string
}

export function LanguageSwitcher({
  available,
  syncUrl = false,
  onChange,
  variant = 'button',
  className = '',
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const options = available?.length
    ? LANGUAGES.filter((l) => available.includes(l.code))
    : LANGUAGES

  const active = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Nothing to choose between — don't show a control that does nothing.
  if (options.length < 2) return null

  const select = async (code: LanguageCode) => {
    setOpen(false)
    await setLanguage(code)
    onChange?.(code)
    if (syncUrl) {
      // Full page load, not navigate(): the router's basename carries the locale
      // prefix and is fixed at mount, so a client-side navigation to /es/… would
      // leave the basename pointing at the old language and match nothing.
      window.location.assign(localizedPath(window.location.pathname, code) + window.location.search)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.change')}
        className={
          variant === 'compact'
            ? 'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
            : 'flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors'
        }
      >
        <Globe size={16} className="flex-shrink-0" />
        <span>{variant === 'compact' ? active.code.toUpperCase() : active.nativeLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('language.label')}
          className="absolute right-0 mt-1 min-w-[180px] py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          {options.map((lang) => {
            const isActive = lang.code === i18n.language
            return (
              <li key={lang.code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => select(lang.code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                    isActive ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span aria-hidden="true">{lang.flag}</span>
                  <span className="flex-1">{lang.nativeLabel}</span>
                  {isActive && <Check size={14} className="flex-shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
