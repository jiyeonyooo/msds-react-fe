export const isDevMode = import.meta.env.DEV && import.meta.env.VITE_DEV_MODE === 'true'

export const devScenarios = [
  { id: 'live', label: '실제 API 사용' },
  { id: 'demo', label: '데모 성공 데이터' },
  { id: 'empty', label: '빈 상태' },
  { id: 'loading', label: '느린 응답 (1.5초)' },
  { id: 'validation', label: '400 입력 오류' },
  { id: 'unauthorized', label: '401 로그인 필요' },
  { id: 'forbidden', label: '403 권한 없음' },
  { id: 'not-found', label: '404 찾을 수 없음' },
  { id: 'room-conflict', label: '409 객실 마감' },
  { id: 'cancel-conflict', label: '409 취소 불가' },
] as const
export type DevScenario = (typeof devScenarios)[number]['id']
const key = 'msds.dev.scenario'
export function getDevScenario(): DevScenario { return (localStorage.getItem(key) as DevScenario | null) ?? 'live' }
export function setDevScenario(value: DevScenario) { localStorage.setItem(key, value); window.dispatchEvent(new Event('msds-dev-scenario')) }
