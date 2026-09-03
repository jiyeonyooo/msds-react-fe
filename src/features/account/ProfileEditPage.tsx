import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FormField, TextInput } from '../../components/ui'
import { ApiError, type FieldErrors } from '../../lib/apiError'
import { setSession } from '../auth/session'
import { useSession } from '../auth/useSession'
import { formatPhoneNumber, validateName, validatePhoneNumber } from '../auth/validation'
import { accountApi } from './api'
import { AccountLayout, BackToMyPage } from './AccountLayout'

/**
 * 정보 수정 화면.
 *
 * 요청: PATCH /api/users/me { name, phoneNumber }
 * 이메일은 로그인 아이디라 서버가 수정 대상으로 받지 않으므로 읽기 전용으로 보여 준다.
 */
export function ProfileEditPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [form, setForm] = useState({
    name: session?.user?.name ?? '',
    phoneNumber: session?.user?.phoneNumber ?? '',
  })
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    void accountApi
      .me()
      .then((response) => {
        setEmail(response.data.email)
        setForm({ name: response.data.name, phoneNumber: response.data.phoneNumber })
      })
      .catch((cause) => setFormError((cause as ApiError).message))
  }, [])

  const validate = (field: 'name' | 'phoneNumber', values: typeof form) =>
    field === 'name' ? validateName(values.name) : validatePhoneNumber(values.phoneNumber)
  const update = (field: 'name' | 'phoneNumber', rawValue: string) => {
    const value = field === 'phoneNumber' ? formatPhoneNumber(rawValue) : rawValue
    const values = { ...form, [field]: value }
    setForm(values)
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: validate(field, values) }))
  }
  const blur = (field: 'name' | 'phoneNumber') =>
    setErrors((previous) => ({ ...previous, [field]: validate(field, form) }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FieldErrors = {
      name: validate('name', form),
      phoneNumber: validate('phoneNumber', form),
    }
    setErrors(nextErrors)
    setFormError('')
    if (Object.values(nextErrors).some(Boolean)) return

    setPending(true)
    try {
      await accountApi.update({ name: form.name.trim(), phoneNumber: form.phoneNumber.trim() })
      // 헤더 등 다른 화면이 보는 세션 정보도 최신 값으로 맞춘다.
      const refreshed = await accountApi.me()
      if (session) setSession(session.accessToken, refreshed.data)
      navigate('/mypage')
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0)
        setErrors(apiError.fieldErrors)
      else setFormError(apiError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <AccountLayout
      description="이름과 전화번호를 최신 정보로 유지하면 예약 안내를 정확하게 받아보실 수 있습니다."
      eyebrow="EDIT PROFILE"
      hero={<BackToMyPage />}
      title="회원 정보 수정"
    >
      <form
        className="grid gap-[18px] rounded-xl border border-border-subtle bg-white p-9"
        noValidate
        onSubmit={submit}
      >
        <div>
          <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
            Profile Details
          </h2>
          <p className="text-xs leading-5 text-secondary">
            변경할 항목만 수정하고 저장하세요. 비워 둔 항목은 기존 값이 유지됩니다.
          </p>
        </div>
        <span className="h-px w-full bg-border-subtle" />
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium tracking-[0.05em] text-muted">이메일</span>
            <span className="flex h-[22px] items-center rounded-full bg-subtle px-2.5 text-[8px] font-medium tracking-[0.08em] text-gold-500">
              READ ONLY
            </span>
          </div>
          <p className="m-0 flex h-14 items-center rounded-md border border-border-subtle bg-subtle px-4 text-sm text-secondary">
            {email || '-'}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField error={errors.name} label="이름">
            <TextInput
              autoComplete="name"
              className={errors.name ? 'border-error-border' : ''}
              maxLength={50}
              name="name"
              onBlur={() => blur('name')}
              onChange={(event) => update('name', event.target.value)}
              value={form.name}
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
              value={form.phoneNumber}
            />
          </FormField>
        </div>
        <div className="flex items-center gap-[18px] rounded-md bg-subtle px-5 py-[18px]">
          <span className="h-12 w-0.5 shrink-0 bg-gold-500" />
          <div className="grid gap-1">
            <strong className="text-[13px] leading-5 font-medium text-navy-900">
              이메일은 변경할 수 없습니다
            </strong>
            <p className="text-xs leading-[21px] text-secondary">
              이메일은 로그인 아이디로 사용되어 수정 대상에서 제외됩니다. 변경이 필요하시면 문의를
              남겨 주세요.
            </p>
          </div>
        </div>
        {formError && (
          <p className="text-[13px] text-error" role="alert">
            {formError}
          </p>
        )}
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <p className="flex-1 text-[11px] leading-[18px] text-muted">
            저장하면 변경 시각이 회원 정보에 함께 기록됩니다.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/mypage')} size="sm" variant="secondary">
              취소
            </Button>
            <Button disabled={pending} size="sm" type="submit">
              {pending ? '저장 중…' : '변경사항 저장'}
            </Button>
          </div>
        </div>
      </form>
    </AccountLayout>
  )
}
