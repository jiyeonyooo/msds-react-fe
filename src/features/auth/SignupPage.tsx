import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthApiError, authApi } from './api'
import { AuthLayout } from './AuthLayout'
import { FormField } from './FormField'
import type { FieldErrors } from './types'
import {
  formatPhoneNumber,
  passwordPolicy,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirm,
  validatePhoneNumber,
} from './validation'

const primaryButton =
  'rounded-sm bg-navy-900 px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:bg-[#bdbbb6]'

type SignupForm = {
  email: string
  password: string
  passwordConfirm: string
  name: string
  phoneNumber: string
}
const emptyForm: SignupForm = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phoneNumber: '',
}

/**
 * 회원가입 화면.
 *
 * 요청: POST /api/auth/signup { email, password, name, phoneNumber }
 * 응답: 201 { email } → 가입한 이메일을 채운 채로 로그인 화면으로 이동한다.
 * 실패: 409 DUPLICATE_EMAIL(이메일 필드), 400 INVALID_INPUT(필드별 안내)
 *
 * passwordConfirm은 화면 전용 필드이므로 요청 바디에 포함하지 않는다.
 */
export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupForm>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [signedUpEmail, setSignedUpEmail] = useState('')

  const validate = (field: keyof SignupForm, values: SignupForm): string | undefined => {
    if (field === 'email') return validateEmail(values.email)
    if (field === 'password') return validateNewPassword(values.password)
    if (field === 'passwordConfirm')
      return validatePasswordConfirm(values.password, values.passwordConfirm)
    if (field === 'name') return validateName(values.name)
    return validatePhoneNumber(values.phoneNumber)
  }
  const update = (field: keyof SignupForm, rawValue: string) => {
    const value = field === 'phoneNumber' ? formatPhoneNumber(rawValue) : rawValue
    const values = { ...form, [field]: value }
    setForm(values)
    setErrors((prev) => ({
      // 이미 에러를 보여 준 필드만 입력 중에 다시 검사한다.
      ...prev,
      [field]: prev[field] ? validate(field, values) : prev[field],
      // 비밀번호를 고치면 확인 필드의 일치 여부도 함께 갱신한다.
      passwordConfirm:
        field === 'password' && prev.passwordConfirm
          ? validate('passwordConfirm', values)
          : prev.passwordConfirm,
    }))
  }
  const blur = (field: keyof SignupForm) =>
    setErrors((prev) => ({ ...prev, [field]: validate(field, form) }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FieldErrors = {
      email: validate('email', form),
      password: validate('password', form),
      passwordConfirm: validate('passwordConfirm', form),
      name: validate('name', form),
      phoneNumber: validate('phoneNumber', form),
    }
    setErrors(nextErrors)
    setFormError('')
    if (Object.values(nextErrors).some(Boolean)) return

    setPending(true)
    try {
      const response = await authApi.signup({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
      })
      setSignedUpEmail(response.data.email)
    } catch (error) {
      const apiError = error as AuthApiError
      if (apiError.code === 'DUPLICATE_EMAIL')
        setErrors((prev) => ({ ...prev, email: apiError.message }))
      else if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0)
        setErrors(apiError.fieldErrors)
      else setFormError(apiError.message ?? '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setPending(false)
    }
  }

  if (signedUpEmail)
    return (
      <AuthLayout
        eyebrow="WELCOME"
        title="회원가입 완료"
        description="이제 가입하신 계정으로 로그인할 수 있습니다."
      >
        <p className="text-sm">
          <strong className="font-medium">{signedUpEmail}</strong> 계정이 생성되었습니다.
        </p>
        <button
          className={`${primaryButton} mt-6 w-full`}
          onClick={() => navigate(`/login?email=${encodeURIComponent(signedUpEmail)}`)}
          type="button"
        >
          로그인하러 가기
        </button>
      </AuthLayout>
    )

  return (
    <AuthLayout
      eyebrow="CREATE ACCOUNT"
      title="회원가입"
      description="예약과 문의 내역을 이어서 관리하시려면 계정을 만들어 주세요."
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link className="text-gold-500" to="/login">
            로그인
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
          autoComplete="new-password"
          error={errors.password}
          hint={passwordPolicy}
          label="PASSWORD"
          name="password"
          onBlur={() => blur('password')}
          onChange={(event) => update('password', event.target.value)}
          placeholder="비밀번호"
          type="password"
          value={form.password}
        />
        <FormField
          autoComplete="new-password"
          error={errors.passwordConfirm}
          label="PASSWORD CONFIRM"
          name="passwordConfirm"
          onBlur={() => blur('passwordConfirm')}
          onChange={(event) => update('passwordConfirm', event.target.value)}
          placeholder="비밀번호 확인"
          type="password"
          value={form.passwordConfirm}
        />
        <FormField
          autoComplete="name"
          error={errors.name}
          label="NAME"
          maxLength={50}
          name="name"
          onBlur={() => blur('name')}
          onChange={(event) => update('name', event.target.value)}
          placeholder="예약자 성함"
          value={form.name}
        />
        <FormField
          autoComplete="tel"
          error={errors.phoneNumber}
          hint="숫자만 입력하면 010-1234-5678 형식으로 자동 정리됩니다."
          inputMode="numeric"
          label="PHONE"
          name="phoneNumber"
          onBlur={() => blur('phoneNumber')}
          onChange={(event) => update('phoneNumber', event.target.value)}
          placeholder="010-1234-5678"
          value={form.phoneNumber}
        />
        {formError && (
          <p className="text-[13px] text-error" role="alert">
            {formError}
          </p>
        )}
        <button className={primaryButton} disabled={pending}>
          {pending ? '가입 중…' : '회원가입'}
        </button>
      </form>
    </AuthLayout>
  )
}
