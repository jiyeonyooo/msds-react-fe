import { useState, type InputHTMLAttributes } from 'react'
import { TextInput } from './FormField'

// 비밀번호 입력 + 표시/숨김 전환. 피그마 Form Field의 Trailing Action에 해당한다.
export function PasswordInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative block">
      <TextInput
        className={`w-full pr-16 ${className}`}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
        className="absolute top-1/2 right-4 -translate-y-1/2 border-0 bg-transparent p-0 text-[13px] font-medium text-gold-500"
        // mousedown 기본 동작을 막아 입력의 포커스를 유지한다. 포커스가 빠지면 그 순간 검증이
        // 다시 돌며 폼이 다시 그려져, 눌렀던 버튼 위에서 클릭이 완성되지 못하는 경우가 있다.
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          // 이 버튼은 FormField의 <label> 안에 있으므로, 라벨 기본 동작으로 클릭이 입력에
          // 다시 전달되지 않도록 막는다.
          event.preventDefault()
          setVisible((previous) => !previous)
        }}
        type="button"
      >
        {visible ? '숨김' : '보기'}
      </button>
    </span>
  )
}
