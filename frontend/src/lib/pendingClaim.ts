/*
 * A stand owner who scans an unclaimed code usually has no account yet. The
 * code has to survive sign-up, email verification and onboarding, which are
 * separate page loads, so it waits in localStorage until the claim page uses it.
 */
const KEY = 'propvian.pendingClaim'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function savePendingClaim(code: string): void {
  try { localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() })) } catch { /* private mode */ }
}

export function readPendingClaim(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { code, at } = JSON.parse(raw) as { code: string; at: number }
    if (!code || Date.now() - at > MAX_AGE_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return code
  } catch {
    return null
  }
}

export function clearPendingClaim(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
