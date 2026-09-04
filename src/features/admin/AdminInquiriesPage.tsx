import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { setReturnPath } from '../auth/session'
import type { Inquiry, InquiryStatus } from '../inquiry/types'
import { adminInquiryApi } from './inquiryApi'
import { AdminPageHeading } from './shared'

type StatusFilter = 'ALL' | InquiryStatus

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'WAITING', label: '답변 대기' },
  { value: 'ANSWERED', label: '답변 완료' },
]

// 답변 등록 전에 담당자가 확인해야 할 기준. Figma의 Answer Safeguards 문구를 그대로 옮겼다.
const answerSafeguards = [
  '숙박 일정·요금처럼 확정이 필요한 내용은 예약 정보를 먼저 확인한 뒤 답변합니다.',
  '개인정보(연락처·결제 정보)는 답변 본문에 남기지 않습니다.',
  '답변을 등록하면 문의 상태가 ANSWERED로 바뀌고 회원 문의 상세에 즉시 노출됩니다.',
]

const ANSWER_MIN_LENGTH = 10

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message || fallback : fallback
}

/** "2026-09-01 14:22:00" 형태의 서버 응답을 목록/상세에서 읽기 좋은 형태로 바꾼다. */
function formatDateTime(value: string | null) {
  if (!value) return '-'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)
  return match ? `${match[1]}. ${match[2]}. ${match[3]}. ${match[4]}:${match[5]}` : value
}

export function AdminInquiriesPage() {
  const { inquiryId } = useParams()
  return inquiryId ? <AdminInquiryDetailPage inquiryId={inquiryId} /> : <AdminInquiryListPage />
}

function AdminInquiryListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '')

  const rawStatus = searchParams.get('status') ?? 'ALL'
  const status = (statusFilters.some((filter) => filter.value === rawStatus) ? rawStatus : 'ALL') as StatusFilter
  const search = searchParams.get('keyword')?.trim().toLowerCase() ?? ''

  useEffect(() => {
    const load = async () => {
      setLoading(true); setMessage('')
      try {
        // 상태 집계를 항상 정확하게 보여주기 위해 전체 목록을 한 번에 받아 화면에서 걸러 쓴다.
        // (서버는 GET /api/admin/inquiries?status=WAITING 형태의 필터도 지원한다)
        const response = await adminInquiryApi.list()
        setInquiries(response.data)
      } catch (error) {
        const apiError = error as ApiError
        if (apiError.status === 401) {
          setReturnPath('/admin/inquiries')
          navigate('/login', { replace: true })
          return
        }
        setInquiries([])
        setMessage(apiError.status === 403 ? '문의 관리 권한이 없습니다.' : errorMessage(error, '문의 목록을 불러오지 못했습니다.'))
      } finally { setLoading(false) }
    }
    void load()
  }, [navigate])

  const counts = {
    ALL: inquiries.length,
    WAITING: inquiries.filter((inquiry) => inquiry.status === 'WAITING').length,
    ANSWERED: inquiries.filter((inquiry) => inquiry.status === 'ANSWERED').length,
  }
  const visible = inquiries.filter((inquiry) => {
    if (status !== 'ALL' && inquiry.status !== status) return false
    if (!search) return true
    return `${inquiry.title} ${inquiry.authorEmail} ${inquiry.content}`.toLowerCase().includes(search)
  })

  function selectStatus(next: StatusFilter) {
    const params = new URLSearchParams(searchParams)
    if (next === 'ALL') params.delete('status')
    else params.set('status', next)
    setSearchParams(params)
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (keyword.trim()) params.set('keyword', keyword.trim())
    else params.delete('keyword')
    setSearchParams(params)
  }
  function reset() { setKeyword(''); setSearchParams({}) }

  return <section>
    <AdminPageHeading description="회원이 남긴 문의를 확인하고 답변을 등록합니다." title="문의 관리" />
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="전체 문의" value={counts.ALL} />
      <SummaryCard emphasis label="답변 대기" value={counts.WAITING} />
      <SummaryCard label="답변 완료" value={counts.ANSWERED} />
    </div>
    <form className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm" onSubmit={submitSearch} noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5" role="group" aria-label="문의 상태 필터">
          {statusFilters.map((filter) => <button
            aria-pressed={status === filter.value}
            className={`h-9 rounded-full border px-3.5 text-xs font-medium transition ${status === filter.value ? 'border-[#172b44] bg-[#172b44] text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-[#b79a67]'}`}
            key={filter.value}
            onClick={() => selectStatus(filter.value)}
            type="button"
          >{filter.label} {counts[filter.value]}</button>)}
        </div>
        <label className="flex flex-1 items-center gap-3 text-xs font-medium text-slate-700">
          <span className="whitespace-nowrap">키워드</span>
          <input className="h-[44px] min-w-48 flex-1 rounded-sm border border-slate-300 px-3 py-2 text-sm font-normal" onChange={(event) => setKeyword(event.target.value)} placeholder="제목, 내용 또는 작성자 이메일" value={keyword} />
        </label>
        <div className="flex gap-2">
          <Button className="min-h-9 px-4 py-2" size="sm" type="submit">검색</Button>
          <Button className="min-h-9 px-4 py-2" size="sm" type="button" variant="secondary" onClick={reset}>초기화</Button>
        </div>
      </div>
    </form>
    {message ? <MessageBox message={message} /> : loading ? <p className="py-16 text-center text-sm text-slate-600">문의 목록을 불러오는 중입니다.</p> : visible.length === 0 ? <MessageBox message={inquiries.length === 0 ? '등록된 문의가 없습니다.' : '조건에 맞는 문의가 없습니다.'} /> : <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <caption className="sr-only">문의 목록</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-600">
              <th className="px-4 py-3" scope="col">상태</th>
              <th className="px-4 py-3" scope="col">제목</th>
              <th className="px-4 py-3" scope="col">작성자</th>
              <th className="px-4 py-3" scope="col">작성일</th>
              <th className="px-4 py-3" scope="col">답변일</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((inquiry) => <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50" key={inquiry.inquiryId}>
              <td className="px-4 py-3"><StatusChip status={inquiry.status} /></td>
              <td className="px-4 py-3">
                <Link className="font-medium text-[#172b44] underline-offset-4 hover:underline" to={`/admin/inquiries/${inquiry.inquiryId}`}>{inquiry.title}</Link>
                <p className="mt-1 max-w-[420px] truncate text-xs text-slate-500">{inquiry.content}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{inquiry.authorEmail}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(inquiry.createdAt)}</td>
              <td className={`px-4 py-3 ${inquiry.answeredAt ? 'text-slate-600' : 'text-[#a77f3b]'}`}>{inquiry.answeredAt ? formatDateTime(inquiry.answeredAt) : '답변 대기'}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>}
  </section>
}

