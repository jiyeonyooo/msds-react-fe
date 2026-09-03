import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, StatusBadge } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { setReturnPath } from '../auth/session'
import { adminReservationApi } from './reservationApi'
import type { AdminReservation, AdminReservationDetail, AdminReservationFilters, AdminReservationStatus } from './reservationTypes'

type FilterForm = {
  keyword: string
}

const emptyFilters: FilterForm = { keyword: '' }
const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
const seoulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
const currentMonth = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function filtersFromSearch(search: URLSearchParams): FilterForm {
  return {
    keyword: search.get('keyword') ?? '',
  }
}

function monthRange(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  const lastDate = new Date(year, monthIndex, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(lastDate).padStart(2, '0')}` }
}

function shiftMonth(month: string, amount: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(year, monthIndex - 1 + amount, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function calendarDays(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(year, monthIndex - 1, 1)
  const start = new Date(year, monthIndex - 1, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index)
    return { date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, inMonth: date.getMonth() === monthIndex - 1, day: date.getDate() }
  })
}

function nextDate(date: string) {
  const value = new Date(`${date}T00:00:00`); value.setDate(value.getDate() + 1)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message || fallback : fallback
}

function formatDateTime(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)
  return match ? `${match[1]}. ${match[2]}. ${match[3]}. ${match[4]}:${match[5]}` : value
}

export function AdminReservationsPage() {
  const { resvId } = useParams()
  return resvId ? <AdminReservationDetailPage resvId={resvId} /> : <AdminReservationListPage />
}

function AdminReservationListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState<FilterForm>(() => filtersFromSearch(searchParams))
  const [items, setItems] = useState<AdminReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [activeRooms, setActiveRooms] = useState<string[]>([])
  const [activeStatuses, setActiveStatuses] = useState<AdminReservationStatus[]>(['RESERVED', 'CANCELLED'])
  const monthInputRef = useRef<HTMLInputElement>(null)

  const month = /^\d{4}-\d{2}$/.test(searchParams.get('month') ?? '') ? searchParams.get('month')! : currentMonth()
  const range = monthRange(month)
  useEffect(() => {
    const filters: AdminReservationFilters = {
      ...(searchParams.get('keyword') ? { keyword: searchParams.get('keyword')! } : {}),
      search_from_date: range.from,
      search_to_date: range.to,
      page_num: 0,
      page_size: 100,
    }
    const load = async () => {
      setLoading(true); setMessage('')
      try {
        const result = await adminReservationApi.list(filters)
        setItems(result.resv_list)
      } catch (error) {
        const apiError = error as ApiError
        if (apiError.status === 401) {
          setReturnPath(`/admin/reservations${searchParams.size ? `?${searchParams}` : ''}`)
          navigate('/login', { replace: true })
          return
        }
        setItems([])
        setMessage(apiError.status === 403 ? '예약 관리 권한이 없습니다.' : errorMessage(error, '예약 목록을 불러오지 못했습니다.'))
      } finally { setLoading(false) }
    }
    void load()
  }, [navigate, range.from, range.to, searchParams])

  function updateForm(name: keyof FilterForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (form.keyword.trim()) next.set('keyword', form.keyword.trim())
    next.set('month', month)
    setSearchParams(next)
  }
  function reset() { setForm(emptyFilters); setActiveRooms([]); setActiveStatuses(['RESERVED', 'CANCELLED']); setSearchParams({ month }) }
  function moveMonth(amount: number) {
    const next = new URLSearchParams(searchParams); next.set('month', shiftMonth(month, amount)); setSearchParams(next)
  }
  const rooms = [...new Map(items.map((item) => [`${item.room_name} · ${item.room_number}호`, item])).entries()].map(([label]) => label)
  const visibleItems = items.filter((item) => activeStatuses.includes(item.resv_status) && (!activeRooms.length || activeRooms.includes(`${item.room_name} · ${item.room_number}호`)))
  const days = calendarDays(month)
  function toggleRoom(room: string) { setActiveRooms((current) => current.includes(room) ? current.filter((item) => item !== room) : [...current, room]) }
  function toggleStatus(status: AdminReservationStatus) { setActiveStatuses((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status]) }
  function openMonthPicker() { monthInputRef.current?.showPicker() }

  return <section>
    <PageHeading title="예약 관리" description="객실별 월간 일정에서 예약 현황을 확인하고 관리합니다." />
    <form className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm" onSubmit={search} noValidate>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-3 text-xs font-medium text-slate-700"><span className="whitespace-nowrap">키워드</span><input className="h-[44px] min-w-48 flex-1 rounded-sm border border-slate-300 px-3 py-2 text-sm font-normal" value={form.keyword} onChange={(event) => updateForm('keyword', event.target.value)} placeholder="예약번호 또는 회원명" /></label>
        <div className="flex gap-2"><Button className="min-h-9 px-4 py-2" size="sm" type="submit">검색</Button><Button className="min-h-9 px-4 py-2" size="sm" type="button" variant="secondary" onClick={reset}>초기화</Button></div>
      </div>
    </form>
    {message ? <MessageBox message={message} /> : loading ? <p className="py-16 text-center text-sm text-slate-600">예약 목록을 불러오는 중입니다.</p> : <>
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex h-7 items-center gap-0.5"><button aria-label="이전 달" className="grid h-6 w-6 translate-y-px place-items-center rounded-sm bg-transparent p-0 text-[#172b44] hover:bg-slate-100" onClick={() => moveMonth(-1)} type="button"><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></button><button aria-label="표시할 연도와 월 선택" className="flex h-7 items-center gap-2 rounded-sm bg-transparent px-1 text-lg font-semibold text-[#172b44] hover:bg-slate-100" onClick={openMonthPicker} type="button"><span>{month.replace('-', '년 ')}월</span><svg aria-hidden="true" className="h-4 w-4 translate-y-px" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect height="16" rx="2" width="16" x="4" y="5" /><path d="M8 3v4m8-4v4M4 10h16" strokeLinecap="round" /></svg></button><input aria-label="표시할 연도와 월" className="sr-only" onChange={(event) => { const next = new URLSearchParams(searchParams); next.set('month', event.target.value); setSearchParams(next) }} ref={monthInputRef} type="month" value={month} /><button aria-label="다음 달" className="grid h-6 w-6 translate-y-px place-items-center rounded-sm bg-transparent p-0 text-[#172b44] hover:bg-slate-100" onClick={() => moveMonth(1)} type="button"><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg></button><div className="ml-2 flex items-center gap-1.5 border-l border-slate-200 pl-3" aria-label="예약 상태 필터"><button aria-pressed={activeStatuses.includes('RESERVED')} className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-medium ${activeStatuses.includes('RESERVED') ? 'border-[#d7c59e] bg-[#fff8e8] text-[#5f4b28]' : 'border-slate-200 bg-white text-slate-400'}`} onClick={() => toggleStatus('RESERVED')} type="button"><i aria-hidden="true" className="h-2 w-2 rounded-sm bg-[#d7b96b]" />예약됨</button><button aria-pressed={activeStatuses.includes('CANCELLED')} className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-medium ${activeStatuses.includes('CANCELLED') ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-slate-200 bg-white text-slate-400'}`} onClick={() => toggleStatus('CANCELLED')} type="button"><i aria-hidden="true" className="h-2 w-2 rounded-sm bg-slate-400" />취소됨</button></div></div><p className="text-sm text-slate-600">이번 달 예약 <strong className="text-[#172b44]">{visibleItems.length.toLocaleString('ko-KR')}건</strong></p></div><div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3" aria-label="객실 필터"><button className={`rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${activeRooms.length === 0 ? 'border-[#172b44] bg-[#172b44] text-white' : 'border-slate-300 text-slate-700'}`} onClick={() => setActiveRooms([])} type="button">전체 객실</button>{rooms.map((room) => <button aria-pressed={activeRooms.includes(room)} className={`rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${activeRooms.includes(room) ? 'border-[#b79a67] bg-[#fff9eb] text-[#172b44]' : 'border-slate-300 text-slate-700 hover:border-[#b79a67]'}`} key={room} onClick={() => toggleRoom(room)} type="button">{room}</button>)}</div>{items.length === 0 ? <MessageBox message="이 달의 예약이 없습니다." /> : <Calendar days={days} reservations={visibleItems} />}</section>
    </>}
  </section>
}

