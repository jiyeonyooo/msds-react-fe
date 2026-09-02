/**
 * 폼 입력 검증 규칙.
 *
 * 서버(member.auth.dto)의 Bean Validation 제약을 그대로 옮겨서, 사용자가 제출하기
 * 전에 같은 기준으로 안내한다. 서버 검증을 대신하는 것이 아니라 왕복 횟수를 줄이는 용도이며,
 * 최종 판단은 항상 백엔드 응답을 따른다.
 *
 * - email        @NotBlank @Email
 * - password     @NotBlank (회원가입 화면에서는 아래 비밀번호 정책을 추가로 안내한다)
 * - name         @NotBlank (users.name 컬럼 길이 50)
 * - phoneNumber  @NotBlank @Pattern(^\d{3}-\d{3,4}-\d{4}$)
 */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\d{3}-\d{3,4}-\d{4}$/

// 회원가입 전용 비밀번호 정책(프런트 안내 기준). 서버는 공백만 아니면 허용한다.
export const passwordPolicy = '영문과 숫자를 포함해 8자 이상'
const passwordMinLength = 8

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return '이메일은 필수 입력값입니다.'
  if (!emailPattern.test(value.trim())) return '올바른 이메일 형식이 아닙니다.'
  return undefined
}

export function validateLoginPassword(value: string): string | undefined {
  if (!value) return '비밀번호는 필수 입력값입니다.'
  return undefined
}

export function validateNewPassword(value: string): string | undefined {
  if (!value) return '비밀번호는 필수 입력값입니다.'
  if (value.length < passwordMinLength)
    return `비밀번호는 ${passwordMinLength}자 이상이어야 합니다.`
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
    return '비밀번호에 영문과 숫자를 모두 포함해 주세요.'
  return undefined
}

export function validatePasswordConfirm(password: string, confirm: string): string | undefined {
  if (!confirm) return '비밀번호를 한 번 더 입력해 주세요.'
  if (password !== confirm) return '비밀번호가 일치하지 않습니다.'
  return undefined
}

export function validateName(value: string): string | undefined {
  if (!value.trim()) return '이름은 필수 입력값입니다.'
  if (value.trim().length > 50) return '이름은 50자 이내로 입력해 주세요.'
  return undefined
}

export function validatePhoneNumber(value: string): string | undefined {
  if (!value.trim()) return '전화번호는 필수 입력값입니다.'
  if (!phonePattern.test(value.trim())) return '올바른 전화번호 형식(예: 010-1234-5678)이 아닙니다.'
  return undefined
}

// 입력 도중 숫자만 남기고 하이픈을 자동으로 넣어 서버 패턴(3-3~4-4)에 맞춘다.
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}
