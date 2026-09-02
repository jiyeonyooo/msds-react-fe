import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, FormField, PasswordInput, TextInput } from '../../components/ui'
import { ApiError, type FieldErrors } from '../../lib/apiError'
import { signIn } from './api'
import { AuthLayout } from './AuthLayout'
import { takeReturnPath } from './session'
import { useSession } from './useSession'
import { validateEmail, validateLoginPassword } from './validation'

// 다음 로그인 때 이메일을 미리 채워 주기 위한 값(비밀번호는 저장하지 않는다).
const rememberKey = 'msds.auth.remembered-email'

/**
 * 로그인 화면.
 *
 * 요청: POST /api/auth/login { email, password }
 * 응답: 200 { accessToken } → 토큰 보관 후 GET /api/users/me 로 회원 정보를 확인하고 홈으로 이동한다.
 * 실패: 401 INVALID_CREDENTIALS(폼 상단 안내), 400 INVALID_INPUT(필드별 안내)
 */
export function LoginPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [params] = useSearchParams()
  const remembered = localStorage.getItem(rememberKey) ?? ''
  const [form, setForm] = useState({ email: params.get('email') ?? remembered, password: '' })
  const [remember, setRemember] = useState(Boolean(remembered))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  const validators: Record<string, (value: string) => string | undefined> = {
    email: validateEmail,
    password: validateLoginPassword,
  }
  const update = (field: 'email' | 'password', value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    // 이미 에러를 보여 준 필드만 입력 중에 다시 검사해, 타이핑 도중 성급한 경고를 띄우지 않는다.
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: validators[field](value) }))
  }
  const blur = (field: 'email' | 'password') =>
    setErrors((previous) => ({ ...previous, [field]: validators[field](form[field]) }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FieldErrors = {
      email: validateEmail(form.email),
      password: validateLoginPassword(form.password),
    }
    setErrors(nextErrors)
    setFormError('')
    if (nextErrors.email || nextErrors.password) return

    setPending(true)
    try {
      const profile = await signIn({ email: form.email.trim(), password: form.password })
      if (remember) localStorage.setItem(rememberKey, form.email.trim())
      else localStorage.removeItem(rememberKey)
      // 로그인에 성공하면 원래 가려던 화면, 없으면 홈으로 보낸다.
      navigate(takeReturnPath(profile?.role === 'ADMIN' ? '/admin' : '/'), { replace: true })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0)
        setErrors(apiError.fieldErrors)
      setFormError(
        apiError.status === 401 ? '이메일 또는 비밀번호가 일치하지 않습니다.' : apiError.message,
      )
    } finally {
      setPending(false)
    }
  }

  // 이미 로그인한 상태로 들어오면 홈으로 돌려보낸다.
  if (session) return <Navigate replace to="/" />

  return (
    <AuthLayout
      description="예약 내역과 문의를 이어서 확인하세요."
      eyebrow="MEMBER LOGIN"
      footer={
        <>
          아직 회원이 아니신가요?{' '}
          <Link className="font-medium text-gold-500" to="/signup">
            회원가입
          </Link>
        </>
      }
      story={{
        eyebrow: 'MINDFUL STAY, DEEP SILENCE',
        title: (
          <>
            Return to
            <br />
            Stillness
          </>
        ),
        body: '조용한 머무름은 예약에서 시작됩니다. 로그인하시면 예약 내역과 문의를 한 곳에서 이어 관리하실 수 있습니다.',
        quote: '“머무는 동안의 고요가 일상까지 이어지도록, MSDS가 곁에서 준비하겠습니다.”',
      }}
      title="로그인"
    >
      <form className="grid gap-5" noValidate onSubmit={submit}>
        <FormField error={errors.email} label="이메일">
          <TextInput
            autoComplete="email"
            className={errors.email ? 'border-error-border' : ''}
            name="email"
            onBlur={() => blur('email')}
            onChange={(event) => update('email', event.target.value)}
            placeholder="guest@msds.co.kr"
            type="email"
            value={form.email}
          />
        </FormField>
        <FormField error={errors.password} label="비밀번호">
          <PasswordInput
            autoComplete="current-password"
            className={errors.password ? 'border-error-border' : ''}
            name="password"
            onBlur={() => blur('password')}
            onChange={(event) => update('password', event.target.value)}
            placeholder="비밀번호"
            value={form.password}
          />
        </FormField>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px] text-secondary">
            <input
              checked={remember}
              className="h-4 w-4 rounded-sm border border-border-subtle accent-navy-900"
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            이메일 기억하기
          </label>
          <button
            className="border-0 bg-transparent p-0 text-[13px] font-medium text-gold-500"
            onClick={() => setNotice('비밀번호 재설정은 준비 중입니다. 문의하기로 연락해 주세요.')}
            type="button"
          >
            비밀번호 찾기
          </button>
        </div>
        {formError && (
          <p className="text-[13px] text-error" role="alert">
            {formError}
          </p>
        )}
        {notice && <p className="text-[13px] text-muted">{notice}</p>}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? '로그인 중…' : '로그인'}
        </Button>
      </form>
    </AuthLayout>
  )
}
