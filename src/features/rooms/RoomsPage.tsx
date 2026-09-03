import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SkeletonCards } from '../../components/motion'
import { useRevealAll } from '../../components/motion/hooks'
import roomImage1 from '../../assets/rooms1.png'
import roomImage2 from '../../assets/rooms2.png'
import roomImage3 from '../../assets/rooms3.png'
import roomImage4 from '../../assets/rooms4.png'
import roomImage5 from '../../assets/rooms5.png'
import {
  bookingToQuery,
  nightsBetween,
  setBooking,
  useBooking,
  withFallbackCheckOut,
} from '../reservation/bookingStore'
import { seoulToday } from '../reservation/reservationSearchDefaults'
import { roomsApi } from './api'
import type { RoomSummary, RoomType } from './types'

const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })
const roomImages = [roomImage1, roomImage2, roomImage3, roomImage4, roomImage5]
const typeName: Record<RoomType, string> = { STAY: '스테이', REST: '휴식', MEDITATE: '명상', RETREAT: '리트리트' }
const priceStep = 10_000

const roundUp = (value: number) => Math.ceil(value / priceStep) * priceStep
const roundDown = (value: number) => Math.floor(value / priceStep) * priceStep

export function RoomsPage() {
  const navigate = useNavigate()
  const booking = useBooking()
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [types, setTypes] = useState<RoomType[]>([])
  const [sort, setSort] = useState('recommended')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [fitsGuests, setFitsGuests] = useState(false)

  useEffect(() => {
    let active = true
    roomsApi.list()
      .then((data) => active && setRooms(data))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : '객실 목록을 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  // 가격 범위는 실제 응답에서 뽑는다. 고정 문구("₩90,000 — ₩220,000")는 데이터와 어긋날 수 있다.
  const priceBounds = useMemo(() => {
    if (rooms.length === 0) return null
    const prices = rooms.map((room) => room.basePrice)
    return { min: roundDown(Math.min(...prices)), max: roundUp(Math.max(...prices)) }
  }, [rooms])
  const activeMaxPrice = maxPrice ?? priceBounds?.max ?? null

  const visibleRooms = useMemo(() => {
    let filtered = types.length ? rooms.filter((room) => types.includes(room.roomType)) : rooms
    if (activeMaxPrice !== null) filtered = filtered.filter((room) => room.basePrice <= activeMaxPrice)
    if (fitsGuests) filtered = filtered.filter((room) => room.maxGuests >= booking.guest_count)
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.basePrice - b.basePrice)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.basePrice - a.basePrice)
    return filtered
  }, [activeMaxPrice, booking.guest_count, fitsGuests, rooms, sort, types])
  // 목록이 도착한 뒤에 그려지므로 길이를 키로 리빌 관찰을 다시 건다.
  useRevealAll(`rooms-${visibleRooms.length}`)

  const nights = nightsBetween(booking.check_in_date, booking.check_out_date)
  const filtersActive = types.length > 0 || fitsGuests || (priceBounds !== null && activeMaxPrice !== null && activeMaxPrice < priceBounds.max)

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    navigate(`/reservations?${bookingToQuery(withFallbackCheckOut(booking), { search: '1' })}`)
  }

  const resetFilters = () => {
    setTypes([])
    setFitsGuests(false)
    setMaxPrice(null)
  }

  const toggleType = (type: RoomType) => {
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])
  }

  return (
    <main className="bg-canvas">
      <section className="bg-subtle px-6 pt-12 pb-10 md:px-12 md:pt-14 md:pb-11">
        <div className="mx-auto max-w-[1240px]">
          <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">STAY · YANGYANG, GANGWON</p>
          <h1 className="mt-3 font-display text-[48px] leading-none font-medium md:text-[58px]">Find your quiet room.</h1>
          <p className="mt-4 text-sm leading-7 text-ink-700">머무는 방식과 회복의 리듬에 맞는 객실을 찾아보세요. 객실마다 전망, 정원, 제공 프로그램이 다릅니다.</p>
          <form className="mt-8 grid gap-3 rounded-xl bg-white p-4 shadow-floating md:grid-cols-[1.1fr_1fr_1fr_.8fr_auto] md:items-center md:p-5" onSubmit={submitSearch}>
            <div className="px-4 py-2"><span className="block text-[9px] font-medium tracking-[0.15em] text-ink-500">LOCATION</span><strong className="mt-2 block text-xs font-medium">양양 · MSDS Guesthouse</strong></div>
            <label className="rounded-md border border-ivory-200 px-4 py-3 text-[9px] font-medium tracking-[0.12em] text-ink-500">CHECK-IN<input className="mt-2 block w-full border-0 bg-transparent text-xs tracking-normal text-navy-900 outline-none" min={seoulToday()} onChange={(event) => setBooking({ check_in_date: event.target.value })} type="date" value={booking.check_in_date} /></label>
            <label className="rounded-md border border-ivory-200 px-4 py-3 text-[9px] font-medium tracking-[0.12em] text-ink-500">CHECK-OUT{nights > 0 ? ` · ${nights}박` : ''}<input className="mt-2 block w-full border-0 bg-transparent text-xs tracking-normal text-navy-900 outline-none" min={booking.check_in_date} onChange={(event) => setBooking({ check_out_date: event.target.value })} type="date" value={booking.check_out_date} /></label>
            <label className="rounded-md border border-ivory-200 px-4 py-3 text-[9px] font-medium tracking-[0.12em] text-ink-500">GUESTS<select className="mt-2 block w-full border-0 bg-transparent text-xs tracking-normal text-navy-900 outline-none" onChange={(event) => setBooking({ guest_count: Number(event.target.value) })} value={booking.guest_count}>{[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count} Adults</option>)}</select></label>
            <button className="h-12 rounded-sm bg-navy-900 px-7 text-[11px] font-medium tracking-[0.08em] text-white hover:bg-navy-700" type="submit">SEARCH ROOMS</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-14 md:px-0 md:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="font-display text-[34px] font-medium">{visibleRooms.length} ROOMS · {booking.check_in_date.replaceAll('-', '.')}{booking.check_out_date ? `—${booking.check_out_date.replaceAll('-', '.')}` : ''}</h2>
          <label className="flex items-center gap-3 rounded-sm border border-ivory-200 bg-white px-4 py-3 text-[9px] tracking-[0.12em] text-ink-500">SORT BY<select className="border-0 bg-transparent text-[10px] text-navy-900 outline-none" onChange={(event) => setSort(event.target.value)} value={sort}><option value="recommended">추천순</option><option value="price-asc">낮은 가격순</option><option value="price-desc">높은 가격순</option></select></label>
        </div>

        <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-lg border border-ivory-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-ivory-200 pb-5"><strong className="text-[11px] font-medium tracking-[0.14em]">FILTERS</strong><button className={`text-[10px] transition-colors ${filtersActive ? 'text-gold-500 hover:text-navy-900' : 'text-ink-500/45'}`} disabled={!filtersActive} onClick={resetFilters} type="button">초기화</button></div>

            <div className="border-b border-ivory-200 py-5">
              <p className="text-[10px] font-medium tracking-[0.1em]">PRICE / NIGHT</p>
              {priceBounds ? (
                <>
                  <p className="mt-4 text-xs text-ink-700">{won.format(priceBounds.min)} — {won.format(activeMaxPrice ?? priceBounds.max)}</p>
                  <input
                    aria-label="1박 최대 가격"
                    className="mt-4 h-1 w-full appearance-none rounded-full bg-ivory-200 accent-gold-500"
                    max={priceBounds.max}
                    min={priceBounds.min}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    step={priceStep}
                    type="range"
                    value={activeMaxPrice ?? priceBounds.max}
                  />
                  <p className="mt-2 text-[9px] text-ink-500">{visibleRooms.length}개 객실이 조건에 맞습니다.</p>
                </>
              ) : (
                <p className="mt-4 text-[10px] leading-4 text-ink-500">객실 정보가 도착하면 실제 가격 범위로 표시됩니다.</p>
              )}
            </div>

            <fieldset className="border-b border-ivory-200 py-5"><legend className="mb-3 text-[10px] font-medium tracking-[0.1em]">ROOM TYPE</legend><label className="flex items-center justify-between py-1.5 text-xs"><span><input checked={types.length === 0} className="mr-2 accent-navy-900" onChange={() => setTypes([])} type="checkbox" />전체 객실</span><span>{rooms.length}</span></label>{(Object.entries(typeName) as [RoomType, string][]).map(([type, label]) => <label className="flex items-center justify-between py-1.5 text-xs" key={type}><span><input checked={types.includes(type)} className="mr-2 accent-navy-900" onChange={() => toggleType(type)} type="checkbox" />{label}</span><span>{rooms.filter((room) => room.roomType === type).length}</span></label>)}</fieldset>

            <fieldset className="py-5">
              <legend className="mb-3 text-[10px] font-medium tracking-[0.1em]">CAPACITY</legend>
              <label className="flex items-center justify-between py-1.5 text-xs"><span><input checked={fitsGuests} className="mr-2 accent-navy-900" onChange={(event) => setFitsGuests(event.target.checked)} type="checkbox" />성인 {booking.guest_count}명 수용 가능</span><span>{rooms.filter((room) => room.maxGuests >= booking.guest_count).length}</span></label>
              <p className="mt-3 text-[9px] leading-4 text-ink-500">전망·비품 조건은 객실 상세에서 확인할 수 있습니다. 목록 검색 API가 연결되면 이곳에 추가됩니다.</p>
            </fieldset>
          </aside>

          <div>
            {loading && <SkeletonCards count={6} />}
            {!loading && error && <div className="border border-error-border bg-white px-6 py-16 text-center text-sm text-error" role="alert">{error}</div>}
            {!loading && !error && visibleRooms.length === 0 && <div className="border border-dashed border-gold-300 px-6 py-20 text-center text-sm text-muted">조건에 맞는 객실이 없습니다.{filtersActive && <button className="mt-4 block w-full text-xs text-gold-500 underline underline-offset-4" onClick={resetFilters} type="button">필터 초기화</button>}</div>}
            {!loading && !error && visibleRooms.length > 0 && <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">{visibleRooms.map((room, index) => <Link className="reveal group overflow-hidden rounded-lg border border-ivory-200 bg-white shadow-card transition duration-500 ease-calm hover:-translate-y-1" key={room.roomId} onClick={() => setBooking({ room_id: room.roomId })} style={{ '--reveal-delay': `${Math.min(index, 5) * 70}ms` } as React.CSSProperties} to={`/rooms/${room.roomId}`}><span className="block h-[170px] w-full overflow-hidden"><img alt={`${room.name} 객실`} className="h-full w-full object-cover transition duration-[1200ms] ease-calm group-hover:scale-[1.05]" loading="lazy" src={room.mainImageUrl || roomImages[index % roomImages.length]} /></span><div className="px-4 py-3"><h3 className="font-display text-xl font-semibold">{room.name}</h3><p className="mt-1 line-clamp-1 text-[10px] text-ink-700">{room.standardGuests} guests · 최대 {room.maxGuests}명 · {typeName[room.roomType]}</p><p className="mt-2 text-[10px] font-medium text-gold-500">{won.format(room.basePrice)} / night{nights > 0 && <span className="ml-2 text-ink-500">· {nights}박 {won.format(room.basePrice * nights)}</span>}</p></div></Link>)}</div>}
          </div>
        </div>
      </section>
    </main>
  )
}
