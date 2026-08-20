/**
 * Renders a money amount in the property's own currency.
 *
 * Hosts set a currency per property, so a hardcoded '$' silently misprices the
 * listing for every host outside the US — a £185 Cornwall cottage advertised as
 * $185 is a materially different offer to the guest reading it.
 */
export function formatPrice(amount: number, currency?: string, fractionDigits = 2): string {
  const cur = currency && currency.length === 3 ? currency.toUpperCase() : 'USD'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount)
  } catch {
    return `${cur} ${amount.toFixed(fractionDigits)}`
  }
}

/** Headline prices ("£185 / night") read better without trailing zeros. */
export function formatPriceWhole(amount: number, currency?: string): string {
  return formatPrice(amount, currency, 0)
}
