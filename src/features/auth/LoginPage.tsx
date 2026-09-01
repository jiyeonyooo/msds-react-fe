import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthApiError, signIn, signOut } from './api'
import { AuthLayout } from './AuthLayout'
import { FormField } from './FormField'
import { takeReturnPath } from './session'
import type { FieldErrors, UserProfile } from './types'
import { useSession } from './useSession'
import { validateEmail, validateLoginPassword } from './validation'

const primaryButton =
  'rounded-sm bg-navy-900 px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:bg-[#bdbbb6]'

/**
 * 로그인 화면.
 *
 * 요청: POST /api/auth/login { email, password }
 * 응답: 200 { accessToken } → 토큰 보관 후 GET /api/users/me 로 로그인 결과(회원 정보)까지 확인한다.
 * 실패: 401 INVALID_CREDENTIALS(폼 상단 안내), 400 INVALID_INPUT(필드별 안내)
 */
export function LoginPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ email: params.get('email') ?? '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<UserProfile | null | undefined>(undefined)

  const validators: Record<string, (value: string) => string | undefined> = {
    email: validateEmail,
    password: validateLoginPassword,
  }
  const update = (field: 'email' | 'password', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // 이미 에러를 보여 준 필드만 입력 중에 다시 검사해, 타이핑 도중 성급한 경고를 띄우지 않는다.
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validators[field](value) }))
  }
  const blur = (field: 'email' | 'password') =>
    setErrors((prev) => ({ ...prev, [field]: validators[field](form[field]) }))

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
      setResult(profile)
    } catch (error) {
      const apiError = error as AuthApiError
      if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0)
        setErrors(apiError.fieldErrors)
      setFormError(
        apiError.status === 401
          ? '이메일 또는 비밀번호가 일치하지 않습니다.'
          : (apiError.message ?? '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      )
    } finally {
      setPending(false)
    }
  }

  // 로그인 성공 직후: 서버가 돌려준 회원 정보를 그대로 보여 준 뒤 원래 가려던 화면으로 보낸다.
  if (result !== undefined || session)
    return (
      <AuthLayout
        eyebrow="SIGNED IN"
        title="로그인 완료"
        description="서버에서 확인한 회원 정보입니다."
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-muted">
          <dt>이메일</dt>
          <dd>{result?.email ?? session?.user?.email ?? '-'}</dd>
          <dt>이름</dt>
          <dd>{result?.name ?? session?.user?.name ?? '-'}</dd>
          <dt>연락처</dt>
          <dd>{result?.phoneNumber ?? session?.user?.phoneNumber ?? '-'}</dd>
          <dt>권한</dt>
          <dd>{result?.role ?? session?.user?.role ?? '-'}</dd>
        </dl>
        {!(result ?? session?.user) && (
          <p className="mt-4 text-[13px] text-muted">
            로그인은 성공했지만 회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            className="border-0 bg-transparent p-0 text-xs tracking-[0.14em] text-muted"
            onClick={() => void signOut().then(() => setResult(undefined))}
            type="button"
          >
            로그아웃
          </button>
          <button
            className={primaryButton}
            onClick={() => navigate(takeReturnPath())}
            type="button"
          >
            이어서 이용하기
          </button>
        </div>
      </AuthLayout>
    )

  return (
    <AuthLayout
      eyebrow="MEMBER LOGIN"
      title="로그인"
      description="예약 확정과 내 예약 조회에는 로그인이 필요합니다."
      footer={
        <>
          아직 회원이 아니신가요?{' '}
          <Link className="text-gold-500" to="/signup">
            회원가입
          </Link>
        </>
      }
    >
      <form className="grid gap-[18px]" noValidate onSubmit={submit}>
        <FormField
          autoComplete="email"
          error={errors.email}
          label="EMAIL"
          name="email"
          onBlur={() => blur('email')}
          onChange={(event) => update('email', event.target.value)}
          placeholder="guest@msds.co.kr"
          type="email"
          value={form.email}
        />
        <FormField
          autoComplete="current-password"
          error={errors.password}
          label="PASSWORD"
          name="password"
          onBlur={() => blur('password')}
          onChange={(event) => update('password', event.target.value)}
          placeholder="비밀번호"
          type="password"
          value={form.password}
        />
        {formError && (
          <p className="text-[13px] text-error" role="alert">
            {formError}
          </p>
        )}
        <button className={primaryButton} disabled={pending}>
          {pending ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </AuthLayout>
  )
}
