/**
 * Formats a numeric amount to Indonesian Rupiah representation: e.g. "RP 1.234.567"
 */
export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(amount)
  
  return `RP ${formatted}`
}

/**
 * Formats an ISO date string into relative time: e.g. "2h ago", "1d ago"
 * If null, undefined, or invalid, returns "-"
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) {
    return '-'
  }

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) {
    return '-'
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 0) {
    return 'just now'
  }

  if (diffInSeconds < 60) {
    return `${Math.max(1, diffInSeconds)}s ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}d ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

