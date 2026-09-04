import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui'
import {
  AdminEmptyState,
  AdminPageHeading,
  AdminPanel,
  AdminSummaryCard,
  adminSectionTitleClass,
  inputClass,
} from '../../admin/shared'
import { ApiError } from '../../../lib/apiError'
import { resolveProgramImageUrl } from '../../../lib/imageUrl'
import { createProgram, deleteProgram, getPrograms, uploadProgramImage } from '../program'
import type { ProgramCreateRequest, ProgramResponse, ProgramStatus } from '../types'
import { isAxiosError } from 'axios'

type StatusFilter = 'ALL' | ProgramStatus

const emptyForm: ProgramCreateRequest = { name: '', pictureUrl: '', capacity: 10 }

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) return '관리자 권한이 필요합니다.'
    const backendMessage = error.response?.data?.message
    if (typeof backendMessage === 'string' && backendMessage) return backendMessage
  }
  if (error instanceof ApiError) {
    if (error.status === 403) return '관리자 권한이 필요합니다.'
    if (error.message) return error.message
  }
  return error instanceof Error && error.message ? error.message : '요청을 처리하지 못했습니다.'
}

export function AdminProgramPage() {
  const [programs, setPrograms] = useState<ProgramResponse[]>([])
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [form, setForm] = useState<ProgramCreateRequest>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const imageUrl = await uploadProgramImage(file)
      setForm((prev) => ({ ...prev, pictureUrl: imageUrl }))
    } catch (uploadError) {
      setError(errorMessage(uploadError))
    } finally {
      setUploading(false)
    }
  }

  const loadPrograms = async () => {
    try {
      setError('')
      setPrograms(await getPrograms())
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getPrograms()
      .then((programList) => {
        if (active) setPrograms(programList)
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filteredPrograms = useMemo(
    () => programs.filter((program) => filter === 'ALL' || program.status === filter),
    [filter, programs],
  )
  const totalCapacity = programs.reduce((sum, program) => sum + program.capacity, 0)
  const totalReservations = programs.reduce(
    (sum, program) => sum + program.capacity - program.remain,
    0,
  )

  const resetForm = () => {
    setForm(emptyForm)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const request = {
        ...form,
        name: form.name.trim(),
        pictureUrl: form.pictureUrl?.trim() || undefined,
      }
      await createProgram(request)
      resetForm()
      await loadPrograms()
    } catch (saveError) {
      setError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (program: ProgramResponse) => {
    if (!window.confirm(`'${program.name}' 프로그램을 삭제할까요?`)) return
    try {
      setError('')
      await deleteProgram(program.id)
      await loadPrograms()
    } catch (deleteError) {
      setError(errorMessage(deleteError))
    }
  }

  return (
    <section>
      <AdminPageHeading
        action={
          <Link
            className="text-xs font-medium text-[#172b44] underline underline-offset-4"
            to="/programs"
          >
            고객 화면 보기 ↗
          </Link>
        }
        description="프로그램 정보와 신청 가능 인원을 관리합니다."
        eyebrow="PROGRAM MANAGEMENT"
        title="프로그램 관리"
      />

      <div className="grid gap-3 sm:grid-cols-3" aria-label="프로그램 요약">
        {(
          [
            ['전체 프로그램', programs.length, '개'],
            ['전체 정원', totalCapacity, '명'],
            ['현재 신청 인원', totalReservations, '명'],
          ] as const
        ).map(([label, value, unit]) => (
          <AdminSummaryCard key={label} label={label} unit={unit} value={value} />
        ))}
      </div>

      <div className="mt-4">
        <AdminPanel title="새 프로그램 등록">
          <form
            className="grid gap-4 lg:grid-cols-[1fr_1fr_140px_auto] lg:items-start"
            onSubmit={handleSubmit}
          >
            <label className="text-sm font-medium text-slate-700">
              프로그램명
              <input
                className={inputClass}
                maxLength={100}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                value={form.name}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              이미지 업로드
              <input
                className={inputClass}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={uploading}
              />
              {form.pictureUrl && (
                <img
                  src={resolveProgramImageUrl(form.pictureUrl)}
                  alt="미리보기"
                  className="mt-2 h-20 w-20 rounded-sm object-cover"
                />
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              정원
              <input
                className={inputClass}
                min={1}
                onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })}
                required
                type="number"
                value={form.capacity}
              />
            </label>
            <Button className="h-11 lg:mt-7" disabled={saving} type="submit">
              {saving ? '저장 중…' : '프로그램 등록'}
            </Button>
          </form>
        </AdminPanel>
      </div>

      {error && (
        <p
          className="mt-4 rounded-lg border border-[#ead8d2] bg-[#fffaf8] px-4 py-3 text-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className={adminSectionTitleClass}>등록된 프로그램</h2>
          <div
            className="flex rounded-sm border border-slate-300 bg-white p-1"
            aria-label="상태 필터"
          >
            {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => (
              <button
                className={`px-4 py-2 text-[11px] font-medium tracking-[0.1em] ${
                  filter === status ? 'bg-[#172b44] text-white' : 'text-slate-600'
                }`}
                key={status}
                onClick={() => setFilter(status)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading || filteredPrograms.length === 0 ? (
          <div className="mt-4">
            <AdminEmptyState>
              {loading ? '프로그램을 불러오는 중입니다…' : '조건에 맞는 프로그램이 없습니다.'}
            </AdminEmptyState>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {filteredPrograms.map((program) => {
              const reserved = program.capacity - program.remain
              return (
                <article
                  className="grid gap-4 border-b border-slate-200 p-5 last:border-b-0 md:grid-cols-[72px_1fr_auto] md:items-center"
                  key={program.id}
                >
                  <div className="grid size-[72px] place-items-center overflow-hidden rounded-sm bg-slate-100 text-[10px] text-slate-400">
                    {program.pictureUrl ? (
                      <img alt="" className="size-full object-cover" src={resolveProgramImageUrl(program.pictureUrl)} />
                    ) : (
                      'NO IMAGE'
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-[#172b44]">{program.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.1em] ${
                          program.status === 'OPEN'
                            ? 'bg-[#172b44] text-white'
                            : 'border border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        {program.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      정원 {program.capacity}명 · 신청 {reserved}명 · 잔여 {program.remain}명
                    </p>
                    <div className="mt-3 h-1.5 max-w-[384px] overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-[#a77f3b]"
                        style={{
                          width: `${program.capacity ? (reserved / program.capacity) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Link
                      className="inline-flex min-h-10 items-center rounded-sm border border-[#172b44] px-4 text-[11px] font-medium text-[#172b44]"
                      to={`/admin/programs/${program.id}/applications`}
                    >
                      신청자 보기
                    </Link>
                    <button
                      className="min-h-10 rounded-sm border border-error-border px-4 text-[11px] text-error"
                      onClick={() => void handleDelete(program)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}
