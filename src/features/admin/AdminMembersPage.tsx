import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, StatusBadge } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { setReturnPath } from '../auth/session'
import { AdminPageIntro, AdminPanel } from './AdminOperationsUi'
import { adminMemberApi } from './memberApi'
import type { AdminMember, AdminMemberDetail, AdminMemberReservations } from './memberTypes'

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/)
  return match ? `${match[1]}. ${match[2]}. ${match[3]}${match[4] ? ` ${match[4]}:${match[5]}` : ''}` : value
}

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError && error.message ? error.message : fallback
}

export function AdminMembersPage() {
  const { memberId } = useParams()
  return memberId ? <AdminMemberDetailPage memberId={memberId} /> : <AdminMemberListPage />
}

function AdminMemberListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [members, setMembers] = useState<AdminMember[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const page = Math.max(0, Number(searchParams.get('page') ?? 1) - 1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMessage('')
      try {
        const result = await adminMemberApi.list({
          ...(searchParams.get('keyword') ? { keyword: searchParams.get('keyword')! } : {}),
          page_num: page,
          page_size: 10,
        })
        setMembers(result.member_list)
        setTotal(result.total_elements)
      } catch (error) {
        const apiError = error as ApiError
        if (apiError.status === 401) {
          setReturnPath(`/admin/members${searchParams.size ? `?${searchParams}` : ''}`)
          navigate('/login', { replace: true })
          return
        }
        setMembers([])
        setTotal(0)
        setMessage(apiError.status === 403 ? '회원 관리 권한이 없습니다.' : errorMessage(error, '회원 목록을 불러오지 못했습니다.'))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [navigate, page, searchParams])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (keyword.trim()) next.set('keyword', keyword.trim())
    setSearchParams(next)
  }

  function movePage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 0) next.delete('page')
    else next.set('page', String(nextPage + 1))
    setSearchParams(next)
  }

  return <section>
    <PageHeading title="회원 관리" description="회원 정보를 조회하고, 회원별 객실 예약 내역을 확인합니다." />
    <form className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm" noValidate onSubmit={submit}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-3 text-xs font-medium text-slate-700" htmlFor="member-keyword"><span className="whitespace-nowrap">키워드</span><input className="h-[44px] min-w-48 flex-1 rounded-sm border border-slate-300 px-3 py-2 text-sm font-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b08d4d]" id="member-keyword" onChange={(event) => setKeyword(event.target.value)} placeholder="회원명 또는 이메일" value={keyword} /></label>
        <div className="flex gap-2"><Button className="min-h-9 px-4 py-2" size="sm" type="submit">검색</Button><Button className="min-h-9 px-4 py-2" onClick={() => { setKeyword(''); setSearchParams({}) }} size="sm" type="button" variant="secondary">초기화</Button></div>
      </div>
    </form>
    {loading ? <Loading label="회원 목록을 불러오는 중입니다." /> : message ? <MessageBox message={message} /> : members.length === 0 ? <MessageBox message="회원 내역이 없습니다." /> : <>
      <p className="mt-5 text-sm text-slate-600">총 <strong className="text-[#172b44]">{total.toLocaleString('ko-KR')}명</strong></p>
      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] border-collapse text-center text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="px-5 py-3 font-medium">회원명</th><th className="px-5 py-3 font-medium">이메일</th><th className="px-5 py-3 font-medium">전화번호</th><th className="px-5 py-3 font-medium">권한</th><th className="px-5 py-3 font-medium">가입일</th></tr></thead>
          <tbody>{members.map((member) => <tr aria-label={`${member.name} 회원 상세 보기`} className="admin-interactive-row cursor-pointer border-t border-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b08d4d]" key={member.member_id} onClick={() => navigate(`/admin/members/${member.member_id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/admin/members/${member.member_id}`) } }} role="link" tabIndex={0}><td className="bg-white px-5 py-4 font-medium text-[#172b44]">{member.name}</td><td className="bg-white px-5 py-4">{member.email}</td><td className="bg-white px-5 py-4">{member.phone_number}</td><td className="bg-white px-5 py-4">{member.role}</td><td className="bg-white px-5 py-4">{formatDate(member.created_at)}</td></tr>)}</tbody>
        </table>
      </div>
      <Pagination currentPage={page} onMove={movePage} total={total} />
    </>}
  </section>
}

