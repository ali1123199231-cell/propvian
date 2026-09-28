import type { WifiSecurity } from '@/types/guestPage'

/*
 * The WIFI: payload that iPhone (iOS 11+) and Android (10+) cameras recognise
 * and offer to join directly. Backslash-escape the characters the format uses
 * as delimiters, or a password like "a;b" silently joins with "a".
 */
const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')

export function wifiQrPayload(w: { ssid: string; password?: string | null; security: WifiSecurity; hidden?: boolean }): string {
  let out = `WIFI:T:${w.security};S:${escapeWifi(w.ssid)};`
  if (w.security !== 'nopass' && w.password) out += `P:${escapeWifi(w.password)};`
  if (w.hidden) out += 'H:true;'
  return out + ';'
}

