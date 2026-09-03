import { useSyncExternalStore } from 'react'

/**
 * 전역 알림 저장소.
 *
 * 예약 확정·프로그램 신청 같은 완료 동작이 지금까지는 화면 이동만으로 끝나서
 * "정말 처리됐나?"가 남았다. 명상 톤을 지키기 위해 소리도 흔들림도 없이,
 * 천천히 떠올랐다 스스로 사라지는 한 줄만 둔다.
 */
export type ToastTone = 'calm' | 'error'
export type Toast = { id: number; message: string; tone: ToastTone }

const changeEvent = 'msds-toast-changed'
const lifetime = 4600

let toasts: Toast[] = []
let nextId = 1

function publish(next: Toast[]) {
  toasts = next
  dispatchEvent(new Event(changeEvent))
}

export function showToast(message: string, tone: ToastTone = 'calm') {
  const id = nextId++
  // 같은 문장이 연달아 쌓이면 알림이 아니라 소음이 된다.
  const withoutDuplicate = toasts.filter((toast) => toast.message !== message)
  publish([...withoutDuplicate, { id, message, tone }].slice(-3))
  setTimeout(() => dismissToast(id), lifetime)
  return id
}

export function dismissToast(id: number) {
  const next = toasts.filter((toast) => toast.id !== id)
  if (next.length !== toasts.length) publish(next)
}

function subscribe(listener: () => void) {
  addEventListener(changeEvent, listener)
  return () => removeEventListener(changeEvent, listener)
}

const getSnapshot = () => toasts

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
