import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, FormField, PasswordInput, TextInput } from '../../components/ui'
import { ApiError, type FieldErrors } from '../../lib/apiError'
import { authApi } from './api'
import { AuthLayout } from './AuthLayout'
import {
  formatPhoneNumber,
  passwordPolicy,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirm,
  validatePhoneNumber,
} from './validation'

type SignupForm = {
  name: string
  email: string
  phoneNumber: string
  password: string
  passwordConfirm: string
}
const emptyForm: SignupForm = {
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  passwordConfirm: '',
}

/**
 * 회원가입 화면.
 *
 * 요청: POST /api/auth/signup { email, password, name, phoneNumber }
 * 응답: 201 { email } → 가입한 이메일을 채운 채로 로그인 화면으로 이동한다.
 * 실패: 409 DUPLICATE_EMAIL(이메일 필드), 400 INVALID_INPUT(필드별 안내)
 *
 * passwordConfirm은 오타로 인한 가입을 막기 위한 화면 전용 필드이므로 요청 바디에 포함하지 않는다.
 */
export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupForm>(emptyForm)
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)
  const [signedUpEmail, setSignedUpEmail] = useState('')

  const validate = (field: keyof SignupForm, values: SignupForm): string | undefined => {
    if (field === 'name') return validateName(values.name)
    if (field === 'email') return validateEmail(values.email)
    if (field === 'phoneNumber') return validatePhoneNumber(values.phoneNumber)
    if (field === 'passwordConfirm')
      return validatePasswordConfirm(values.password, values.passwordConfirm)
    return validateNewPassword(values.password)
  }
  const update = (field: keyof SignupForm, rawValue: string) => {
    const value = field === 'phoneNumber' ? formatPhoneNumber(rawValue) : rawValue
    const values = { ...form, [field]: value }
    setForm(values)
    setErrors((previous) => ({
      ...previous,
      // 이미 에러를 보여 준 필드만 입력 중에 다시 검사한다.
      [field]: previous[field] ? validate(field, values) : previous[field],
      // 비밀번호를 고치면 확인 필드의 일치 여부도 함께 갱신한다.
      passwordConfirm:
        field === 'password' && previous.passwordConfirm
          ? validate('passwordConfirm', values)
          : previous.passwordConfirm,
    }))
  }
  const blur = (field: keyof SignupForm) =>
    setErrors((previous) => ({ ...previous, [field]: validate(field, form) }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FieldErrors = {
      name: validate('name', form),
      email: validate('email', form),
      phoneNumber: validate('phoneNumber', form),
      password: validate('password', form),
      passwordConfirm: validate('passwordConfirm', form),
    }
    setErrors(nextErrors)
    setFormError(agreed ? '' : '필수 약관에 동의해 주세요.')
    if (Object.values(nextErrors).some(Boolean) || !agreed) return

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
      const apiError = error as ApiError
      if (apiError.code === 'DUPLICATE_EMAIL')
        setErrors((previous) => ({ ...previous, email: apiError.message }))
      else if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0)
        setErrors(apiError.fieldErrors)
      else setFormError(apiError.message)
    } finally {
      setPending(false)
    }
  }

  if (signedUpEmail)
    return (
      <AuthLayout
        description="이제 가입하신 계정으로 로그인할 수 있습니다."
        eyebrow="WELCOME"
        story={story}
        title="가입 완료"
      >
        <div className="grid gap-6">
          <p className="text-sm text-secondary">
            <strong className="font-medium text-navy-900">{signedUpEmail}</strong> 계정이
            생성되었습니다.
          </p>
          <Button
            className="w-full"
            onClick={() => navigate(`/login?email=${encodeURIComponent(signedUpEmail)}`)}
          >
            로그인하러 가기
          </Button>
        </div>
      </AuthLayout>
    )

  return (
    <AuthLayout
      description="예약과 문의 내역을 한 계정으로 관리하세요."
      eyebrow="CREATE ACCOUNT"
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link className="font-medium text-gold-500" to="/login">
            로그인
          </Link>
        </>
      }
      story={story}
      title="회원가입"
    >
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <FormField error={errors.name} label="이름">
          <TextInput
            autoComplete="name"
            className={errors.name ? 'border-error-border' : ''}
            maxLength={50}
            name="name"
            onBlur={() => blur('name')}
            onChange={(event) => update('name', event.target.value)}
            placeholder="예약자 성함"
            value={form.name}
          />
        </FormField>
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
        <FormField
          error={errors.phoneNumber}
          hint="숫자만 입력하면 010-1234-5678 형식으로 자동 정리됩니다."
          label="전화번호"
        >
          <TextInput
            autoComplete="tel"
            className={errors.phoneNumber ? 'border-error-border' : ''}
            inputMode="numeric"
            name="phoneNumber"
            onBlur={() => blur('phoneNumber')}
            onChange={(event) => update('phoneNumber', event.target.value)}
            placeholder="010-1234-5678"
            value={form.phoneNumber}
          />
        </FormField>
        <FormField error={errors.password} hint={passwordPolicy} label="비밀번호">
          <PasswordInput
            autoComplete="new-password"
            className={errors.password ? 'border-error-border' : ''}
            name="password"
            onBlur={() => blur('password')}
            onChange={(event) => update('password', event.target.value)}
            placeholder="비밀번호"
            value={form.password}
          />
        </FormField>
        <FormField error={errors.passwordConfirm} label="비밀번호 확인">
          <PasswordInput
            autoComplete="new-password"
            className={errors.passwordConfirm ? 'border-error-border' : ''}
            name="passwordConfirm"
            onBlur={() => blur('passwordConfirm')}
            onChange={(event) => update('passwordConfirm', event.target.value)}
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            value={form.passwordConfirm}
          />
        </FormField>
        <div className="grid gap-2 rounded-md bg-subtle p-[14px]">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[13px] text-secondary">
              <input
                checked={agreed}
                className="h-[18px] w-[18px] rounded-sm border border-border-subtle accent-navy-900"
                onChange={(event) => setAgreed(event.target.checked)}
                type="checkbox"
              />
              [필수] 이용약관 및 개인정보 수집·이용에 동의합니다.
            </label>
            <button
              className="shrink-0 border-0 bg-transparent p-0 text-xs font-medium text-gold-500"
              onClick={() => setShowTerms((previous) => !previous)}
              type="button"
            >
              약관 보기
            </button>
          </div>
          <p className="text-[11px] leading-[17px] text-muted">
            {showTerms
              ? '수집 항목: 이름, 이메일, 전화번호 / 이용 목적: 회원 식별과 예약·문의 응대 / 보유 기간: 회원 탈퇴 시까지.'
              : '예약 확인과 문의 응대를 위해 이름·이메일·전화번호를 수집합니다.'}
          </p>
        </div>
        {formError && (
          <p className="text-[13px] text-error" role="alert">
            {formError}
          </p>
        )}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? '가입 중…' : '회원가입'}
        </Button>
      </form>
    </AuthLayout>
  )
}

const story = {
  eyebrow: 'BEGIN YOUR QUIET STAY',
  title: (
    <>
      Make Room
      <br />
      for Quiet
    </>
  ),
  body: '회원이 되시면 객실 예약과 웰니스 프로그램, 문의 내역을 하나의 계정으로 이어서 관리하실 수 있습니다.',
  quote: '“천천히 숨을 고르는 시간, 그 준비를 지금 시작해 보세요.”',
}
