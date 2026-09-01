import { useId, type InputHTMLAttributes } from 'react'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}

/**
 * 라벨 + 입력 + 도움말/에러를 한 묶음으로 보여 주는 폼 필드.
 * 라벨은 htmlFor로만 연결해 입력의 접근성 이름을 라벨 텍스트로 유지하고,
 * 도움말·에러는 aria-describedby로 따로 전달한다. 에러일 때는 테두리 색과 aria-invalid도 함께 바꾼다.
 */
export function FormField({ label, hint, error, ...input }: FormFieldProps) {
  const fieldId = useId()
  const messageId = `${fieldId}-message`
  return (
    <div className="grid gap-1.5">
      <label className="text-[10px] tracking-[0.12em] text-muted" htmlFor={fieldId}>
        {label}
      </label>
      <input
        aria-describedby={error || hint ? messageId : undefined}
        aria-invalid={error ? true : undefined}
        className={`border bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-[#b3b8bd] ${
          error ? 'border-error-border' : 'border-border-subtle'
        }`}
        id={fieldId}
        {...input}
      />
      {error ? (
        <span className="text-[13px] text-error" id={messageId} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[12px] text-muted" id={messageId}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}
