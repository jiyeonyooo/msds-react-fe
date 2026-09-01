export type DevAuthState = 'guest' | 'member'
const key = 'msds.dev.auth'
export function getDevAuthState(): DevAuthState { return (localStorage.getItem(key) as DevAuthState | null) ?? 'guest' }
export function setDevAuthState(value: DevAuthState) { localStorage.setItem(key, value); window.dispatchEvent(new Event('msds-dev-auth')) }
