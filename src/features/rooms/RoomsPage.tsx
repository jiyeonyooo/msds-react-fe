import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import roomImage1 from '../../assets/rooms1.png'
import roomImage2 from '../../assets/rooms2.png'
import roomImage3 from '../../assets/rooms3.png'
import roomImage4 from '../../assets/rooms4.png'
import roomImage5 from '../../assets/rooms5.png'
import { roomsApi } from './api'
import type { RoomSummary, RoomType } from './types'

const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })
const roomImages = [roomImage1, roomImage2, roomImage3, roomImage4, roomImage5]
const typeName: Record<RoomType, string> = { STAY: '스테이', REST: '휴식', MEDITATE: '명상', RETREAT: '리트리트' }

function dateAfter(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date)
}

export function RoomsPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [types, setTypes] = useState<RoomType[]>([])
  const [sort, setSort] = useState('recommended')
  const [search, setSearch] = useState({ checkIn: dateAfter(10), checkOut: dateAfter(12), guests: 2 })

  useEffect(() => {
    let active = true
    roomsApi.list()
      .then((data) => active && setRooms(data))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : '객실 목록을 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const visibleRooms = useMemo(() => {
    const filtered = types.length ? rooms.filter((room) => types.includes(room.roomType)) : rooms
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.basePrice - b.basePrice)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.basePrice - a.basePrice)
    return filtered
  }, [rooms, sort, types])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams({ check_in_date: search.checkIn, check_out_date: search.checkOut, guest_count: String(search.guests) })
    navigate(`/reservations?${params}`)
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
            <label className="rounded-md border border-ivory-200 px-4 py-3 text-[9px] font-medium tracking-[0.12em] text-ink-500">CHECK-IN<input className="mt-2 block w-full border-0 bg-transparent text-xs tracking-normal text-navy-900 outline-none" min={dateAfter(0)} onChange={(event) => setSearch({ ...search, checkIn: event.target.value })} type="date" value={search.checkIn} /></label>
            <label className="rounded-md border border-ivory-200 px-4 py-3 text-[9px] font-medium tracking-[0.12em] text-ink-500">CHECK-OUT<input className="mt-2 block w-full border-0 bg-transparent text-xs tracking-normal text-navy-900 outline-none" min={search.checkIn} onChange={(event) => setSearch({ ...search, checkOut: event.target.value })} type="date" value={search.checkOut} /></label>
            <label className="rounded-md border border-ivory-200 px-4 py-3 text-[9px] font-medium tracking-[0.12em] text-ink-500">GUESTS<select className="mt-2 block w-full border-0 bg-transparent text-xs tracking-normal text-navy-900 outline-none" onChange={(event) => setSearch({ ...search, guests: Number(event.target.value) })} value={search.guests}>{[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count} Adults</option>)}</select></label>
            <button className="h-12 rounded-sm bg-navy-900 px-7 text-[11px] font-medium tracking-[0.08em] text-white hover:bg-navy-700" type="submit">SEARCH ROOMS</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-14 md:px-0 md:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="font-display text-[34px] font-medium">{visibleRooms.length} ROOMS · {search.checkIn.replaceAll('-', '.')}—{search.checkOut.replaceAll('-', '.')}</h2>
          <label className="flex items-center gap-3 rounded-sm border border-ivory-200 bg-white px-4 py-3 text-[9px] tracking-[0.12em] text-ink-500">SORT BY<select className="border-0 bg-transparent text-[10px] text-navy-900 outline-none" onChange={(event) => setSort(event.target.value)} value={sort}><option value="recommended">추천순</option><option value="price-asc">낮은 가격순</option><option value="price-desc">높은 가격순</option></select></label>
        </div>

        <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-lg border border-ivory-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-ivory-200 pb-5"><strong className="text-[11px] font-medium tracking-[0.14em]">FILTERS</strong><button className="text-[10px] text-gold-500" onClick={() => setTypes([])} type="button">초기화</button></div>
            <div className="border-b border-ivory-200 py-5"><p className="text-[10px] font-medium tracking-[0.1em]">PRICE / NIGHT</p><p className="mt-4 text-xs text-ink-700">₩90,000 — ₩220,000</p><div className="mt-4 h-1 rounded-full bg-ivory-200"><span className="block h-full w-3/4 rounded-full bg-gold-500" /></div></div>
            <fieldset className="border-b border-ivory-200 py-5"><legend className="mb-3 text-[10px] font-medium tracking-[0.1em]">ROOM TYPE</legend><label className="flex items-center justify-between py-1.5 text-xs"><span><input checked={types.length === 0} className="mr-2 accent-navy-900" onChange={() => setTypes([])} type="checkbox" />전체 객실</span><span>{rooms.length}</span></label>{(Object.entries(typeName) as [RoomType, string][]).map(([type, label]) => <label className="flex items-center justify-between py-1.5 text-xs" key={type}><span><input checked={types.includes(type)} className="mr-2 accent-navy-900" onChange={() => toggleType(type)} type="checkbox" />{label}</span><span>{rooms.filter((room) => room.roomType === type).length}</span></label>)}</fieldset>
            <fieldset className="border-b border-ivory-200 py-5 opacity-55"><legend className="mb-3 text-[10px] font-medium tracking-[0.1em]">VIEW</legend>{['오션뷰', '포레스트뷰', '가든뷰'].map((label) => <label className="block py-1.5 text-xs" key={label}><input className="mr-2" disabled type="checkbox" />{label}</label>)}</fieldset>
            <fieldset className="py-5 opacity-55"><legend className="mb-3 text-[10px] font-medium tracking-[0.1em]">AMENITIES</legend>{['전용 욕실', '테라스', '티 세트', '디지털 디톡스 키트'].map((label) => <label className="block py-1.5 text-xs" key={label}><input className="mr-2" disabled type="checkbox" />{label}</label>)}<p className="mt-3 text-[9px] leading-4 text-ink-500">객실별 검색 API가 연결되면 활성화됩니다.</p></fieldset>
          </aside>

          <div>
            {loading && <div className="py-24 text-center text-sm text-muted" role="status">객실을 불러오는 중입니다…</div>}
            {!loading && error && <div className="border border-error-border bg-white px-6 py-16 text-center text-sm text-error" role="alert">{error}</div>}
            {!loading && !error && visibleRooms.length === 0 && <div className="border border-dashed border-gold-300 px-6 py-20 text-center text-sm text-muted">조건에 맞는 객실이 없습니다.</div>}
            {!loading && !error && visibleRooms.length > 0 && <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">{visibleRooms.map((room, index) => <Link className="overflow-hidden rounded-lg border border-ivory-200 bg-white shadow-card transition hover:-translate-y-1" key={room.roomId} to={`/rooms/${room.roomId}`}><img alt={`${room.name} 객실`} className="h-[170px] w-full object-cover" src={room.mainImageUrl || roomImages[index % roomImages.length]} /><div className="px-4 py-3"><h3 className="font-display text-xl font-semibold">{room.name}</h3><p className="mt-1 line-clamp-1 text-[10px] text-ink-700">{room.standardGuests} guests · 최대 {room.maxGuests}명 · {typeName[room.roomType]}</p><p className="mt-2 text-[10px] font-medium text-gold-500">{won.format(room.basePrice)} / night</p></div></Link>)}</div>}
          </div>
        </div>
      </section>
    </main>
  )
}
