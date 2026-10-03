/** Number formatting shared by the exchange page and its cards. */

export function formatKHR(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value || 0)) + ' ៛'
}

export function formatUSD(value: number) {
  return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)
}

export function formatRate(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value || 0)
}

/** "+1,200 ៛" / "−$0.74" — signed money in either currency. */
export function formatSigned(amount: number, unit: 'khr' | 'usd') {
  const tiny = unit === 'usd' ? 0.005 : 0.5
  const sign = amount > tiny ? '+' : amount < -tiny ? '−' : ''
  return sign + (unit === 'khr' ? formatKHR(Math.abs(amount)) : formatUSD(Math.abs(amount)))
}

export function formatAgo(ms: number) {
  const s = Math.round((Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}
