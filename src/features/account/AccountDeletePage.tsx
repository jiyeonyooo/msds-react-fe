import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FormField, PasswordInput } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { clearSession } from '../auth/session'
import { accountApi } from './api'
import { AccountLayout, BackToMyPage } from './AccountLayout'

/**
 * 회원 탈퇴 화면.
 *
 * 요청: DELETE /api/users/me { password }
 * 서버는 비밀번호를 다시 확인한 뒤 회원과 그 회원의 문의를 함께 삭제한다(복구 불가).
 * 실패: 400 PASSWORD_MISMATCH(비밀번호 필드 안내)
 */
export function AccountDeletePage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPasswordError(password ? '' : '비밀번호는 필수 입력값입니다.')
    setFormError(agreed ? '' : '안내 사항에 동의해 주세요.')
    if (!password || !agreed) return

    setPending(true)
    try {
      await accountApi.remove(password)
      clearSession()
      navigate('/', { replace: true })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.code === 'PASSWORD_MISMATCH' || apiError.status === 400)
        setPasswordError(apiError.message)
      else setFormError(apiError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <AccountLayout
      description="탈퇴하시면 회원 정보와 남기신 문의가 함께 삭제되며 복구할 수 없습니다."
      eyebrow="DELETE ACCOUNT"
      hero={<BackToMyPage />}
      title="회원 탈퇴"
    >
      <form
        className="grid gap-[18px] rounded-xl border border-border-subtle bg-white p-9"
        noValidate
        onSubmit={submit}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
              Account Deletion
            </h2>
            <p className="text-xs leading-5 text-secondary">
              본인 확인을 위해 현재 비밀번호를 다시 입력해 주세요.
            </p>
          </div>
          <span className="flex h-8 items-center rounded-full bg-subtle px-4 text-[9px] font-medium tracking-[0.07em] text-gold-500">
            DELETE /api/users/me
          </span>
        </div>
        <span className="h-px w-full bg-border-subtle" />
        <div className="flex items-center gap-[18px] rounded-md border border-[#d98b82] bg-[#d98b82]/25 px-5 py-[18px]">
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#9c4038] text-lg font-medium text-subtle">
            !
          </span>
          <div className="grid gap-1">
            <strong className="text-sm leading-[22px] font-medium text-[#9c4038]">
              탈퇴 후에는 되돌릴 수 없습니다
            </strong>
            <p className="text-xs leading-[22px] text-secondary">
              회원 정보와 작성하신 문의가 즉시 삭제됩니다. 진행 중인 예약이 있다면 먼저 확인해
              주세요. 같은 이메일로 다시 가입하실 수는 있지만 이전 기록은 복구되지 않습니다.
            </p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField error={passwordError} label="현재 비밀번호">
            <PasswordInput
              autoComplete="current-password"
              className={passwordError ? 'border-error-border' : ''}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              value={password}
            />
          </FormField>
          <div className="grid content-start gap-1.5 rounded-md bg-subtle px-[18px] pt-4 pb-3.5">
            <strong className="text-xs leading-[19px] font-medium text-navy-900">
              본인 확인 안내
            </strong>
            <p className="text-[11px] leading-[19px] text-secondary">
              비밀번호가 일치할 때만 탈퇴가 진행됩니다. 비밀번호가 기억나지 않으시면 문의를 남겨
              주세요.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-3.5 rounded-md border border-border-subtle bg-subtle px-[18px] py-[15px]">
          <input
            checked={agreed}
            className="h-[22px] w-[22px] rounded-sm border border-border-subtle accent-[#9c4038]"
            onChange={(event) => setAgreed(event.target.checked)}
            type="checkbox"
          />
          <span className="grid gap-[3px]">
            <strong className="text-xs leading-[19px] font-medium text-navy-900">
              위 내용을 확인했으며 탈퇴에 동의합니다.
            </strong>
            <span className="text-[10px] leading-[17px] text-muted">
              동의하셔야 탈퇴 버튼이 동작합니다.
            </span>
          </span>
        </label>
        {formError && (
          <p className="text-[13px] text-error" role="alert">
            {formError}
          </p>
        )}
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <p className="flex-1 text-[11px] leading-[18px] text-muted">
            탈퇴 즉시 로그아웃되며 홈 화면으로 이동합니다.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/mypage')} size="sm" variant="secondary">
              취소
            </Button>
            <Button
              className="border-0 bg-[#9c4038] text-white hover:bg-[#83352e]"
              disabled={pending}
              size="sm"
              type="submit"
            >
              {pending ? '처리 중…' : '회원 탈퇴'}
            </Button>
          </div>
        </div>
      </form>
    </AccountLayout>
  )
}