function AdminInquiryDetailPage({ inquiryId }: { inquiryId: string }) {
  const navigate = useNavigate()
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setMessage('')
    try {
      const response = await adminInquiryApi.detail(inquiryId)
      setInquiry(response.data)
      setAnswer(response.data.answerContent ?? '')
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) { setReturnPath(`/admin/inquiries/${inquiryId}`); navigate('/login', { replace: true }); return }
      setInquiry(null)
      setMessage(apiError.status === 403 ? '문의를 조회할 권한이 없습니다.' : apiError.status === 404 ? '문의를 찾을 수 없습니다.' : errorMessage(error, '문의 정보를 불러오지 못했습니다.'))
    } finally { setLoading(false) }
  }, [inquiryId, navigate])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const trimmed = answer.trim()
  const validationError = trimmed.length === 0 ? '답변 내용은 필수 입력값입니다.' : trimmed.length < ANSWER_MIN_LENGTH ? `답변은 ${ANSWER_MIN_LENGTH}자 이상 입력해 주세요.` : ''
  const answered = inquiry?.status === 'ANSWERED'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    if (!inquiry || validationError) return
    setSubmitting(true); setMessage(''); setNotice('')
    try {
      const response = await adminInquiryApi.answer(inquiryId, trimmed)
      setInquiry(response.data)
      setAnswer(response.data.answerContent ?? '')
      setTouched(false)
      setNotice(response.message || '답변이 등록되었습니다.')
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) { setReturnPath(`/admin/inquiries/${inquiryId}`); navigate('/login', { replace: true }); return }
      setMessage(apiError.status === 403 ? '답변을 등록할 권한이 없습니다.' : apiError.status === 404 ? '문의를 찾을 수 없습니다.' : errorMessage(error, '답변 등록에 실패했습니다.'))
    } finally { setSubmitting(false) }
  }

  if (loading) return <p className="py-16 text-center text-sm text-slate-600">문의 정보를 불러오는 중입니다.</p>
  if (!inquiry) return <section>
    <AdminPageHeading description="문의 내용을 확인하고 답변을 등록합니다." title="문의 상세" />
    <MessageBox message={message || '문의를 찾을 수 없습니다.'}><Link className="mt-4 inline-block text-sm text-[#172b44] underline" to="/admin/inquiries">문의 목록으로 돌아가기</Link></MessageBox>
  </section>

  return <section>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link className="text-sm text-[#172b44] underline underline-offset-4" to="/admin/inquiries">← 문의 목록</Link>
    </div>
    <AdminPageHeading description="회원 문의를 확인하고 답변을 등록합니다. 등록한 답변은 회원 문의 상세에서 바로 보입니다." title="문의 상세 · 답변" />
    {message && <p className="mb-4 rounded-sm border border-error-border bg-[#fffaf8] px-4 py-3 text-sm text-error" role="alert">{message}</p>}
    {notice && <p className="mb-4 rounded-sm border border-[#d7c59e] bg-[#fffdf6] px-4 py-3 text-sm text-[#5f4b28]" role="status">{notice}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-7 py-5">
          <h3 className="text-base font-semibold text-[#172b44]">문의 내용</h3>
          <StatusChip status={inquiry.status} />
        </header>
        <div className="grid gap-2.5 px-7 pt-6 pb-5">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#a77f3b]">INQUIRY AUTHOR</p>
          <p className="text-xs text-slate-600">{inquiry.authorEmail} · 작성 {formatDateTime(inquiry.createdAt)}</p>
          <h4 className="text-2xl font-semibold tracking-tight text-[#172b44]">{inquiry.title}</h4>
        </div>
        <div className="grid gap-3.5 px-7 pb-6">
          <p className="text-sm font-semibold text-[#172b44]">문의 본문</p>
          <p className="rounded-md border border-[#d7c59e] bg-[#faf7f1] p-5 text-sm leading-[1.75] whitespace-pre-wrap text-[#172b44]">{inquiry.content}</p>
        </div>
        {answered && inquiry.answerContent && <div className="grid gap-3.5 border-t border-slate-100 px-7 py-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#172b44]">등록된 답변</p>
            <span className="text-xs text-slate-500">답변 {formatDateTime(inquiry.answeredAt)}</span>
          </div>
          <p className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm leading-[1.75] whitespace-pre-wrap text-slate-700">{inquiry.answerContent}</p>
        </div>}
        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-7 py-6">
          <p className="text-[10px] font-semibold tracking-[0.13em] text-[#a77f3b]">ANSWER SAFEGUARDS</p>
          <p className="text-sm font-semibold text-[#172b44]">답변 기준</p>
          <ul className="grid gap-1.5 pl-4 text-xs leading-[1.75] text-slate-600">
            {answerSafeguards.map((item) => <li className="list-disc" key={item}>{item}</li>)}
          </ul>
        </div>
      </article>
      <form className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" onSubmit={submit} noValidate>
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <h3 className="text-base font-semibold text-[#172b44]">{answered ? '답변 수정' : '답변 작성'}</h3>
          <span className="rounded-full border border-[#d7c59e] px-2.5 py-1 text-[10px] font-medium text-[#a77f3b]">필수</span>
        </header>
        <div className="grid gap-3 px-6 py-6">
          <label className="text-sm font-semibold text-[#172b44]" htmlFor="answer-content">답변 내용</label>
          <p className="text-[11px] leading-[1.55] text-slate-600">회원이 그대로 읽는 문장입니다. 확인된 사실만 담아 존댓말로 작성해 주세요. {answered && '이미 등록된 답변은 새 내용으로 덮어씁니다.'}</p>
          <textarea
            aria-describedby="answer-validation"
            aria-invalid={touched && Boolean(validationError)}
            className="min-h-[280px] w-full rounded-md border border-[#d7c59e] p-4 text-sm leading-[1.7] text-[#172b44] outline-none focus:border-[#b79a67]"
            id="answer-content"
            onBlur={() => setTouched(true)}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={'문의 주셔서 감사합니다.\n확인해 보니 …'}
            value={answer}
          />
          <p className={`text-[11px] ${touched && validationError ? 'text-error' : 'text-[#a77f3b]'}`} id="answer-validation" role={touched && validationError ? 'alert' : undefined}>
            {touched && validationError ? validationError : `${trimmed.length}자 입력 · 최소 ${ANSWER_MIN_LENGTH}자`}
          </p>
        </div>
        <div className="grid gap-1.5 border-y border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-[#a77f3b]">SUBMISSION</p>
          <p className="text-xs font-semibold text-[#172b44]">등록 즉시 회원에게 공개됩니다</p>
          <p className="text-[11px] text-slate-600">문의 상태가 ANSWERED로 바뀝니다.</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-5">
          <Button disabled={submitting} type="button" variant="secondary" onClick={() => { setAnswer(inquiry.answerContent ?? ''); setTouched(false) }}>되돌리기</Button>
          <Button disabled={submitting} type="submit">{submitting ? '등록 중' : answered ? '답변 수정' : '답변 등록'}</Button>
        </div>
      </form>
    </div>
  </section>
}

function StatusChip({ status }: { status: InquiryStatus }) {
  const answered = status === 'ANSWERED'
  return <span className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-medium whitespace-nowrap ${answered ? 'border-[#172b44] bg-[#172b44] text-white' : 'border-[#d7c59e] bg-white text-[#a77f3b]'}`}>{answered ? '답변 완료' : '답변 대기'}</span>
}

function SummaryCard({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return <div className={`rounded-lg border bg-white px-5 py-4 shadow-sm ${emphasis && value > 0 ? 'border-[#d7c59e]' : 'border-slate-200'}`}>
    <p className="text-[11px] font-medium tracking-[0.12em] text-slate-500">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${emphasis && value > 0 ? 'text-[#a77f3b]' : 'text-[#172b44]'}`}>{value.toLocaleString('ko-KR')}<span className="ml-1 text-sm font-normal text-slate-500">건</span></p>
  </div>
}

function MessageBox({ message, children }: { message: string; children?: ReactNode }) { return <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-600" role="alert"><p>{message}</p>{children}</div> }
