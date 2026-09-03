import { dismissToast, useToasts } from '../../lib/toast'

/** 화면 오른쪽 아래에 쌓이는 완료·오류 알림. 스크린 리더에는 공손하게(polite) 전달한다. */
export function ToastHost() {
  const toasts = useToasts()
  if (toasts.length === 0) return null
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-5 bottom-20 z-50 grid w-[min(360px,calc(100vw_-_40px))] gap-2 md:right-8 md:bottom-24"
    >
      {toasts.map((toast) => (
        <div
          className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-md border px-5 py-4 text-sm leading-6 shadow-floating ${
            toast.tone === 'error'
              ? 'border-error-border bg-white text-error'
              : 'border-border-accent bg-white text-ink-700'
          }`}
          key={toast.id}
          role="status"
        >
          <span aria-hidden="true" className="mt-0.5 text-gold-500">
            {toast.tone === 'error' ? '!' : '·'}
          </span>
          <p className="m-0 flex-1">{toast.message}</p>
          <button
            aria-label="알림 닫기"
            className="-mt-1 -mr-1 shrink-0 border-0 bg-transparent p-1 text-xs text-muted transition-colors hover:text-navy-900"
            onClick={() => dismissToast(toast.id)}
            type="button"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
