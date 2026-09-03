import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { setReturnPath } from '../auth/session'
import { adminMemberApi } from './memberApi'
import { AdminPageHeading } from './shared'
import type {
  AdminMemberActivity,
  AdminMemberDetail,
  AdminMemberPage,
  AdminMemberRole,
  AdminMemberStats,
} from './memberTypes'

type RoleFilter = 'ALL' | AdminMemberRole

const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'USER', label: '일반 회원' },
  { value: 'ADMIN', label: '관리자' },
]
const roleLabels: Record<AdminMemberRole, string> = { USER: '일반 회원', ADMIN: '관리자' }
const PAGE_SIZE = 20
const won = (value: number) => `${value.toLocaleString('ko-KR')}원`

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message || fallback : fallback
}

/** "2026-09-01 14:22:00" 형태의 서버 응답을 읽기 좋은 형태로 바꾼다. */
function formatDateTime(value: string | null) {
  if (!value) return '-'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)
  return match ? `${match[1]}. ${match[2]}. ${match[3]}. ${match[4]}:${match[5]}` : value
}

export function AdminMembersPage() {
  const { userId } = useParams()
  return userId ? <AdminMemberDetailPage userId={userId} /> : <AdminMemberListPage />
}

function AdminMemberListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState<AdminMemberPage | null>(null)
  const [stats, setStats] = useState<AdminMemberStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '')

  const rawRole = searchParams.get('role') ?? 'ALL'
  const role = (roleFilters.some((filter) => filter.value === rawRole) ? rawRole : 'ALL') as RoleFilter
  const search = searchParams.get('keyword')?.trim() ?? ''
  const pageNum = Number(searchParams.get('page') ?? '0') || 0

  useEffect(() => {
    const load = async () => {
      setLoading(true); setMessage('')
      try {
        // 검색·페이징은 서버가 처리하므로 조건이 바뀔 때마다 다시 요청한다.
        const [list, summary] = await Promise.all([
          adminMemberApi.list({
            ...(role === 'ALL' ? {} : { role }),
            ...(search ? { keyword: search } : {}),
            page_num: pageNum,
            page_size: PAGE_SIZE,
          }),
          adminMemberApi.stats(),
        ])
        setPage(list.data)
        setStats(summary.data)
      } catch (error) {
        const apiError = error as ApiError
        if (apiError.status === 401) {
          setReturnPath('/admin/members')
          navigate('/login', { replace: true })
          return
        }
        setPage(null)
        setMessage(apiError.status === 403 ? '회원 관리 권한이 없습니다.' : errorMessage(error, '회원 목록을 불러오지 못했습니다.'))
      } finally { setLoading(false) }
    }
    void load()
  }, [navigate, pageNum, role, search])

  function updateParams(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams)
    update(params)
    setSearchParams(params)
  }
  function selectRole(next: RoleFilter) {
    updateParams((params) => {
      if (next === 'ALL') params.delete('role')
      else params.set('role', next)
      params.delete('page') // 필터가 바뀌면 첫 페이지부터 다시 본다
    })
  }
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateParams((params) => {
      if (keyword.trim()) params.set('keyword', keyword.trim())
      else params.delete('keyword')
      params.delete('page')
    })
  }
  function reset() { setKeyword(''); setSearchParams({}) }
  function movePage(next: number) { updateParams((params) => params.set('page', String(next))) }

  const members = page?.user_list ?? []

  return <section>
    <AdminPageHeading description="가입한 회원을 조회하고 정보와 권한을 관리합니다." title="회원 관리" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="전체 회원" value={stats?.total_users} />
      <SummaryCard label="관리자" value={stats?.admin_users} />
      <SummaryCard emphasis label="오늘 가입" value={stats?.new_users_today} />
      <SummaryCard label="최근 7일 가입" value={stats?.new_users_last_7_days} />
    </div>
    <form className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm" onSubmit={submitSearch} noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5" role="group" aria-label="회원 권한 필터">
          {roleFilters.map((filter) => <button
            aria-pressed={role === filter.value}
            className={`h-9 rounded-full border px-3.5 text-xs font-medium transition ${role === filter.value ? 'border-[#172b44] bg-[#172b44] text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-[#b79a67]'}`}
            key={filter.value}
            onClick={() => selectRole(filter.value)}
            type="button"
          >{filter.label}</button>)}
        </div>
        <label className="flex flex-1 items-center gap-3 text-xs font-medium text-slate-700">
          <span className="whitespace-nowrap">키워드</span>
          <input className="h-[44px] min-w-48 flex-1 rounded-sm border border-slate-300 px-3 py-2 text-sm font-normal" onChange={(event) => setKeyword(event.target.value)} placeholder="이메일, 이름 또는 전화번호" value={keyword} />
        </label>
        <div className="flex gap-2">
          <Button className="min-h-9 px-4 py-2" size="sm" type="submit">검색</Button>
          <Button className="min-h-9 px-4 py-2" size="sm" type="button" variant="secondary" onClick={reset}>초기화</Button>
        </div>
      </div>
    </form>
    {message ? <MessageBox message={message} /> : loading ? <p className="py-16 text-center text-sm text-slate-600">회원 목록을 불러오는 중입니다.</p> : members.length === 0 ? <MessageBox message={search || role !== 'ALL' ? '조건에 맞는 회원이 없습니다.' : '가입한 회원이 없습니다.'} /> : <>
      <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <caption className="sr-only">회원 목록</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-600">
                <th className="px-4 py-3" scope="col">이름</th>
                <th className="px-4 py-3" scope="col">이메일</th>
                <th className="px-4 py-3" scope="col">전화번호</th>
                <th className="px-4 py-3" scope="col">권한</th>
                <th className="px-4 py-3 text-right" scope="col">예약</th>
                <th className="px-4 py-3 text-right" scope="col">문의</th>
                <th className="px-4 py-3" scope="col">가입일</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50" key={member.user_id}>
                <td className="px-4 py-3">
                  <Link className="font-medium text-[#172b44] underline-offset-4 hover:underline" to={`/admin/members/${member.user_id}`}>{member.name}</Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{member.email}</td>
                <td className="px-4 py-3 text-slate-600">{member.phone_number}</td>
                <td className="px-4 py-3"><RoleChip role={member.role} /></td>
                <td className="px-4 py-3 text-right text-slate-700">{member.reservation_count.toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3 text-right text-slate-700">{member.inquiry_count.toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(member.created_at)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
      {page && <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">전체 <strong className="text-[#172b44]">{page.total_elements.toLocaleString('ko-KR')}명</strong> 중 {page.page_num * page.page_size + 1}–{page.page_num * page.page_size + members.length}번째</p>
        <div className="flex items-center gap-2">
          <Button className="min-h-9 px-4 py-2" disabled={page.page_num <= 0} size="sm" variant="secondary" onClick={() => movePage(page.page_num - 1)}>이전</Button>
          <span className="text-sm text-slate-600">{page.page_num + 1} / {Math.max(page.total_pages, 1)}</span>
          <Button className="min-h-9 px-4 py-2" disabled={page.page_num + 1 >= page.total_pages} size="sm" variant="secondary" onClick={() => movePage(page.page_num + 1)}>다음</Button>
        </div>
      </div>}
    </>}
  </section>
}

function AdminMemberDetailPage({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [member, setMember] = useState<AdminMemberDetail | null>(null)
  const [activity, setActivity] = useState<AdminMemberActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', phoneNumber: '' })
  const [role, setRole] = useState<AdminMemberRole>('USER')

  const load = useCallback(async () => {
    setLoading(true); setMessage('')
    try {
      const [detail, history] = await Promise.all([
        adminMemberApi.detail(userId),
        adminMemberApi.activity(userId),
      ])
      setMember(detail.data)
      setActivity(history.data)
      setForm({ name: detail.data.name, phoneNumber: detail.data.phone_number })
      setRole(detail.data.role)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) { setReturnPath(`/admin/members/${userId}`); navigate('/login', { replace: true }); return }
      setMember(null)
      setMessage(apiError.status === 403 ? '회원 정보를 조회할 권한이 없습니다.' : apiError.status === 404 ? '회원을 찾을 수 없습니다.' : errorMessage(error, '회원 정보를 불러오지 못했습니다.'))
    } finally { setLoading(false) }
  }, [navigate, userId])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const phoneValid = /^\d{3}-\d{3,4}-\d{4}$/.test(form.phoneNumber.trim())

  if (loading) return <p className="py-16 text-center text-sm text-slate-600">회원 정보를 불러오는 중입니다.</p>
  if (!member) return <section>
    <AdminPageHeading description="회원 정보와 활동 내역을 확인합니다." title="회원 상세" />
    <MessageBox message={message || '회원을 찾을 수 없습니다.'}><Link className="mt-4 inline-block text-sm text-[#172b44] underline" to="/admin/members">회원 목록으로 돌아가기</Link></MessageBox>
  </section>

  return <section>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link className="text-sm text-[#172b44] underline underline-offset-4" to="/admin/members">← 회원 목록</Link>
      <code className="rounded-sm border border-[#d7c59e] bg-white px-3 py-2 text-[11px] text-[#172b44]">GET /api/admin/users/{member.user_id}</code>
    </div>
    <AdminPageHeading description="회원 기본 정보와 예약·문의 활동 이력을 조회합니다." title="회원 상세" />
    {message && <p className="mb-4 rounded-sm border border-error-border bg-[#fffaf8] px-4 py-3 text-sm text-error" role="alert">{message}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-7 py-5">
          <h3 className="text-base font-semibold text-[#172b44]">회원 정보</h3>
          <RoleChip role={member.role} />
        </header>
        <div className="grid gap-2.5 px-7 pt-6 pb-5">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#a77f3b]">MEMBER</p>
          <h4 className="text-2xl font-semibold tracking-tight text-[#172b44]">{member.name}</h4>
          <p className="text-xs text-slate-600">{member.email} · 가입 {formatDateTime(member.created_at)}</p>
        </div>
        <dl className="grid gap-2 border-t border-slate-100 px-7 py-5 text-sm sm:grid-cols-[120px_1fr]">
          {([['회원 ID', String(member.user_id)], ['전화번호', member.phone_number], ['예약 건수', `${member.reservation_count}건`], ['문의 건수', `${member.inquiry_count}건`], ['최근 수정', formatDateTime(member.updated_at)]] as Array<[string, string]>).map(([label, value]) => <div className="contents" key={label}>
            <dt className="text-slate-500">{label}</dt>
            <dd className="m-0 text-slate-800">{value}</dd>
          </div>)}
        </dl>
        <form className="grid gap-3 border-t border-slate-200 bg-slate-50 px-7 py-6" onSubmit={(event) => event.preventDefault()} noValidate>
          <p className="text-[10px] font-semibold tracking-[0.13em] text-[#a77f3b]">EDIT PROFILE</p>
          <p className="text-sm font-semibold text-[#172b44]">회원 정보 정정</p>
          <p className="text-[11px] leading-[1.55] text-slate-600">현재 백엔드에 수정 API가 없어 조회만 제공합니다. 이메일과 비밀번호는 화면에 노출하거나 변경하지 않습니다.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">이름
              <input className="h-[44px] rounded-sm border border-slate-300 bg-slate-100 px-3 text-sm font-normal" disabled onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">전화번호
              <input aria-invalid={!phoneValid} className="h-[44px] rounded-sm border border-slate-300 bg-slate-100 px-3 text-sm font-normal" disabled onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} placeholder="010-1234-5678" value={form.phoneNumber} />
            </label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className={`text-[11px] ${phoneValid ? 'text-slate-500' : 'text-error'}`} role={phoneValid ? undefined : 'alert'}>
              {phoneValid ? '회원 정보 수정 API 준비 중입니다.' : '등록된 전화번호 형식을 확인해 주세요.'}
            </p>
            <Button disabled size="sm" type="submit">수정 API 준비 중</Button>
          </div>
        </form>
      </article>
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <h3 className="text-base font-semibold text-[#172b44]">권한 변경</h3>
          <span className="rounded-full border border-[#d7c59e] px-2.5 py-1 text-[10px] font-medium text-[#a77f3b]">주의</span>
        </header>
        <div className="grid gap-3 px-6 py-6">
          <p className="text-[11px] leading-[1.55] text-slate-600">현재 권한을 조회할 수 있습니다. 권한 변경 API가 정의되기 전까지 선택과 저장 기능은 비활성화합니다.</p>
          <div className="grid gap-2" role="radiogroup" aria-label="회원 권한">
            {(['USER', 'ADMIN'] as AdminMemberRole[]).map((value) => <label className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition ${role === value ? 'border-[#b79a67] bg-[#fffdf6] text-[#172b44]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`} key={value}>
              <input checked={role === value} className="accent-[#172b44]" disabled name="role" onChange={() => setRole(value)} type="radio" value={value} />
              <span className="font-medium">{roleLabels[value]}</span>
              {member.role === value && <span className="ml-auto text-[11px] text-slate-500">현재</span>}
            </label>)}
          </div>
        </div>
        <div className="grid gap-1.5 border-y border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-[#a77f3b]">SAFEGUARDS</p>
          <p className="text-xs font-semibold text-[#172b44]">API 준비 중</p>
          <p className="text-[11px] leading-[1.6] text-slate-600">백엔드 계약이 추가되면 본인 계정과 마지막 관리자 보호 정책을 함께 적용합니다.</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-5">
          <Button disabled variant="secondary" onClick={() => setRole(member.role)}>되돌리기</Button>
          <Button disabled>권한 변경 준비 중</Button>
        </div>
      </article>
    </div>
    {activity && (activity.reservations.length > 0 || activity.inquiries.length > 0) ? <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
      <ActivityPanel count={activity.reservations.length} title="예약 이력">
        {activity.reservations.map((reservation) => <li className="border-b border-slate-100 px-6 py-4 last:border-b-0" key={reservation.resv_id}>
          <div className="flex items-center justify-between gap-3">
            <Link className="text-sm font-medium text-[#172b44] underline-offset-4 hover:underline" to={`/admin/reservations/${reservation.resv_id}`}>{reservation.resv_number}</Link>
            <span className={`text-[11px] font-medium ${reservation.resv_status === 'CANCELLED' ? 'text-slate-400' : 'text-[#a77f3b]'}`}>{reservation.resv_status === 'CANCELLED' ? '취소됨' : '예약됨'}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600">{reservation.room_name} · {reservation.room_number}호 · {reservation.guest_count}명</p>
          <p className="mt-1 text-xs text-slate-500">{reservation.check_in_date} ~ {reservation.check_out_date} · {won(reservation.total_price)}</p>
        </li>)}
      </ActivityPanel>
      <ActivityPanel count={activity.inquiries.length} title="문의 이력">
        {activity.inquiries.map((inquiry) => <li className="border-b border-slate-100 px-6 py-4 last:border-b-0" key={inquiry.inquiry_id}>
          <div className="flex items-center justify-between gap-3">
            <Link className="text-sm font-medium text-[#172b44] underline-offset-4 hover:underline" to={`/admin/inquiries/${inquiry.inquiry_id}`}>{inquiry.title}</Link>
            <span className={`text-[11px] font-medium ${inquiry.status === 'ANSWERED' ? 'text-slate-500' : 'text-[#a77f3b]'}`}>{inquiry.status === 'ANSWERED' ? '답변 완료' : '답변 대기'}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">작성 {formatDateTime(inquiry.created_at)}{inquiry.answered_at ? ` · 답변 ${formatDateTime(inquiry.answered_at)}` : ''}</p>
        </li>)}
      </ActivityPanel>
    </div> : <MessageBox message="예약·문의 활동 이력 API는 준비 중입니다." />}
  </section>
}

function ActivityPanel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
      <h3 className="text-sm font-semibold text-[#172b44]">{title}</h3>
      <span className="text-xs text-slate-600">{count.toLocaleString('ko-KR')}건</span>
    </header>
    {count === 0 ? <p className="px-6 py-10 text-center text-sm text-slate-500">내역이 없습니다.</p> : <ul className="m-0 list-none p-0">{children}</ul>}
  </article>
}

function RoleChip({ role }: { role: AdminMemberRole }) {
  const isAdmin = role === 'ADMIN'
  return <span className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-medium whitespace-nowrap ${isAdmin ? 'border-[#172b44] bg-[#172b44] text-white' : 'border-slate-300 bg-white text-slate-600'}`}>{roleLabels[role]}</span>
}

function SummaryCard({ label, value, emphasis = false }: { label: string; value?: number; emphasis?: boolean }) {
  return <div className={`rounded-lg border bg-white px-5 py-4 shadow-sm ${emphasis && (value ?? 0) > 0 ? 'border-[#d7c59e]' : 'border-slate-200'}`}>
    <p className="text-[11px] font-medium tracking-[0.12em] text-slate-500">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${emphasis && (value ?? 0) > 0 ? 'text-[#a77f3b]' : 'text-[#172b44]'}`}>
      {value === undefined ? '–' : value.toLocaleString('ko-KR')}<span className="ml-1 text-sm font-normal text-slate-500">명</span>
    </p>
  </div>
}

function MessageBox({ message, children }: { message: string; children?: ReactNode }) { return <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-600" role="alert"><p>{message}</p>{children}</div> }
