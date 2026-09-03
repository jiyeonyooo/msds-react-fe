import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import roomImage1 from '../../assets/rooms1.png'
import roomImage2 from '../../assets/rooms2.png'
import roomImage3 from '../../assets/rooms3.png'
import roomImage4 from '../../assets/rooms4.png'
import roomImage5 from '../../assets/rooms5.png'
import {
  bookingToQuery,
  setBooking,
  useBooking,
  withFallbackCheckOut,
} from '../reservation/bookingStore'
import { RoomApiError, roomsApi } from './api'
import type { RoomDetail, RoomStatus, RoomSummary, RoomType } from './types'

const fallbackImages = [roomImage1, roomImage2, roomImage3, roomImage4, roomImage5]
const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })
const typeName: Record<RoomType, string> = { STAY: 'STAY', REST: 'REST', MEDITATE: 'MEDITATION', RETREAT: 'RETREAT' }
const statusName: Record<RoomStatus, string> = { AVAILABLE: '예약 가능', SOLDOUT: '예약 마감', INAVAILABLE: '판매 중지' }

export function RoomDetailPage() {
  const { roomId } = useParams()
  const id = Number(roomId)
  const invalidId = !Number.isInteger(id) || id < 1
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [related, setRelated] = useState<RoomSummary[]>([])
  const booking = useBooking()
  const [loading, setLoading] = useState(!invalidId)
  const [error, setError] = useState(invalidId ? '올바르지 않은 객실 번호입니다.' : '')

  useEffect(() => {
    let active = true
    if (invalidId) return () => { active = false }
    setBooking({ room_id: id })
    Promise.all([roomsApi.detail(id), roomsApi.list()])
      .then(([detail, list]) => {
        if (!active) return
        setRoom(detail)
        setRelated(list.filter((item) => item.roomId !== id).slice(0, 3))
      })
      .catch((err: unknown) => active && setError(err instanceof RoomApiError && err.status === 404 ? '해당 객실을 찾을 수 없습니다.' : err instanceof Error ? err.message : '객실 정보를 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, invalidId])

  if (loading) return <main className="mx-auto max-w-[1240px] px-6 py-24 text-center text-sm text-muted" role="status">객실 정보를 불러오는 중입니다…</main>
  if (error || !room) return <main className="mx-auto max-w-[1240px] px-6 py-24 text-center"><p className="text-sm text-error" role="alert">{error}</p><Link className="mt-7 inline-block border-b border-navy-900 pb-1 text-xs tracking-[0.08em]" to="/rooms">객실 목록으로 돌아가기</Link></main>

  const availabilityQuery = bookingToQuery(
    withFallbackCheckOut({ ...booking, room_id: room.roomId }),
    { search: '1' },
  )
  const apiImages = room.images.map((image) => image.imageUrl).filter(Boolean)
  const gallery = [...apiImages, ...fallbackImages.filter((image) => !apiImages.includes(image))].slice(0, 3)
  const specs = room.roomSpecs

  return (
    <main className="bg-canvas pb-0">
      <section className="mx-auto max-w-[1240px] px-6 pt-9 pb-16 md:px-0 md:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
          <header>
            <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">STAY / {specs.viewType && specs.viewType !== 'NONE' ? specs.viewType.replace('_', ' ') : typeName[room.roomType]} / {room.name.toUpperCase()}</p>
            <h1 className="mt-3 font-display text-[42px] leading-none font-medium md:text-[52px]">{room.name}</h1>
            <p className="mt-4 text-xs text-ink-700">{typeName[room.roomType]} · {room.capacity.standardGuests}인 · 최대 {room.capacity.maxGuests}인 · {room.status === 'AVAILABLE' ? '웰니스 스테이' : statusName[room.status]}</p>
            <p className="mt-3 text-[10px] text-ink-500">● 현재 조용함 정보와 객실별 제공 사항은 예약 가능 조회 시 최종 확인됩니다.</p>
          </header>
          <aside className="rounded-lg border border-ivory-200 bg-white p-5">
            <strong className="font-display text-[28px] font-medium">{won.format(room.basePrice)} <small className="font-sans text-[11px] font-normal text-ink-500">/ night</small></strong>
            <p className="mt-2 text-[10px] text-ink-500">세금 포함 · 무료 취소 정책 별도</p>
            <Link aria-disabled={room.status !== 'AVAILABLE'} className={`mt-4 block rounded-sm px-5 py-3 text-center text-[10px] font-medium tracking-[0.06em] text-white ${room.status === 'AVAILABLE' ? 'bg-navy-900 hover:bg-navy-700' : 'pointer-events-none bg-ink-500/45'}`} to={`/reservations?${availabilityQuery}`}>{room.status === 'AVAILABLE' ? 'CHECK AVAILABILITY' : statusName[room.status]}</Link>
          </aside>
        </div>

        <section className="mt-10 grid h-[460px] gap-5 overflow-hidden md:grid-cols-[1.9fr_1fr]" aria-label="객실 이미지">
          <img alt={`${room.name} 대표 이미지`} className="h-full w-full rounded-md object-cover" src={gallery[0]} />
          <div className="hidden grid-rows-2 gap-5 md:grid"><img alt="" className="h-full w-full rounded-md object-cover" src={gallery[1]} /><img alt="" className="h-full w-full rounded-md object-cover" src={gallery[2]} /></div>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">ABOUT THE ROOM</p>
            <h2 className="mt-4 font-display text-[34px] font-medium">A room made for still mornings.</h2>
            <p className="mt-5 max-w-[760px] text-sm leading-7 text-ink-700">{room.description ?? '조용한 아침과 느린 호흡을 위해 준비한 객실입니다. 자연과 가까운 공간에서 온전한 휴식을 경험하세요.'}</p>
            <div className="mt-7 border-t border-ivory-200 pt-6">
              <p className="text-[10px] font-medium tracking-[0.14em] text-gold-500">ROOM AMENITIES</p>
              {room.equipmentGroups.length === 0 ? <p className="mt-4 text-xs text-ink-500">등록된 객실 비품 정보가 없습니다.</p> : <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">{room.equipmentGroups.flatMap((group) => group.equipments).map((item) => <p className="text-xs text-ink-700" key={item.equipmentId}>✓ {item.name}{item.quantity != null ? ` · ${item.quantity}개` : ''}</p>)}</div>}
            </div>
            <div className="mt-8 grid gap-4 rounded-lg bg-[#f1eddd] p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-[9px] font-medium tracking-[0.15em] text-gold-500">INCLUDED WELLNESS PROGRAM</p><h3 className="mt-2 font-display text-xl font-semibold">예약 가능 조회 후 프로그램 확인</h3><p className="mt-1 text-[10px] text-ink-700">객실별 포함 프로그램은 선택한 숙박 일정에 따라 달라집니다.</p></div><span className="rounded-md bg-white px-5 py-3 text-center text-[9px] text-ink-500">NEXT SESSION<br /><strong className="mt-1 block text-navy-900">일정 선택 필요</strong></span></div>
          </div>

          <aside className="h-fit rounded-lg border border-ivory-200 bg-white p-6">
            <p className="text-[9px] font-medium tracking-[0.15em] text-gold-500">YOUR STAY</p>
            <strong className="mt-3 block font-display text-[30px] font-medium">{won.format(room.basePrice)}</strong>
            <p className="mt-1 text-[10px] text-ink-500">1박 기준 · 세금 포함</p>
            <dl className="mt-5 grid grid-cols-2 gap-y-4 border-y border-ivory-200 py-5 text-[10px]"><dt className="text-gold-500">CAPACITY</dt><dd className="text-right">최대 {room.capacity.maxGuests}인</dd><dt className="text-gold-500">BED</dt><dd className="text-right">{specs.bedType ? `${specs.bedType} ${specs.bedCount ?? ''}` : '정보 없음'}</dd><dt className="text-gold-500">ROOM SIZE</dt><dd className="text-right">{specs.areaM2 == null ? '—' : `${specs.areaM2}㎡`}</dd></dl>
            <p className="mt-5 text-[9px] leading-5 text-ink-500">체크인·체크아웃 시간과 취소 정책은 선택한 일정의 예약 단계에서 확인해 주세요.</p>
            <Link className="mt-5 block rounded-sm bg-navy-900 px-5 py-3 text-center text-[10px] font-medium text-white" to={`/reservations?${availabilityQuery}`}>CHECK AVAILABILITY</Link>
          </aside>
        </section>
      </section>

      {related.length > 0 && <section className="bg-subtle px-6 py-12 md:px-0"><div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[260px_1fr]"><div><p className="text-[9px] font-medium tracking-[0.15em] text-gold-500">EXPLORE MORE</p><h2 className="mt-3 font-display text-[30px] font-medium">Rooms for a quieter stay.</h2><Link className="mt-5 inline-block text-[10px] font-medium tracking-[0.08em]" to="/rooms">VIEW ALL ROOMS →</Link></div><div className="grid gap-5 sm:grid-cols-3">{related.map((item, index) => <Link className="overflow-hidden rounded-lg border border-ivory-200 bg-white" key={item.roomId} to={`/rooms/${item.roomId}`}><img alt="" className="h-[150px] w-full object-cover" src={item.mainImageUrl || fallbackImages[(index + 1) % fallbackImages.length]} /><div className="p-3"><h3 className="font-display text-lg font-semibold">{item.name}</h3><p className="mt-1 text-[9px] text-ink-500">{item.standardGuests} guests · 최대 {item.maxGuests}명</p><p className="mt-1 text-[9px] text-gold-500">{won.format(item.basePrice)} / night</p></div></Link>)}</div></div></section>}
    </main>
  )
}
