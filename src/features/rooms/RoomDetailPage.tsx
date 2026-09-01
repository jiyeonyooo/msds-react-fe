import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import roomImage1 from '../../assets/rooms1.png'
import roomImage2 from '../../assets/rooms2.png'
import roomImage3 from '../../assets/rooms3.png'
import roomImage4 from '../../assets/rooms4.png'
import roomImage5 from '../../assets/rooms5.png'
import { RoomApiError, roomsApi } from './api'
import type { RoomDetail, RoomStatus, RoomType } from './types'

const images = [roomImage1, roomImage2, roomImage3, roomImage4, roomImage5]
const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })
const typeName: Record<RoomType, string> = { STAY: '스테이', REST: '휴식', MEDITATE: '명상', RETREAT: '리트리트' }
const statusName: Record<RoomStatus, string> = { AVAILABLE: '예약 가능', SOLDOUT: '예약 마감', INAVAILABLE: '판매 중지' }

export function RoomDetailPage() {
  const { roomId } = useParams()
  const id = Number(roomId)
  const invalidId = !Number.isInteger(id) || id < 1
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(!invalidId)
  const [error, setError] = useState(invalidId ? '올바르지 않은 객실 번호입니다.' : '')

  useEffect(() => {
    let active = true
    if (invalidId) return () => { active = false }
    roomsApi.detail(id)
      .then((data) => active && setRoom(data))
      .catch((err: unknown) => active && setError(err instanceof RoomApiError && err.status === 404 ? '해당 객실을 찾을 수 없습니다.' : err instanceof Error ? err.message : '객실 정보를 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, invalidId])

  if (loading) return <main className="mx-auto max-w-7xl px-6 py-24 text-center text-sm text-muted" role="status">객실 정보를 불러오는 중입니다…</main>
  if (error || !room) return <main className="mx-auto max-w-7xl px-6 py-24 text-center"><p className="text-sm text-error" role="alert">{error}</p><Link className="mt-7 inline-block border-b border-navy-900 pb-1 text-xs tracking-[0.08em]" to="/rooms">객실 목록으로 돌아가기</Link></main>

  const previous = () => setSlide((slide - 1 + images.length) % images.length)
  const next = () => setSlide((slide + 1) % images.length)
  const specs = room.roomSpecs

  return <main className="mx-auto max-w-7xl px-6 pt-8 pb-[110px] md:px-12 md:pt-14">
    <Link className="inline-block border-b border-border-subtle pb-1 text-[11px] tracking-[0.12em] text-muted hover:border-gold-500 hover:text-navy-900" to="/rooms">← ALL ROOMS</Link>
    <section className="mt-7">
      <div className="relative overflow-hidden bg-subtle">
        <div
          className="flex h-[360px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:h-[620px]"
          style={{ transform: `translate3d(-${slide * 100}%, 0, 0)` }}
        >
          {images.map((image, index) => (
            <img
              className="h-full w-full min-w-full shrink-0 object-cover"
              src={image}
              alt={`${room.name} 객실 이미지 ${index + 1}`}
              aria-hidden={slide !== index}
              key={image}
            />
          ))}
        </div>
        <button className="absolute top-1/2 left-4 grid size-12 -translate-y-1/2 place-items-center bg-white/90 text-xl text-navy-900 shadow-card transition hover:bg-white md:left-7" onClick={previous} aria-label="이전 이미지">←</button>
        <button className="absolute top-1/2 right-4 grid size-12 -translate-y-1/2 place-items-center bg-white/90 text-xl text-navy-900 shadow-card transition hover:bg-white md:right-7" onClick={next} aria-label="다음 이미지">→</button>
        <span className="absolute right-5 bottom-5 bg-navy-900/90 px-4 py-2 text-[11px] tracking-[0.12em] text-white" aria-live="polite">{String(slide + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2" aria-label="객실 이미지 선택">{images.map((image, index) => <button className={`overflow-hidden border-2 ${slide === index ? 'border-gold-500' : 'border-transparent opacity-60 hover:opacity-100'}`} key={image} onClick={() => setSlide(index)} aria-label={`${index + 1}번 이미지 보기`} aria-current={slide === index}><img className="h-16 w-full object-cover md:h-24" src={image} alt="" /></button>)}</div>
    </section>

    <section className="mt-14 grid w-full gap-x-12 gap-y-12 md:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:gap-x-20">
      <div className="w-full min-w-0 md:col-span-2">
        <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">{typeName[room.roomType]} · ROOM {String(room.roomId).padStart(2, '0')}</p>
        <h1 className="mt-3 font-display text-[52px] leading-none tracking-[-0.08rem] md:text-[68px]">{room.name}</h1>
        <p className="mt-7 w-full text-sm leading-7 break-keep whitespace-normal text-muted">{room.description ?? '고요한 휴식을 위해 준비된 객실입니다.'}</p>
      </div>
      <div className="w-full min-w-0">
        <h2 className="mt-12 border-b border-gold-300 pb-4 text-xs tracking-[0.14em] text-gold-500">ROOM AMENITIES</h2>
        {room.equipmentGroups.length === 0 ? <p className="mt-5 text-sm text-muted">등록된 객실 비품 정보가 없습니다.</p> : <div className="mt-6 grid gap-8 sm:grid-cols-2">{room.equipmentGroups.map((group) => <div key={group.category}><strong className="text-sm">{group.categoryName}</strong><ul className="mt-3 space-y-2 text-xs leading-5 text-muted">{group.equipments.map((item) => <li key={item.equipmentId}>— {item.name}{item.quantity != null ? ` ${item.quantity}개` : ''}{item.note ? ` · ${item.note}` : ''}</li>)}</ul></div>)}</div>}
      </div>
      <aside className="h-fit border border-border-subtle bg-white p-7 shadow-card md:p-9">
        <div className="flex items-center justify-between"><span className={`border px-2.5 py-1 text-[11px] ${room.status === 'AVAILABLE' ? 'border-gold-300 text-gold-500' : 'border-border-subtle text-muted'}`}>{statusName[room.status]}</span><strong className="text-lg text-gold-500">{won.format(room.basePrice)}<small className="font-normal text-muted"> / 박</small></strong></div>
        <dl className="mt-8 grid grid-cols-2 gap-y-4 border-y border-border-subtle py-6 text-xs [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-muted"><dt>기준 인원</dt><dd>{room.capacity.standardGuests}명</dd><dt>최대 인원</dt><dd>{room.capacity.maxGuests}명</dd><dt>객실 면적</dt><dd>{specs.areaM2 == null ? '—' : `${specs.areaM2}㎡`}</dd><dt>침대</dt><dd>{specs.bedType ? `${specs.bedType}${specs.bedCount ? ` × ${specs.bedCount}` : ''}` : '—'}</dd><dt>전망</dt><dd>{specs.viewType && specs.viewType !== 'NONE' ? specs.viewType : '—'}</dd></dl>
        <Link className={`mt-7 block rounded-sm px-6 py-4 text-center text-xs tracking-[0.08em] text-white ${room.status === 'AVAILABLE' ? 'bg-navy-900 hover:bg-navy-700' : 'pointer-events-none bg-[#bdbbb6]'}`} aria-disabled={room.status !== 'AVAILABLE'} to="/reservations">{room.status === 'AVAILABLE' ? '예약 가능 여부 확인' : statusName[room.status]}</Link>
      </aside>
    </section>
  </main>
}
