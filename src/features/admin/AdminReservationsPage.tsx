import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, StatusBadge } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { setReturnPath } from '../auth/session'
import { adminReservationApi } from './reservationApi'
import { AdminPageHeading } from './shared'
import type { AdminReservation, AdminReservationDetail, AdminReservationFilters, AdminReservationStatus } from './reservationTypes'

type FilterForm = {
  keyword: string
}

type RoomTypeColor = {
  background: string
  border: string
  text: string
}

const emptyFilters: FilterForm = { keyword: '' }
function roomTypeColor(index: number, count: number): RoomTypeColor {
  // Evenly distribute hues across the full wheel instead of cycling a finite
  // palette, so two room types never receive the same color.
  const hue = Math.round((index * 360) / Math.max(count, 1))
  return {
    background: `hsl(${hue} 52% 94%)`,
    border: `hsl(${hue} 38% 58%)`,
    text: `hsl(${hue} 42% 28%)`,
  }
}
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

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message || fallback : fallback
}

function formatDateTime(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)
  return match ? `${match[1]}. ${match[2]}. ${match[3]}. ${match[4]}:${match[5]}` : value
}

function reservationInfoRows(detail: AdminReservationDetail): Array<[string, string]> {
  const rows: Array<[string, string]> = [['생성일', formatDateTime(detail.created_at)]]
  if (detail.cancelled_at) rows.push(['취소일시', formatDateTime(detail.cancelled_at)])
  return rows
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
  // null means every room is selected. This keeps the all-room state distinct
  // from a user intentionally clearing individual room selections.
  const [activeRooms, setActiveRooms] = useState<string[] | null>(null)
  const [activeStatuses, setActiveStatuses] = useState<AdminReservationStatus[]>(['RESERVED', 'CANCELLED'])
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const monthInputRef = useRef<HTMLInputElement>(null)
  const month = /^\d{4}-\d{2}$/.test(searchParams.get('month') ?? '') ? searchParams.get('month')! : currentMonth()
  const range = monthRange(month)

  useEffect(() => {
    const filters: AdminReservationFilters = { ...(searchParams.get('keyword') ? { keyword: searchParams.get('keyword')! } : {}), search_from_date: range.from, search_to_date: range.to, page_num: 0, page_size: 100 }
    const load = async () => {
      setLoading(true); setMessage('')
      try { setItems((await adminReservationApi.list(filters)).resv_list) }
      catch (error) {
        const apiError = error as ApiError
        if (apiError.status === 401) { setReturnPath(`/admin/reservations${searchParams.size ? `?${searchParams}` : ''}`); navigate('/login', { replace: true }); return }
        setItems([]); setMessage(apiError.status === 403 ? '예약 관리 권한이 없습니다.' : errorMessage(error, '예약 목록을 불러오지 못했습니다.'))
      } finally { setLoading(false) }
    }
    void load()
  }, [navigate, range.from, range.to, searchParams])

  const roomGroups = Array.from(items.reduce((groups, item) => {
    const key = item.room_name
    const roomKey = `${item.room_name}::${item.room_number}`
    const group = groups.get(key) ?? { room_name: item.room_name, rooms: [] as { key: string; room_number: string }[] }
    if (!group.rooms.some((room) => room.key === roomKey)) group.rooms.push({ key: roomKey, room_number: item.room_number })
    groups.set(key, group)
    return groups
  }, new Map<string, { room_name: string; rooms: { key: string; room_number: string }[] }>()).values())
  const allRoomKeys = roomGroups.flatMap((group) => group.rooms.map((room) => room.key))
  const selectedRoomCount = activeRooms?.length ?? allRoomKeys.length
  const colorsByRoomType = Object.fromEntries(roomGroups.map((group, index) => [group.room_name, roomTypeColor(index, roomGroups.length)])) as Record<string, RoomTypeColor>
  const visibleItems = items.filter((item) => activeStatuses.includes(item.resv_status) && (activeRooms === null || activeRooms.includes(`${item.room_name}::${item.room_number}`)))
  const days = calendarDays(month)
  const updateForm = (name: keyof FilterForm, value: string) => setForm((current) => ({ ...current, [name]: value }))
  const search = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = new URLSearchParams(); if (form.keyword.trim()) next.set('keyword', form.keyword.trim()); next.set('month', month); setSearchParams(next) }
  const reset = () => { setForm(emptyFilters); setActiveRooms(null); setActiveStatuses(['RESERVED', 'CANCELLED']); setSearchParams({ month }) }
  const moveMonth = (amount: number) => { const next = new URLSearchParams(searchParams); next.set('month', shiftMonth(month, amount)); setSearchParams(next) }
  const toggleStatus = (status: AdminReservationStatus) => setActiveStatuses((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status])
  const openMonthPicker = () => monthInputRef.current?.showPicker()
  const toggleRoomKeys = (keys: string[]) => setActiveRooms((current) => {
    const selected = new Set(current ?? allRoomKeys)
    const allSelected = keys.every((key) => selected.has(key))
    keys.forEach((key) => allSelected ? selected.delete(key) : selected.add(key))
    return selected.size === allRoomKeys.length ? null : [...selected]
  })

  return <section>
    <AdminPageHeading title="예약 관리" description="객실별 월간 일정에서 예약 현황을 확인하고 관리합니다." />
    <form className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm" noValidate onSubmit={search}>
      <div className="flex flex-wrap items-center gap-2"><label className="flex flex-1 items-center gap-3 text-xs font-medium text-slate-700"><span className="whitespace-nowrap">키워드</span><input className="h-[44px] min-w-48 flex-1 rounded-sm border border-slate-300 px-3 py-2 text-sm font-normal" onChange={(event) => updateForm('keyword', event.target.value)} placeholder="예약번호 또는 회원명" value={form.keyword} /></label><div className="flex gap-2"><Button className="min-h-9 px-4 py-2" size="sm" type="submit">검색</Button><Button className="min-h-9 px-4 py-2" onClick={reset} size="sm" type="button" variant="secondary">초기화</Button></div></div>
    </form>
    {message ? <MessageBox message={message} /> : loading ? <p className="py-16 text-center text-sm text-slate-600">예약 목록을 불러오는 중입니다.</p> : <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex h-7 items-center gap-0.5"><button aria-label="이전 달" className="grid h-6 w-6 place-items-center rounded-sm hover:bg-slate-100" onClick={() => moveMonth(-1)} type="button">‹</button><button aria-label="표시할 연도와 월 선택" className="flex h-7 items-center gap-2 rounded-sm px-1 text-lg font-semibold text-[#172b44] hover:bg-slate-100" onClick={openMonthPicker} type="button">{month.replace('-', '년 ')}월</button><input aria-label="표시할 연도와 월" className="sr-only" onChange={(event) => { const next = new URLSearchParams(searchParams); next.set('month', event.target.value); setSearchParams(next) }} ref={monthInputRef} type="month" value={month} /><button aria-label="다음 달" className="grid h-6 w-6 place-items-center rounded-sm hover:bg-slate-100" onClick={() => moveMonth(1)} type="button">›</button><div aria-label="예약 상태 필터" className="ml-2 flex items-center gap-1.5 border-l border-slate-200 pl-3"><button aria-pressed={activeStatuses.includes('RESERVED')} className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-medium ${activeStatuses.includes('RESERVED') ? 'border-[#d7c59e] bg-[#fff8e8] text-[#5f4b28]' : 'border-slate-200 bg-white text-slate-400'}`} onClick={() => toggleStatus('RESERVED')} type="button"><i aria-hidden="true" className="h-2 w-2 rounded-sm bg-[#d7b96b]" />예약됨</button><button aria-pressed={activeStatuses.includes('CANCELLED')} className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-medium ${activeStatuses.includes('CANCELLED') ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-slate-200 bg-white text-slate-400'}`} onClick={() => toggleStatus('CANCELLED')} type="button"><i aria-hidden="true" className="h-2 w-2 rounded-sm bg-slate-400" />취소됨</button></div></div><p className="text-sm text-slate-600">이번 달 예약 <strong className="text-[#172b44]">{visibleItems.length.toLocaleString('ko-KR')}건</strong></p></div>
      <fieldset className="mt-4 border-t border-slate-100 pt-4"><legend className="sr-only">객실 필터</legend><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-baseline gap-2"><span className="text-xs font-semibold text-slate-700">객실 필터</span><span className="text-[11px] text-slate-500">{selectedRoomCount}/{allRoomKeys.length}개 선택</span></div><div className="flex items-center gap-2"><button aria-controls="room-filter-options" aria-expanded={filtersExpanded} className="rounded-sm border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#b79a67]" onClick={() => setFiltersExpanded((current) => !current)} type="button">{filtersExpanded ? '필터 접기' : '필터 펼치기'}</button><button aria-pressed={activeRooms === null} className={`rounded-sm border px-3 py-1.5 text-xs font-medium ${activeRooms === null ? 'border-[#172b44] bg-[#172b44] text-white' : 'border-slate-300 text-slate-700 hover:border-[#b79a67]'}`} onClick={() => setActiveRooms(null)} type="button">전체 객실 선택</button></div></div>{filtersExpanded && <div className="mt-3 grid gap-2 lg:grid-cols-2 2xl:grid-cols-3" id="room-filter-options">{roomGroups.map((group) => { const keys = group.rooms.map((room) => room.key); const typeSelected = activeRooms === null || keys.every((key) => activeRooms.includes(key)); const selectedCount = activeRooms === null ? keys.length : keys.filter((key) => activeRooms.includes(key)).length; const color = colorsByRoomType[group.room_name]; return <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white sm:grid-cols-[minmax(190px,0.7fr)_1fr]" key={group.room_name}><button aria-pressed={typeSelected} className="flex min-h-12 items-center gap-2 border-b border-slate-200 px-4 text-left text-xs font-semibold transition hover:brightness-95 sm:border-r sm:border-b-0" onClick={() => toggleRoomKeys(keys)} style={{ backgroundColor: typeSelected ? color.background : '#f8fafc', color: typeSelected ? color.text : '#475569' }} type="button"><i aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color.border }} /><span className="min-w-0 whitespace-normal break-keep">{group.room_name}</span><span className="ml-auto shrink-0 text-[11px] font-normal opacity-80">{selectedCount}/{keys.length}</span></button><div aria-label={`${group.room_name} 호수 선택`} className="flex flex-wrap content-center gap-2 p-2.5">{group.rooms.map((room) => { const selected = activeRooms === null || activeRooms.includes(room.key); return <button aria-pressed={selected} className="min-w-12 rounded-sm border px-2.5 py-1.5 text-xs font-medium transition" key={room.key} onClick={() => toggleRoomKeys([room.key])} style={selected ? { backgroundColor: color.background, borderColor: color.border, color: color.text } : undefined} type="button">{room.room_number}호</button> })}</div></section> })}</div>}</fieldset>
      {items.length === 0 ? <MessageBox message="이 달의 예약이 없습니다." /> : visibleItems.length === 0 ? <MessageBox message="선택한 필터에 맞는 예약이 없습니다." /> : <Calendar colorsByRoomType={colorsByRoomType} days={days} reservations={visibleItems} />}
    </section>}
  </section>
}