function Calendar({ days, reservations }: { days: ReturnType<typeof calendarDays>; reservations: AdminReservation[] }) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return <div className="mt-4 overflow-x-auto"><div className="min-w-[840px]"><div className="grid grid-cols-7 border-l border-t border-slate-200">{weekdays.map((day, index) => <div className={`border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium ${index === 0 ? 'text-error' : index === 6 ? 'text-[#466a9c]' : 'text-slate-600'}`} key={day}>{day}</div>)}{days.map((day, index) => {
    const dayReservations = reservations.filter((reservation) => reservation.check_in_date <= day.date && reservation.check_out_date > day.date)
    return <div className={`min-h-28 border-b border-r border-slate-200 p-2 ${day.inMonth ? 'bg-white' : 'bg-slate-50/70'}`} key={day.date}><p className={`mb-2 text-xs ${day.inMonth ? 'text-slate-700' : 'text-slate-400'} ${index % 7 === 0 ? 'text-error' : index % 7 === 6 ? 'text-[#466a9c]' : ''}`}>{day.day}</p><div className="grid gap-1">{dayReservations.map((reservation) => {
      const starts = reservation.check_in_date === day.date || index % 7 === 0
      const ends = reservation.check_out_date === nextDate(day.date) || index % 7 === 6
      return <Link aria-label={`${reservation.resv_number} 예약 상세`} className={`block truncate border-y px-2 py-1 text-[11px] font-medium no-underline ${reservation.resv_status === 'CANCELLED' ? 'border-slate-300 bg-slate-100 text-slate-500 line-through' : 'border-[#d7c59e] bg-[#fff8e8] text-[#5f4b28]'} ${starts ? 'rounded-l-sm border-l' : ''} ${ends ? 'rounded-r-sm border-r' : ''}`} key={reservation.resv_id} title={`${reservation.room_name} ${reservation.room_number}호 · ${reservation.member_name} · ${reservation.guest_count}명`} to={`/admin/reservations/${reservation.resv_id}`}>{starts ? `${reservation.room_number}호 · ${reservation.member_name} · ${reservation.guest_count}명` : `↳ ${reservation.guest_count}명`}</Link>
    })}</div></div>
  })}</div></div></div>
}

