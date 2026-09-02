import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminApiError, adminApi } from './api'
import { AdminField, AdminPageHeader, ImageThumb, inputClass, LoadingState, Notice } from './shared'
import type { FacilityCategory, FacilityFormValue, FacilityUpdateRequest } from './types'

const initial: FacilityFormValue = {
  name: '',
  category: 'WELLNESS',
  description: '',
  imageUrl: '',
  active: false,
}
const categories: Record<FacilityCategory, string> = {
  WELLNESS: '웰니스',
  LEISURE: '여가',
  FOOD: '식음료',
  BUSINESS: '비즈니스',
  CONVENIENCE: '편의',
  PARKING: '주차',
  ACCESSIBILITY: '접근성',
  ETC: '기타',
}
function isValidImageUrl(value: string) {
  if (value.startsWith('/')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validate(v: FacilityFormValue, original?: FacilityFormValue) {
  const e: Partial<Record<keyof FacilityFormValue, string>> = {}
  if (!v.name.trim()) e.name = '편의시설명을 입력해 주세요.'
  else if (v.name.trim().length > 100) e.name = '100자 이하로 입력해 주세요.'
  if (v.description.length > 255) e.description = '255자 이하로 입력해 주세요.'
  if (v.imageUrl.length > 512) e.imageUrl = '512자 이하로 입력해 주세요.'
  else if (v.imageUrl && v.imageUrl !== original?.imageUrl && !isValidImageUrl(v.imageUrl))
    e.imageUrl = '올바른 URL을 입력해 주세요.'
  return e
}
export function FacilityFormPage() {
  const { facilityId } = useParams()
  const id = facilityId ? Number(facilityId) : null,
    edit = id !== null,
    navigate = useNavigate()
  const [form, setForm] = useState(initial),
    [base, setBase] = useState(initial),
    [loading, setLoading] = useState(edit),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState(''),
    [errors, setErrors] = useState<ReturnType<typeof validate>>({})
  const dirty = JSON.stringify(form) !== JSON.stringify(base),
    invalid = Object.keys(validate(form, edit ? base : undefined)).length > 0
  useEffect(() => {
    if (!edit || !id) return
    void adminApi
      .facilityDetail(id)
      .then((x) => {
        const v = {
          name: x.name,
          category: x.category,
          description: x.description ?? '',
          imageUrl: x.imageUrl ?? '',
          active: x.active ?? true,
        }
        setForm(v)
        setBase(v)
      })
      .catch((e: AdminApiError) =>
        setMessage(
          e.status === 404
            ? '편의시설 상세 관리자 API가 필요하거나 항목을 찾을 수 없습니다.'
            : e.message,
        ),
      )
      .finally(() => setLoading(false))
  }, [edit, id])
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    addEventListener('beforeunload', guard)
    return () => removeEventListener('beforeunload', guard)
  }, [dirty])
  const set = <K extends keyof FacilityFormValue>(k: K, v: FacilityFormValue[K]) => {
    setForm((x) => ({ ...x, [k]: v }))
    setMessage('')
  }
  const patch = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(form) as (keyof FacilityFormValue)[])
          .filter((k) => form[k] !== base[k])
          .map((k) => [k, form[k]]),
      ) as FacilityUpdateRequest,
    [form, base],
  )
  async function submit(e: FormEvent) {
    e.preventDefault()
    const next = validate(form, edit ? base : undefined)
    setErrors(next)
    if (Object.keys(next).length) return
    setPending(true)
    try {
      const body = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        active: form.active,
      }
      const result =
        edit && id ? await adminApi.updateFacility(id, patch) : await adminApi.createFacility(body)
      const v = {
        name: result.name,
        category: result.category,
        description: result.description ?? '',
        imageUrl: result.imageUrl ?? '',
        active: result.active,
      }
      setForm(v)
      setBase(v)
      if (edit) setMessage('편의시설 정보가 저장되었습니다.')
      else navigate('/admin/facilities', { replace: true })
    } catch (err) {
      const a = err as AdminApiError
      if (a.status === 409) setErrors((x) => ({ ...x, name: '이미 등록된 편의시설명입니다.' }))
      setMessage(a.status === 404 ? '요청한 항목을 찾을 수 없습니다.' : a.message)
    } finally {
      setPending(false)
    }
  }
  if (loading)
    return (
      <section>
        <LoadingState />
      </section>
    )
  return (
    <section className="pb-24 md:pb-0">
      <AdminPageHeader
        eyebrow={edit ? 'EDIT FACILITY' : 'NEW FACILITY'}
        title={edit ? '편의시설 수정' : '편의시설 등록'}
      />
      <div className="mx-auto w-full max-w-4xl">
        {message && <Notice error={!message.includes('저장되었습니다')}>{message}</Notice>}
        <form className="grid gap-6" onSubmit={submit} noValidate>
          <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="m-0 border-b border-slate-100 pb-4 text-base font-semibold text-[#172b44]">
              기본 정보
            </h2>
            <AdminField label="편의시설명" required error={errors.name}>
              <input
                className={inputClass}
                maxLength={100}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </AdminField>
            <AdminField label="카테고리" required>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => set('category', e.target.value as FacilityCategory)}
              >
                {Object.entries(categories).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="설명" error={errors.description}>
              <textarea
                className={`${inputClass} min-h-28`}
                maxLength={255}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
              <span className="mt-1 block text-right text-xs text-muted">
                {form.description.length}/255
              </span>
            </AdminField>
          </section>
          <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:p-6">
            <div>
              <h2 className="mt-0 border-b border-slate-100 pb-4 text-base font-semibold text-[#172b44]">
                노출 정보
              </h2>
              <AdminField label="이미지 URL" error={errors.imageUrl}>
                <input
                  className={inputClass}
                  type="url"
                  maxLength={512}
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={(e) => set('imageUrl', e.target.value)}
                />
              </AdminField>
              <label className="mt-5 flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={form.active}
                  onChange={(e) => set('active', e.target.checked)}
                />
                일반 서비스에 노출
              </label>
            </div>
            <ImageThumb src={form.imageUrl} alt="이미지 미리보기" />
          </section>
          {edit && base.imageUrl && !form.imageUrl && (
            <Notice>
              현재 API 계약에서는 저장된 이미지 URL을 완전히 삭제할 수 없습니다. 다른 URL로 교체해
              주세요.
            </Notice>
          )}
          <div className="fixed inset-x-0 bottom-0 z-10 flex justify-end gap-2 border-t border-slate-200 bg-white p-4 shadow-lg md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <button
              type="button"
              className="min-h-11 rounded-sm border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                if (
                  !dirty ||
                  confirm('저장하지 않은 변경사항이 있습니다. 페이지를 나가시겠습니까?')
                )
                  navigate('/admin/facilities')
              }}
            >
              취소
            </button>
            <button
              className="min-h-11 rounded-sm bg-[#172b44] px-6 text-sm font-medium text-white hover:bg-[#253f5d] disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={pending || invalid || (edit && !dirty)}
            >
              {pending ? '저장 중입니다…' : edit ? '변경사항 저장' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
