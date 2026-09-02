import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FormField, Textarea, TextInput } from '../../components/ui'
import { ApiError, type FieldErrors } from '../../lib/apiError'
import { AccountLayout, HeroAction } from '../account/AccountLayout'
import { inquiryApi } from './api'

/**
 * 문의 작성 화면.
 *
 * 요청: POST /api/inquiries { title, content }
 * 서버 제약: 제목 필수·100자 이내, 내용 필수·2,000자 이내.
 */
export function InquiryNewPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  const validate = (field: 'title' | 'content', values: typeof form) => {
    if (field === 'title') {
      if (!values.title.trim()) return '제목은 필수 입력값입니다.'
      if (values.title.trim().length > 100) return '제목은 100자를 초과할 수 없습니다.'
      return undefined
    }
    if (!values.content.trim()) return '내용은 필수 입력값입니다.'
    if (values.content.trim().length > 2000) return '내용은 2,000자를 초과할 수 없습니다.'
    return undefined
  }
  const update = (field: 'title' | 'content', value: string) => {
    const values = { ...form, [field]: value }
    setForm(values)
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: validate(field, values) }))
  }
  const blur = (field: 'title' | 'content') =>
    setErrors((previous) => ({ ...previous, [field]: validate(field, form) }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FieldErrors = {
      title: validate('title', form),
      content: validate('content', form),
    }
    setErrors(nextErrors)
    setFormError('')
    if (Object.values(nextErrors).some(Boolean)) return

    setPending(true)
    try {
      const response = await inquiryApi.create({
        title: form.title.trim(),
        content: form.content.trim(),
      })
      navigate(`/inquiries/${response.data.inquiryId}`)
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
      description="머무름과 프로그램에 대해 궁금한 점을 남겨 주시면 확인 후 답변을 드립니다."
      eyebrow="NEW INQUIRY"
      hero={<HeroAction badge="LIST" label="목록으로 돌아가기" to="/inquiries" />}
      title="문의 작성"
    >
      <form
        className="grid gap-[18px] rounded-xl border border-border-subtle bg-white p-9"
        noValidate
        onSubmit={submit}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
              Write an Inquiry
            </h2>
            <p className="text-xs leading-5 text-secondary">
              답변은 마이페이지의 내 문의에서 확인하실 수 있습니다.
            </p>
          </div>
          <span className="flex h-8 items-center rounded-full bg-subtle px-4 text-[9px] font-medium tracking-[0.07em] text-gold-500">
            POST /api/inquiries
          </span>
        </div>
        <span className="h-px w-full bg-border-subtle" />
        <FormField error={errors.title} hint={`${form.title.length}/100자`} label="제목">
          <TextInput
            className={errors.title ? 'border-error-border' : ''}
            maxLength={100}
            name="title"
            onBlur={() => blur('title')}
            onChange={(event) => update('title', event.target.value)}
            placeholder="문의 제목을 입력해 주세요"
            value={form.title}
          />
        </FormField>
        <FormField error={errors.content} hint={`${form.content.length}/2,000자`} label="내용">
          <Textarea
            className={errors.content ? 'border-error-border' : ''}
            maxLength={2000}
            name="content"
            onBlur={() => blur('content')}
            onChange={(event) => update('content', event.target.value)}
            placeholder="문의하실 내용을 자세히 적어 주세요."
            value={form.content}
          />
        </FormField>
        {formError && (
          <p className="text-[13px] text-error" role="alert">
            {formError}
          </p>
        )}
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <p className="flex-1 text-[11px] leading-[18px] text-muted">
            등록하신 문의는 답변 전까지 대기 상태로 표시됩니다.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/inquiries')} size="sm" variant="secondary">
              취소
            </Button>
            <Button disabled={pending} size="sm" type="submit">
              {pending ? '등록 중…' : '문의 등록'}
            </Button>
          </div>
        </div>
      </form>
    </AccountLayout>
  )
}