function AdminReservationDetailPage({ resvId }: { resvId: string }) {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AdminReservationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmingRestore, setConfirmingRestore] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setMessage('')
    try { setDetail(await adminReservationApi.detail(resvId)) }
    catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) { setReturnPath(`/admin/reservations/${resvId}`); navigate('/login', { replace: true }); return }
      setDetail(null)
      setMessage(apiError.status === 403 ? '예약 상세를 조회할 권한이 없습니다.' : apiError.status === 404 ? '예약 정보를 찾을 수 없습니다.' : errorMessage(error, '예약 정보를 불러오지 못했습니다.'))
    } finally { setLoading(false) }
  }, [navigate, resvId])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const canCancel = detail?.resv_status === 'RESERVED' && detail.check_in_date > seoulToday()
  async function cancel() {
    if (!detail) return
    setCancelling(true); setMessage('')
    try {
      const result = await adminReservationApi.cancel(resvId)
      setDetail({ ...detail, resv_status: result.resv_status, cancelled_at: result.cancelled_at })
      setConfirming(false)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) { setReturnPath(`/admin/reservations/${resvId}`); navigate('/login', { replace: true }); return }
      if (apiError.code === 'RESV_CANNOT_CANCEL') { await load(); setMessage('현재 예약 상태에서는 취소할 수 없습니다.') }
      else setMessage(apiError.status === 403 ? '예약을 취소할 권한이 없습니다.' : apiError.status === 404 ? '예약 정보를 찾을 수 없습니다.' : errorMessage(error, '예약 취소에 실패했습니다.'))
      setConfirming(false)
    } finally { setCancelling(false) }
  }
  async function restore() {
    if (!detail) return
    setRestoring(true); setMessage('')
    try {
      const result = await adminReservationApi.restore(resvId)
      setDetail({ ...detail, resv_status: result.resv_status, cancelled_at: result.cancelled_at })
      setConfirmingRestore(false)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) { setReturnPath(`/admin/reservations/${resvId}`); navigate('/login', { replace: true }); return }
      setMessage(apiError.status === 403 ? '예약 복구 권한이 없습니다.' : apiError.status === 404 ? '예약 정보를 찾을 수 없습니다.' : errorMessage(error, '예약 복구에 실패했습니다.'))
      setConfirmingRestore(false)
    } finally { setRestoring(false) }
  }
  if (loading) return <p className="py-16 text-center text-sm text-slate-600">예약 정보를 불러오는 중입니다.</p>
  if (!detail) return <section><PageHeading title="예약 상세" description="예약 상태와 상세 정보를 확인합니다." /><MessageBox message={message || '예약 정보를 찾을 수 없습니다.'}><Link className="mt-4 inline-block text-sm text-[#172b44] underline" to="/admin/reservations">예약 목록으로 돌아가기</Link></MessageBox></section>
  return (
    <section className="w-full">
      <Link className="text-sm text-[#172b44] underline underline-offset-4" to="/admin/reservations">← 예약 목록</Link>
      <PageHeading title="예약 상세" description="예약 및 회원 정보를 확인하고 필요한 경우 예약을 취소합니다." />
      {message && <p className="mb-4 text-sm text-error" role="alert">{message}</p>}
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="grid gap-5 border-b border-slate-200 bg-slate-50 px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-8">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-[#a77f3b]">RESERVATION NUMBER</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold tracking-tight text-[#172b44]">{detail.resv_number}</h3>
              <StatusBadge status={detail.resv_status} />
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-medium tracking-[0.12em] text-slate-500">TOTAL AMOUNT</p>
            <p className="mt-1 text-2xl font-semibold text-[#172b44]">{won(detail.total_price)}</p>
          </div>
        </header>
        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
          <section className="px-6 py-7 md:px-8 lg:border-r lg:border-slate-200">
            <p className="text-[10px] font-semibold tracking-[0.13em] text-[#a77f3b]">STAY DETAILS</p>
            <h4 className="mt-2 text-lg font-semibold text-[#172b44]">{detail.room_name} · {detail.room_number}호</h4>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ReservationMetric label="체크인" value={detail.check_in_date} />
              <ReservationMetric label="체크아웃" value={detail.check_out_date} />
              <ReservationMetric label="숙박일수" value={`${detail.nights}박`} />
              <ReservationMetric label="숙박 인원" value={`${detail.guest_count}명`} />
            </dl>
          </section>
          <section className="border-t border-slate-200 bg-[#fffdf8] px-6 py-7 md:px-8 lg:border-t-0">
            <p className="text-[10px] font-semibold tracking-[0.13em] text-[#a77f3b]">MEMBER</p>
            <h4 className="mt-2 text-lg font-semibold text-[#172b44]">{detail.member_name}</h4>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-t border-[#e8dfcf] pt-3">
                <dt className="text-slate-500">전화번호</dt>
                <dd className="font-medium text-slate-800">{detail.phone_number}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[#e8dfcf] pt-3">
                <dt className="text-slate-500">현재 상태</dt>
                <dd className="font-medium text-slate-800">{detail.resv_status === 'CANCELLED' ? '취소됨' : '예약됨'}</dd>
              </div>
            </dl>
          </section>
        </div>
        <dl className="grid gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          <ReservationSummary label="예약 생성" value={formatDateTime(detail.created_at)} />
          <ReservationSummary label="취소 일시" value={detail.cancelled_at ? formatDateTime(detail.cancelled_at) : '해당 없음'} />
          <ReservationSummary label="1박 가격" value={won(detail.price_per_night)} />
          <ReservationSummary emphasis label="총 예약 금액" value={won(detail.total_price)} />
        </dl>
      </article>
      {canCancel ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ead8d2] bg-[#fffaf8] p-5"><p className="text-sm text-slate-700">체크인 전날까지 예약을 취소할 수 있습니다.</p><Button className="!min-h-9 px-3 py-1.5" variant="danger" onClick={() => setConfirming(true)}>예약 취소</Button></div> : detail.resv_status === 'CANCELLED' ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d7c59e] bg-[#fffdf7] p-5"><p className="text-sm text-slate-700">취소된 예약입니다. 복구하면 예약 상태가 다시 예약으로 변경됩니다.</p><Button className="!min-h-9 px-3 py-1.5" onClick={() => setConfirmingRestore(true)} size="sm">예약 복구</Button></div> : <p className="mt-6 text-sm text-error">체크인 당일부터는 예약을 취소할 수 없습니다.</p>}
      {confirming && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="presentation"><section aria-describedby="cancel-description" aria-labelledby="cancel-title" aria-modal="true" className="w-full max-w-[448px] rounded-lg bg-white p-6 shadow-xl" role="dialog"><h3 className="text-lg font-semibold text-[#172b44]" id="cancel-title">예약을 취소하시겠습니까?</h3><p className="mt-3 text-sm text-slate-600" id="cancel-description">{detail.resv_number} 예약을 취소합니다. 취소 후에는 되돌릴 수 없습니다.</p><div className="mt-6 flex justify-end gap-2"><Button disabled={cancelling} variant="secondary" onClick={() => setConfirming(false)}>닫기</Button><Button disabled={cancelling} variant="danger" onClick={() => void cancel()}>{cancelling ? '취소 처리 중' : '예약 취소'}</Button></div></section></div>}
      {confirmingRestore && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="presentation"><section aria-describedby="restore-description" aria-labelledby="restore-title" aria-modal="true" className="w-full max-w-[448px] rounded-lg bg-white p-6 shadow-xl" role="dialog"><h3 className="text-lg font-semibold text-[#172b44]" id="restore-title">예약을 복구하시겠습니까?</h3><p className="mt-3 text-sm text-slate-600" id="restore-description">{detail.resv_number} 예약을 다시 예약 상태로 변경합니다.</p><div className="mt-6 flex justify-end gap-2"><Button disabled={restoring} variant="secondary" onClick={() => setConfirmingRestore(false)}>닫기</Button><Button disabled={restoring} onClick={() => void restore()}>{restoring ? '복구 처리 중' : '예약 복구'}</Button></div></section></div>}
    </section>
  )
}

function PageHeading({ title, description }: { title: string; description: string }) { return <header className="mb-5 border-b border-slate-300 pb-6"><p className="text-[11px] font-semibold tracking-[0.16em] text-[#a77f3b]">ADMINISTRATION</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#172b44]">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p></header> }
function MessageBox({ message, children }: { message: string; children?: ReactNode }) { return <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-600" role="alert"><p>{message}</p>{children}</div> }
function ReservationMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4"><dt className="text-[10px] font-medium tracking-[0.08em] text-slate-500">{label}</dt><dd className="mt-2 text-sm font-semibold text-[#172b44]">{value}</dd></div>
}
function ReservationSummary({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className="bg-slate-50 px-6 py-5"><dt className="text-[10px] font-medium tracking-[0.08em] text-slate-500">{label}</dt><dd className={`mt-2 text-sm font-semibold ${emphasis ? 'text-[#a77f3b]' : 'text-slate-800'}`}>{value}</dd></div>
}
