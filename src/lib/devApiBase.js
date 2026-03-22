/**
 * API base URL for REST + WebSocket construction.
 * - `VITE_API_BASE_URL` wins if set (explicit override).
 * - localhost / 127.0.0.1: always same-origin (`''`) — Vite dev + `vite preview` proxy `/api` and `/ws`
 *   to Django; Django-only on :8000 also serves `/api` on the same origin.
 * - Deployed host: same-origin (`''`).
 */
export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL
  if (env) return env
  const h = typeof window !== 'undefined' ? window.location.hostname : ''
  if (h === 'localhost' || h === '127.0.0.1') {
    return ''
  }
  return ''
}

export function getWsBaseUrl(apiBase) {
  if (apiBase) {
    return apiBase.replace(/^http/, 'ws')
  }
  if (typeof window === 'undefined') return ''
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
}
