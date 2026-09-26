import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import clsx from 'clsx'

interface QrCodeProps {
  value: string
  /** CSS size, e.g. 160 or '38mm' for print */
  size?: number | string
  className?: string
  /** M suits screens and clean prints; Q survives scuffed or laminated signs better */
  ecc?: 'L' | 'M' | 'Q' | 'H'
  label?: string
}

/** Vector QR code, so it stays sharp at any print size. The quiet zone is the caller's padding. */
export function QrCode({ value, size = 160, className, ecc = 'M', label }: QrCodeProps) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let alive = true
    QRCode.toString(value, { type: 'svg', errorCorrectionLevel: ecc, margin: 0, color: { dark: '#000000', light: '#ffffff' } })
      .then((s) => { if (alive) setSvg(s) })
      .catch(() => { if (alive) setSvg('') })
    return () => { alive = false }
  }, [value, ecc])

  return (
    <div
      role="img"
      aria-label={label ?? 'QR code'}
      className={clsx('[&>svg]:block [&>svg]:w-full [&>svg]:h-full', className)}
      style={{ width: size, height: size }}
      // SVG comes from the qrcode library and contains only path data, never the encoded text
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/** Serialises a QR code to an SVG file the host can drop into Canva or a print shop's template. */
export async function downloadQrSvg(value: string, filename: string): Promise<void> {
  const svg = await QRCode.toString(value, { type: 'svg', errorCorrectionLevel: 'Q', margin: 2 })
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