type ReservationSegment = { reservation: AdminReservation; start: number; end: number; lane: number }

function weekSegments(days: ReturnType<typeof calendarDays>, reservations: AdminReservation[]) {
  const lanes: boolean[][] = []
  return reservations.filter((reservation) => reservation.check_in_date <= days[6].date && reservation.check_out_date > days[0].date).sort((a, b) => a.check_in_date.localeCompare(b.check_in_date)).map((reservation) => {
    const start = Math.max(0, days.findIndex((day) => day.date >= reservation.check_in_date))
    const firstAfterEnd = days.findIndex((day) => day.date >= reservation.check_out_date)
    const end = firstAfterEnd === -1 ? 7 : firstAfterEnd
    let lane = lanes.findIndex((occupied) => !occupied.slice(start, end).some(Boolean))
    if (lane === -1) { lane = lanes.length; lanes.push(Array(7).fill(false)) }
    for (let index = start; index < end; index += 1) lanes[lane][index] = true
    return { reservation, start, end, lane }
  }) as ReservationSegment[]
}

function Calendar({ colorsByRoomType, days, reservations }: { colorsByRoomType: Record<string, RoomTypeColor>; days: ReturnType<typeof calendarDays>; reservations: AdminReservation[] }) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return <div className="mt-4 overflow-x-auto"><div className="min-w-[840px]"><div className="grid grid-cols-7 border-l border-t border-slate-200">{weekdays.map((day, index) => <div className={`border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium ${index === 0 ? 'text-error' : index === 6 ? 'text-[#466a9c]' : 'text-slate-600'}`} key={day}>{day}</div>)}</div>{Array.from({ length: 6 }, (_, weekIndex) => { const week = days.slice(weekIndex * 7, weekIndex * 7 + 7); const segments = weekSegments(week, reservations); const laneCount = Math.max(1, ...segments.map((segment) => segment.lane + 1)); return <div className="grid grid-cols-7 border-l border-b border-slate-200" key={week[0].date} style={{ gridTemplateRows: `30px repeat(${laneCount}, 28px)` }}>{week.map((day, index) => <div className={`z-0 border-r border-slate-200 p-2 ${day.inMonth ? 'bg-white' : 'bg-slate-50/70'}`} key={day.date} style={{ gridColumn: index + 1, gridRow: `1 / span ${laneCount + 1}` }}><p className={`text-xs ${day.inMonth ? 'text-slate-700' : 'text-slate-400'} ${index === 0 ? 'text-error' : index === 6 ? 'text-[#466a9c]' : ''}`}>{day.day}</p></div>)}{segments.map(({ reservation, start, end, lane }) => { const color = colorsByRoomType[reservation.room_name] ?? roomTypeColor(0, 1); const cancelled = reservation.resv_status === 'CANCELLED'; return <Link aria-label={`${reservation.resv_number} 예약 상세`} className={`z-10 mx-px self-center truncate border px-2 py-1 text-[11px] font-medium no-underline ${cancelled ? 'border-slate-300 bg-slate-100 text-slate-500 line-through' : ''} ${start === 0 ? 'rounded-l-none border-l-0' : 'rounded-l-sm'} ${end === 7 ? 'rounded-r-none border-r-0' : 'rounded-r-sm'}`} key={reservation.resv_id} style={{ ...(cancelled ? {} : { backgroundColor: color.background, borderColor: color.border, color: color.text }), gridColumn: `${start + 1} / ${end + 1}`, gridRow: lane + 2 }} title={`${reservation.room_name} ${reservation.room_number}호 · ${reservation.member_name} · ${reservation.guest_count}명`} to={`/admin/reservations/${reservation.resv_id}`}>{reservation.room_name} · {reservation.room_number}호 · {reservation.member_name} · {reservation.guest_count}명</Link> })}</div> })}</div></div>
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
  if (!detail) return <section><AdminPageHeading title="예약 상세" description="예약 상태와 상세 정보를 확인합니다." /><MessageBox message={message || '예약 정보를 찾을 수 없습니다.'}><Link className="mt-4 inline-block text-sm text-[#172b44] underline" to="/admin/reservations">예약 목록으로 돌아가기</Link></MessageBox></section>
  return <section className="max-w-4xl"><Link className="text-sm text-[#172b44] underline underline-offset-4" to="/admin/reservations">← 예약 목록</Link><AdminPageHeading title="예약 상세" description="예약 및 회원 정보를 확인하고 필요한 경우 예약을 취소합니다." />
    {message && <p className="mb-4 text-sm text-error" role="alert">{message}</p>}
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5"><div className="flex items-end gap-3"><div><p className="text-xs font-medium tracking-[0.12em] text-slate-500">RESERVATION NUMBER</p><h3 className="mt-1 text-xl font-semibold text-[#172b44]">{detail.resv_number}</h3></div><StatusBadge status={detail.resv_status} /></div><div className="text-right"><p className="text-xs font-medium tracking-[0.12em] text-slate-500">MEMBER</p><p className="mt-1 text-base font-semibold text-[#172b44]">{detail.member_name}</p></div></div><div className="grid gap-x-10 md:grid-cols-2"><DetailGroup title="예약 정보" rows={reservationInfoRows(detail)} /><DetailGroup title="회원 정보" rows={[["회원명", detail.member_name], ["전화번호", detail.phone_number]]} /><DetailGroup title="객실·숙박" rows={[["객실", `${detail.room_name} · ${detail.room_number}호`], ["체크인", detail.check_in_date], ["체크아웃", detail.check_out_date], ["숙박일수", `${detail.nights}박`], ["숙박 인원", `${detail.guest_count}명`]]} /><DetailGroup title="금액" rows={[["1박 가격", won(detail.price_per_night)], ["총 예약 금액", won(detail.total_price)]]} /></div></article>
    {canCancel ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ead8d2] bg-[#fffaf8] p-5"><p className="text-sm text-slate-700">체크인 전날까지 예약을 취소할 수 있습니다.</p><Button className="!min-h-9 px-3 py-1.5" variant="danger" onClick={() => setConfirming(true)}>예약 취소</Button></div> : detail.resv_status === 'CANCELLED' ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d7c59e] bg-[#fffdf7] p-5"><p className="text-sm text-slate-700">취소된 예약입니다. 복구하면 예약 상태가 다시 예약으로 변경됩니다.</p><Button className="!min-h-9 px-3 py-1.5" onClick={() => setConfirmingRestore(true)} size="sm">예약 복구</Button></div> : <p className="mt-6 text-sm text-error">체크인 당일부터는 예약을 취소할 수 없습니다.</p>}
    {confirming && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="presentation"><section aria-describedby="cancel-description" aria-labelledby="cancel-title" aria-modal="true" className="w-full max-w-[448px] rounded-lg bg-white p-6 shadow-xl" role="dialog"><h3 className="text-lg font-semibold text-[#172b44]" id="cancel-title">예약을 취소하시겠습니까?</h3><p className="mt-3 text-sm text-slate-600" id="cancel-description">{detail.resv_number} 예약을 취소합니다. 취소 후에는 되돌릴 수 없습니다.</p><div className="mt-6 flex justify-end gap-2"><Button disabled={cancelling} variant="secondary" onClick={() => setConfirming(false)}>닫기</Button><Button disabled={cancelling} variant="danger" onClick={() => void cancel()}>{cancelling ? '취소 처리 중' : '예약 취소'}</Button></div></section></div>}
    {confirmingRestore && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="presentation"><section aria-describedby="restore-description" aria-labelledby="restore-title" aria-modal="true" className="w-full max-w-[448px] rounded-lg bg-white p-6 shadow-xl" role="dialog"><h3 className="text-lg font-semibold text-[#172b44]" id="restore-title">예약을 복구하시겠습니까?</h3><p className="mt-3 text-sm text-slate-600" id="restore-description">{detail.resv_number} 예약을 다시 예약 상태로 변경합니다.</p><div className="mt-6 flex justify-end gap-2"><Button disabled={restoring} variant="secondary" onClick={() => setConfirmingRestore(false)}>닫기</Button><Button disabled={restoring} onClick={() => void restore()}>{restoring ? '복구 처리 중' : '예약 복구'}</Button></div></section></div>}
  </section>
}

function MessageBox({ message, children }: { message: string; children?: ReactNode }) { return <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-600" role="alert"><p>{message}</p>{children}</div> }
function DetailGroup({ title, rows }: { title: string; rows: Array<[string, string]> }) { return <section className="border-b border-slate-100 py-5"><h4 className="text-sm font-semibold text-[#172b44]">{title}</h4><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[110px_1fr]"><>{rows.map(([label, value]) => <div className="contents" key={label}><dt className="text-slate-500">{label}</dt><dd className="m-0 text-slate-800">{value}</dd></div>)}</></dl></section> }
