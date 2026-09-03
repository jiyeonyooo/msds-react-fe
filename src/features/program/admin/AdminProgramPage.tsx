import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { ApiError } from '../../../lib/apiError'
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
    <main className="px-6 py-9 lg:px-10 lg:py-11">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
            PROGRAM MANAGEMENT
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-navy-900">프로그램 관리</h1>
          <p className="mt-2 text-sm text-ink-500">프로그램 정보와 신청 가능 인원을 관리합니다.</p>
        </div>
        <Link
          className="text-xs font-medium text-navy-900 underline underline-offset-4"
          to="/programs"
        >
          고객 화면 보기 ↗
        </Link>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="프로그램 요약">
        {[
          ['전체 프로그램', programs.length],
          ['전체 정원', totalCapacity],
          ['현재 신청 인원', totalReservations],
        ].map(([label, value]) => (
          <article className="rounded-lg border border-[#d8d0c2] bg-[#fbfaf6] p-5" key={label}>
            <p className="text-[10px] tracking-[0.14em] text-ink-500">{label}</p>
            <p className="mt-2 font-display text-4xl font-semibold text-navy-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-[#d8d0c2] bg-white p-6">
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] text-gold-500">NEW PROGRAM</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">새 프로그램 등록</h2>
        </div>
        <form
          className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_140px_auto] lg:items-end"
          onSubmit={handleSubmit}
        >
          <label className="text-xs font-medium text-ink-700">
            프로그램명
            <input
              className="mt-2 h-11 w-full rounded-sm border border-[#cfc7ba] px-3 text-sm"
              maxLength={100}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              value={form.name}
            />
          </label>
          <label className="text-xs font-medium text-ink-700">
            이미지 업로드
            <input
              className="mt-2 h-11 w-full rounded-sm border border-[#cfc7ba] px-3 text-sm"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={uploading}
            />
            {form.pictureUrl && (
              <img src={form.pictureUrl} alt="미리보기" className="mt-2 h-20 w-20 rounded-sm object-cover" />
            )}
          </label>
          <label className="text-xs font-medium text-ink-700">
            정원
            <input
              className="mt-2 h-11 w-full rounded-sm border border-[#cfc7ba] px-3 text-sm"
              min={1}
              onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })}
              required
              type="number"
              value={form.capacity}
            />
          </label>
          <Button className="h-11" disabled={saving} type="submit">
            {saving ? '저장 중…' : '프로그램 등록'}
          </Button>
        </form>
      </section>

      {error && (
        <p
          className="mt-5 rounded-sm border border-error-border bg-[#f8eeeb] px-4 py-3 text-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">등록된 프로그램</h2>
          <div
            className="flex rounded-sm border border-[#cfc7ba] bg-white p-1"
            aria-label="상태 필터"
          >
            {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => (
              <button
                className={`px-4 py-2 text-[10px] font-medium tracking-[0.1em] ${
                  filter === status ? 'bg-navy-900 text-white' : 'text-ink-500'
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

        <div className="mt-4 overflow-hidden rounded-lg border border-[#d8d0c2] bg-white">
          {loading ? (
            <p className="p-8 text-center text-sm text-ink-500">프로그램을 불러오는 중입니다…</p>
          ) : filteredPrograms.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-500">조건에 맞는 프로그램이 없습니다.</p>
          ) : (
            filteredPrograms.map((program) => {
              const reserved = program.capacity - program.remain
              return (
                <article
                  className="grid gap-4 border-b border-[#e5dfd4] p-5 last:border-b-0 md:grid-cols-[72px_1fr_auto] md:items-center"
                  key={program.id}
                >
                  <div className="grid size-[72px] place-items-center overflow-hidden rounded-sm bg-[#e8e3d9] text-xs text-ink-500">
                    {program.pictureUrl ? (
                      <img alt="" className="size-full object-cover" src={program.pictureUrl} />
                    ) : (
                      'NO IMAGE'
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-2xl font-semibold">{program.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.1em] ${
                          program.status === 'OPEN'
                            ? 'bg-[#e4eadf] text-[#486043]'
                            : 'bg-[#eee9e1] text-ink-500'
                        }`}
                      >
                        {program.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">
                      정원 {program.capacity}명 · 신청 {reserved}명 · 잔여 {program.remain}명
                    </p>
                    <div className="mt-3 h-1.5 max-w-[384px] overflow-hidden rounded-full bg-[#e9e4da]">
                      <div
                        className="h-full bg-gold-500"
                        style={{
                          width: `${program.capacity ? (reserved / program.capacity) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Link
                      className="inline-flex min-h-10 items-center border border-navy-900 px-4 text-[11px] font-medium"
                      to={`/admin/programs/${program.id}/applications`}
                    >
                      신청자 보기
                    </Link>
                    <button
                      className="min-h-10 border border-error-border px-4 text-[11px] text-error"
                      onClick={() => void handleDelete(program)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>
    </main>
  )
}