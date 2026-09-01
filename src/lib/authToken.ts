const ACCESS_TOKEN_KEY = 'msds.access_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  window.dispatchEvent(new Event('msds-auth-changed'))
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.dispatchEvent(new Event('msds-auth-changed'))
}