function AdminMemberDetailPage({ memberId }: { memberId: string }) {
  const navigate = useNavigate()
  const [member, setMember] = useState<AdminMemberDetail | null>(null)
  const [reservations, setReservations] = useState<AdminMemberReservations | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [confirmingDeletion, setConfirmingDeletion] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const [memberResult, reservationResult] = await Promise.all([
        adminMemberApi.detail(memberId),
        adminMemberApi.reservations(memberId),
      ])
      setMember(memberResult)
      setReservations(reservationResult)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        setReturnPath(`/admin/members/${memberId}`)
        navigate('/login', { replace: true })
        return
      }
      setMember(null)
      setReservations(null)
      setMessage(apiError.status === 403 ? '회원 상세 정보를 조회할 권한이 없습니다.' : apiError.status === 404 ? '회원 정보를 찾을 수 없습니다.' : errorMessage(error, '회원 정보를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [memberId, navigate])
  useEffect(() => { void Promise.resolve().then(load) }, [load])

  async function removeMember() {
    setDeleting(true)
    setMessage('')
    try {
      await adminMemberApi.remove(memberId)
      navigate('/admin/members', { replace: true })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        setReturnPath(`/admin/members/${memberId}`)
        navigate('/login', { replace: true })
        return
      }
      setMessage(apiError.status === 403 ? '회원 삭제 권한이 없습니다.' : apiError.status === 404 ? '회원 정보를 찾을 수 없습니다.' : errorMessage(error, '회원 삭제에 실패했습니다.'))
      setConfirmingDeletion(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loading label="회원 정보와 예약 내역을 불러오는 중입니다." />
  if (!member) return <section><PageHeading title="회원 상세" description="회원 정보와 예약 내역을 확인합니다." /><MessageBox message={message || '회원 정보를 찾을 수 없습니다.'}><Link className="mt-4 inline-block underline underline-offset-4" to="/admin/members">회원 목록으로 돌아가기</Link></MessageBox></section>
  return <section className="mx-auto max-w-[1084px] rounded-xl bg-[#f8f5ef] p-5 md:p-8">
    <AdminPageIntro
      action={<Link className="rounded-sm border border-gold-300 bg-white px-4 py-2.5 text-[10px] font-medium text-navy-900 hover:bg-ivory-100" to="/admin/members">회원 목록</Link>}
      badgeDescription="회원 · 예약 · 삭제 API 연결"
      badgeTitle="BACKEND INTEGRATION"
      description="회원의 기본 정보와 객실 예약 이력을 확인하고 계정을 안전하게 관리합니다."
      eyebrow="MEMBER OPERATIONS"
      title="회원 상세 및 계정 관리"
    />
    {message && <p className="mb-4 text-sm text-error" role="alert">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
      <AdminPanel className="border-gold-300" endpoint="GET /api/admin/members/{memberId}" title="회원 기본 정보">
        <div className="mb-5 flex items-center gap-4 rounded-md bg-navy-900 p-5 text-white">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-gold-300 text-lg text-gold-300">{member.name.slice(0, 1)}</div>
          <div className="min-w-0 flex-1"><strong className="block truncate text-base font-medium">{member.name}</strong><span className="mt-1 block truncate text-[10px] text-slate-300">{member.email}</span></div>
          <span className="rounded-full border border-gold-300 px-3 py-1.5 text-[9px] text-gold-300">{member.role}</span>
        </div>
        <dl className="grid gap-x-6 md:grid-cols-2">
          {[
            ['회원 번호', String(member.member_id)], ['이름', member.name], ['이메일', member.email],
            ['전화번호', member.phone_number], ['권한', member.role], ['가입일', formatDate(member.created_at)],
            ['최근 수정', formatDate(member.updated_at)], ['데이터 기준', 'AdminMemberDetail'],
          ].map(([label, value]) => <div className="border-b border-ivory-200 py-4" key={label}><dt className="text-[9px] text-ink-500">{label}</dt><dd className="mt-1.5 break-all text-xs text-navy-900">{value}</dd></div>)}
        </dl>
        <p className="mt-5 rounded-sm bg-ivory-100 px-4 py-3 text-[10px] leading-5 text-ink-500">운영에 필요한 기본 정보만 표시하며 비밀번호와 인증 정보는 조회하지 않습니다.</p>
      </AdminPanel>
      <AdminPanel endpoint="DELETE /api/admin/members/{memberId}" title="계정 관리">
        <div className="space-y-5">
          <label className="block text-[10px] font-medium text-ink-700">계정 상태<select className="admin-field" disabled value="ACTIVE"><option value="ACTIVE">활성 회원</option></select><span className="mt-2 block text-[9px] leading-4 text-ink-500">상태 변경 API가 없어 현재는 조회만 제공합니다.</span></label>
          <label className="block text-[10px] font-medium text-ink-700">권한<select className="admin-field" disabled value={member.role}><option value={member.role}>{member.role}</option></select><span className="mt-2 block text-[9px] leading-4 text-ink-500">권한 변경은 운영 정책이 정의된 뒤 연결합니다.</span></label>
          <div className="rounded-md bg-ivory-100 p-4"><p className="text-[9px] font-medium tracking-[0.12em] text-gold-500">POLICY SAFETY</p><ul className="mt-3 space-y-2 text-[10px] leading-5 text-ink-500"><li>• 인증 정보는 화면에 노출하지 않습니다.</li><li>• 삭제 전 예약 이력을 함께 확인합니다.</li><li>• 삭제 작업은 재확인을 거칩니다.</li></ul></div>
          <Button className="w-full" onClick={() => setConfirmingDeletion(true)} variant="danger">회원 삭제</Button>
        </div>
      </AdminPanel>
    </div>
    <section className="mt-7" aria-labelledby="member-reservations"><div className="flex items-end justify-between gap-3"><div><p className="text-[11px] font-semibold tracking-[0.16em] text-[#a77f3b]">RESERVATIONS</p><h3 className="mt-1 text-xl font-semibold text-[#172b44]" id="member-reservations">예약 내역</h3></div><p className="text-sm text-slate-600">총 {reservations?.total_elements.toLocaleString('ko-KR') ?? 0}건</p></div>
      {!reservations || reservations.resv_list.length === 0 ? <MessageBox message="예약 내역이 없습니다." /> : <div className="mt-3 overflow-x-auto rounded-lg border border-ivory-200 bg-white"><table className="w-full min-w-[760px] text-center text-sm"><thead className="bg-ivory-100 text-xs text-ink-500"><tr><th className="px-5 py-3 font-medium">예약번호</th><th className="px-5 py-3 font-medium">객실</th><th className="px-5 py-3 font-medium">숙박 기간</th><th className="px-5 py-3 font-medium">금액</th><th className="px-5 py-3 font-medium">상태</th></tr></thead><tbody>{reservations.resv_list.map((reservation) => <tr aria-label={`${reservation.resv_number} 예약 상세 보기`} className="admin-interactive-row cursor-pointer border-t border-ivory-200" key={reservation.resv_id} onClick={() => navigate(`/admin/reservations/${reservation.resv_id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/admin/reservations/${reservation.resv_id}`) } }} role="link" tabIndex={0}><td className="bg-white px-5 py-4 font-medium text-navy-900">{reservation.resv_number}</td><td className="bg-white px-5 py-4">{reservation.room_name}</td><td className="bg-white px-5 py-4 whitespace-nowrap">{reservation.check_in_date} ~ {reservation.check_out_date}</td><td className="bg-white px-5 py-4">{won(reservation.total_price)}</td><td className="bg-white px-5 py-4"><StatusBadge status={reservation.resv_status} /></td></tr>)}</tbody></table></div>}
    </section>
    {confirmingDeletion && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="presentation"><section aria-describedby="member-delete-description" aria-labelledby="member-delete-title" aria-modal="true" className="w-full max-w-[448px] rounded-lg bg-white p-6 shadow-xl" role="dialog"><h3 className="text-lg font-semibold text-[#172b44]" id="member-delete-title">회원을 삭제하시겠습니까?</h3><p className="mt-3 text-sm text-slate-600" id="member-delete-description"><strong>{member.name}</strong> 회원을 삭제합니다. 삭제 후에는 되돌릴 수 없습니다.</p><div className="mt-6 flex justify-end gap-2"><Button disabled={deleting} onClick={() => setConfirmingDeletion(false)} variant="secondary">닫기</Button><Button disabled={deleting} onClick={() => void removeMember()} variant="danger">{deleting ? '삭제 처리 중' : '회원 삭제'}</Button></div></section></div>}
  </section>
}

function PageHeading({ title, description }: { title: string; description: string }) { return <header className="mb-5 border-b border-slate-300 pb-6"><p className="text-[11px] font-semibold tracking-[0.16em] text-[#a77f3b]">ADMINISTRATION</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#172b44]">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p></header> }
function Loading({ label }: { label: string }) { return <p className="py-16 text-center text-sm text-slate-600">{label}</p> }
function MessageBox({ message, children }: { message: string; children?: ReactNode }) { return <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-600" role="alert"><p>{message}</p>{children}</div> }
function Pagination({ currentPage, total, onMove }: { currentPage: number; total: number; onMove: (page: number) => void }) { const totalPages = Math.ceil(total / 10); if (totalPages < 2) return null; return <nav aria-label="회원 목록 페이지" className="mt-5 flex justify-center gap-2"><button className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-40" disabled={currentPage === 0} onClick={() => onMove(currentPage - 1)} type="button">이전</button><span className="px-3 py-2 text-sm text-slate-600">{currentPage + 1} / {totalPages}</span><button className="rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-40" disabled={currentPage + 1 >= totalPages} onClick={() => onMove(currentPage + 1)} type="button">다음</button></nav> }
