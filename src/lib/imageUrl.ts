const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function resolveImageUrl(url?: string | null) {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/i.test(url)) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}
