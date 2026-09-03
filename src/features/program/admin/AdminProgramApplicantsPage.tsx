import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../lib/apiError'
import { getProgramApplications, getPrograms } from '../program'
import type {
  ProgramApplicationResponse,
  ProgramReservationStatus,
  ProgramResponse,
} from '../types'

type ApplicantFilter = 'ALL' | ProgramReservationStatus

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AdminProgramApplicantsPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const selectedId = Number(programId)
  const [programs, setPrograms] = useState<ProgramResponse[]>([])
  const [applications, setApplications] = useState<ProgramApplicationResponse[]>([])
  const [filter, setFilter] = useState<ApplicantFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getPrograms(), getProgramApplications(selectedId)])
      .then(([programList, applicationList]) => {
        if (!active) return
        setPrograms(programList)
        setApplications(applicationList)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        if (loadError instanceof ApiError && loadError.status === 403) {
          setError('관리자 권한이 필요합니다.')
        } else {
          setError(
            loadError instanceof Error && loadError.message
              ? loadError.message
              : '신청자 정보를 불러오지 못했습니다.',
          )
        }
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [selectedId])

  const selectedProgram = programs.find((program) => program.id === selectedId)
  const filteredApplications = useMemo(
    () => applications.filter((item) => filter === 'ALL' || item.status === filter),
    [applications, filter],
  )
  const reservedApplications = applications.filter((item) => item.status === 'RESERVED')
  const participantCount = reservedApplications.reduce((sum, item) => sum + item.quantity, 0)
  const cancelledCount = applications.filter((item) => item.status === 'CANCELLED').length

  return (
    <main className="px-6 py-9 lg:px-10 lg:py-11">
      <Link className="text-xs text-ink-500 hover:text-navy-900" to="/admin/programs">
        ← 프로그램 관리
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
            PROGRAM APPLICANTS
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-navy-900">신청자 관리</h1>
          <p className="mt-2 text-sm text-ink-500">프로그램별 신청 및 취소 현황을 확인합니다.</p>
        </div>
        <label className="text-xs font-medium text-ink-700">
          프로그램 선택
          <select
            className="mt-2 block h-11 min-w-[260px] rounded-sm border border-[#cfc7ba] bg-white px-3 text-sm"
            onChange={(event) => {
              setLoading(true)
              setError('')
              navigate(`/admin/programs/${event.target.value}/applications`)
            }}
            value={Number.isInteger(selectedId) ? selectedId : ''}
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="신청자 요약">
        {[
          ['현재 참여 인원', `${participantCount}명`],
          ['유효 신청 건', `${reservedApplications.length}건`],
          ['취소 건', `${cancelledCount}건`],
        ].map(([label, value]) => (
          <article className="rounded-lg border border-[#d8d0c2] bg-[#fbfaf6] p-5" key={label}>
            <p className="text-[10px] tracking-[0.14em] text-ink-500">{label}</p>
            <p className="mt-2 font-display text-4xl font-semibold text-navy-900">{value}</p>
          </article>
        ))}
      </section>

      {selectedProgram && (
        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-navy-900 px-6 py-5 text-white">
          <div>
            <p className="text-[10px] tracking-[0.15em] text-gold-300">SELECTED PROGRAM</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{selectedProgram.name}</h2>
          </div>
          <p className="text-xs text-white/70">
            정원 {selectedProgram.capacity}명 · 잔여 {selectedProgram.remain}명
          </p>
        </section>
      )}

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
          <h2 className="font-display text-2xl font-semibold">신청 내역</h2>
          <div
            className="flex rounded-sm border border-[#cfc7ba] bg-white p-1"
            aria-label="신청 상태 필터"
          >
            {(['ALL', 'RESERVED', 'CANCELLED'] as const).map((status) => (
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

        <div className="mt-4 overflow-x-auto rounded-lg border border-[#d8d0c2] bg-white">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead className="bg-[#f0ece4] text-[10px] tracking-[0.12em] text-ink-500">
              <tr>
                <th className="px-5 py-4 font-medium">신청자</th>
                <th className="px-5 py-4 font-medium">인원</th>
                <th className="px-5 py-4 font-medium">신청 일시</th>
                <th className="px-5 py-4 font-medium">취소 일시</th>
                <th className="px-5 py-4 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-ink-500" colSpan={5}>
                    신청자 정보를 불러오는 중입니다…
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-ink-500" colSpan={5}>
                    조건에 맞는 신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr className="border-t border-[#e5dfd4] text-sm" key={application.reservationId}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-navy-900">{application.name}</p>
                      <p className="mt-1 text-xs text-ink-500">{application.email}</p>
                    </td>
                    <td className="px-5 py-4">{application.quantity}명</td>
                    <td className="px-5 py-4 text-xs text-ink-500">
                      {formatDate(application.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-500">
                      {formatDate(application.cancelledAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.1em] ${
                          application.status === 'RESERVED'
                            ? 'bg-[#e4eadf] text-[#486043]'
                            : 'bg-[#eee9e1] text-ink-500'
                        }`}
                      >
                        {application.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
