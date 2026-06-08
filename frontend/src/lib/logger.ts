/**
 * App Logger — unified, toggleable logging for testing and debugging.
 *
 * QUICK DEVTOOLS REFERENCE (paste in browser console):
 *   window.__logger.enable()              → show all logs (DEBUG level)
 *   window.__logger.disable()             → silence all logs
 *   window.__logger.setLevel('INFO')      → DEBUG | INFO | WARN | ERROR | NONE
 *   window.__logger.only('API', 'AUTH')   → filter to specific namespaces
 *   window.__logger.all()                 → remove namespace filter
 *   window.__logger.getLevel()            → current log level
 *   window.__logger.help()               → print this reference
 *
 * Persistence: settings survive page reload via localStorage.
 *   localStorage.setItem('APP_LOG_LEVEL', 'DEBUG')
 *   localStorage.setItem('APP_LOG_NAMESPACES', '["API","AUTH"]')
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE'

const LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 99,
}

const STORAGE_LEVEL_KEY = 'APP_LOG_LEVEL'
const STORAGE_NS_KEY = 'APP_LOG_NAMESPACES'
const DEFAULT_LEVEL: LogLevel = import.meta.env.PROD ? 'WARN' : 'DEBUG'

// ── PII Masking utilities ─────────────────────────────────────────────────────

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '[no-email]'
  const at = email.indexOf('@')
  if (at <= 0) return '***@***'
  const local = email.substring(0, at)
  const domain = email.substring(at)
  const visible = local.substring(0, Math.min(3, local.length))
  return `${visible}***${domain}`
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '[no-phone]'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  return `***-***-${digits.slice(-4)}`
}

export function maskName(name: string | null | undefined): string {
  if (!name) return '[no-name]'
  return name.split(' ').map(part => (part.length > 0 ? `${part[0]}***` : '')).join(' ')
}

// Short UUID display — safe to log (non-PII)
export function shortId(id: string | null | undefined): string {
  if (!id) return '[none]'
  return id.length > 8 ? `${id.substring(0, 8)}…` : id
}

// ── Logger core ───────────────────────────────────────────────────────────────

function readStoredLevel(): LogLevel {
  try {
    const v = localStorage.getItem(STORAGE_LEVEL_KEY)
    if (v && v in LEVELS) return v as LogLevel
  } catch { /* storage unavailable */ }
  return DEFAULT_LEVEL
}

function readStoredFilter(): string[] | null {
  try {
    const v = localStorage.getItem(STORAGE_NS_KEY)
    if (v) return JSON.parse(v) as string[]
  } catch { /* parse error */ }
  return null
}

const NS_COLORS: Record<string, string> = {
  AUTH: '#818cf8',
  API: '#34d399',
  STORE: '#fb923c',
  RESERVATION: '#60a5fa',
  LOCK: '#a78bfa',
  PROPERTY: '#f472b6',
  CALENDAR: '#facc15',
  BILLING: '#f87171',
  GUEST: '#2dd4bf',
  SYSTEM: '#94a3b8',
  CHECKOUT: '#c084fc',
  WEBSITE: '#86efac',
}

function nsColor(namespace: string): string {
  return NS_COLORS[namespace] ?? '#94a3b8'
}

class AppLogger {
  private level: LogLevel = readStoredLevel()
  private filter: string[] | null = readStoredFilter()

  private shouldLog(level: LogLevel, namespace: string): boolean {
    if (LEVELS[level] < LEVELS[this.level]) return false
    if (this.filter && !this.filter.includes(namespace)) return false
    return true
  }

  _log(level: LogLevel, namespace: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level, namespace)) return
    const ts = new Date().toISOString().substring(11, 23) // HH:mm:ss.SSS
    const color = nsColor(namespace)
    const prefix = `%c[${namespace}]%c`
    const style = `color:${color};font-weight:bold`
    const reset = 'color:inherit;font-weight:normal'

    switch (level) {
      case 'DEBUG':
        console.debug(`${ts} ${prefix} ${message}`, style, reset, ...args)
        break
      case 'INFO':
        console.info(`${ts} ${prefix} ${message}`, style, reset, ...args)
        break
      case 'WARN':
        console.warn(`${ts} ${prefix} ${message}`, style, reset, ...args)
        break
      case 'ERROR':
        console.error(`${ts} ${prefix} ${message}`, style, reset, ...args)
        break
    }
  }

  child(namespace: string): NamespacedLogger {
    return new NamespacedLogger(this, namespace)
  }

  // ── DevTools API ────────────────────────────────────────────────────────────

  enable(): void {
    this.setLevel('DEBUG')
  }

  disable(): void {
    this.setLevel('NONE')
  }

  setLevel(level: LogLevel): void {
    if (!(level in LEVELS)) {
      console.warn('[Logger] Unknown level:', level, '— use DEBUG|INFO|WARN|ERROR|NONE')
      return
    }
    this.level = level
    try { localStorage.setItem(STORAGE_LEVEL_KEY, level) } catch { /* ok */ }
    console.info(`%c[Logger] Level → ${level}`, 'color:#6366f1;font-weight:bold')
  }

  getLevel(): LogLevel {
    return this.level
  }

  only(...namespaces: string[]): void {
    this.filter = namespaces
    try { localStorage.setItem(STORAGE_NS_KEY, JSON.stringify(namespaces)) } catch { /* ok */ }
    console.info(`%c[Logger] Showing only: ${namespaces.join(', ')}`, 'color:#6366f1;font-weight:bold')
  }

  all(): void {
    this.filter = null
    try { localStorage.removeItem(STORAGE_NS_KEY) } catch { /* ok */ }
    console.info('%c[Logger] Showing all namespaces', 'color:#6366f1;font-weight:bold')
  }

  help(): void {
    console.group('%c[Logger] DevTools API', 'color:#6366f1;font-weight:bold')
    console.log('window.__logger.enable()              → level = DEBUG (show all)')
    console.log('window.__logger.disable()             → level = NONE (silence all)')
    console.log('window.__logger.setLevel("INFO")      → DEBUG | INFO | WARN | ERROR | NONE')
    console.log('window.__logger.only("API","AUTH")    → filter to these namespaces')
    console.log('window.__logger.all()                 → remove namespace filter')
    console.log('window.__logger.getLevel()            → current level')
    console.log('')
    console.log('Available namespaces:', Object.keys(NS_COLORS).join(', '))
    console.log('')
    console.log('Persist across reloads:')
    console.log('  localStorage.setItem("APP_LOG_LEVEL", "DEBUG")')
    console.log('  localStorage.setItem("APP_LOG_NAMESPACES", JSON.stringify(["API","AUTH"]))')
    console.groupEnd()
  }
}

export class NamespacedLogger {
  constructor(private root: AppLogger, private namespace: string) {}
  debug(msg: string, ...args: unknown[]): void { this.root._log('DEBUG', this.namespace, msg, ...args) }
  info(msg: string, ...args: unknown[]): void  { this.root._log('INFO',  this.namespace, msg, ...args) }
  warn(msg: string, ...args: unknown[]): void  { this.root._log('WARN',  this.namespace, msg, ...args) }
  error(msg: string, ...args: unknown[]): void { this.root._log('ERROR', this.namespace, msg, ...args) }
}

export const logger = new AppLogger()

// ── Expose on window for DevTools ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__logger = logger
  console.info(
    `%c[Logger] Active — level: ${logger.getLevel()} | run window.__logger.help() for DevTools API`,
    'color:#6366f1;font-weight:bold;font-size:11px',
  )
}
