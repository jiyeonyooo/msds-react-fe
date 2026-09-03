const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function resolveImageUrl(url?: string | null) {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/i.test(url)) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export function normalizeProgramImagePath(url?: string | null) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/uploads/program/')) return url
  const fileName = url.split('/').filter(Boolean).at(-1)
  return fileName ? `/uploads/program/${fileName}` : ''
}

export function resolveProgramImageUrl(url?: string | null) {
  return resolveImageUrl(normalizeProgramImagePath(url))
}
