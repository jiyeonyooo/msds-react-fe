import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { resolveImageUrl } from '../../lib/imageUrl'
import { RoomApiError, roomsApi } from './api'
import type { RoomDetail, RoomSummary } from './types'

const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })

export function RoomDetailPage() {
  const { roomId } = useParams()
  const id = Number(roomId)
  const invalidId = !Number.isInteger(id) || id < 1
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [related, setRelated] = useState<RoomSummary[]>([])
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(!invalidId)
  const [error, setError] = useState(invalidId ? '올바르지 않은 객실 번호입니다.' : '')

  useEffect(() => {
    let active = true
    if (invalidId) return () => { active = false }
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

  const images = [...room.images].sort((a, b) => a.sortOrder - b.sortOrder)
  const previous = () => setSlide((slide - 1 + images.length) % images.length)
  const next = () => setSlide((slide + 1) % images.length)
  const specs = room.roomSpecs

  return (
    <main className="mx-auto max-w-7xl px-6 pt-8 pb-[110px] md:px-12 md:pt-14">
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
              src={resolveImageUrl(image.imageUrl)}
              alt={`${room.name} 객실 이미지 ${index + 1}`}
              aria-hidden={slide !== index}
              key={image.imageId}
            />
          ))}
          {images.length === 0 && <div className="grid h-full min-w-full place-items-center text-sm text-muted">등록된 객실 이미지가 없습니다.</div>}
        </div>
        {images.length > 1 && <><button className="absolute top-1/2 left-4 grid size-12 -translate-y-1/2 place-items-center bg-white/90 text-xl text-navy-900 shadow-card transition hover:bg-white md:left-7" onClick={previous} aria-label="이전 이미지">←</button><button className="absolute top-1/2 right-4 grid size-12 -translate-y-1/2 place-items-center bg-white/90 text-xl text-navy-900 shadow-card transition hover:bg-white md:right-7" onClick={next} aria-label="다음 이미지">→</button></>}
        {images.length > 0 && <span className="absolute right-5 bottom-5 bg-navy-900/90 px-4 py-2 text-[11px] tracking-[0.12em] text-white" aria-live="polite">{String(slide + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>}
      </div>
      {images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2" aria-label="객실 이미지 선택">{images.map((image, index) => <button className={`overflow-hidden border-2 ${slide === index ? 'border-gold-500' : 'border-transparent opacity-60 hover:opacity-100'}`} key={image.imageId} onClick={() => setSlide(index)} aria-label={`${index + 1}번 이미지 보기`} aria-current={slide === index}><img className="h-16 w-full object-cover md:h-24" src={resolveImageUrl(image.imageUrl)} alt="" /></button>)}</div>}
    </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">ABOUT THE ROOM</p>
            <h2 className="mt-4 font-display text-[34px] font-medium">{room.name}</h2>
            <p className="mt-5 max-w-[760px] text-sm leading-7 text-ink-700">{room.description ?? '조용한 아침과 느린 호흡을 위해 준비한 객실입니다. 자연과 가까운 공간에서 온전한 휴식을 경험하세요.'}</p>
            <div className="mt-7 border-t border-ivory-200 pt-6">
              <p className="text-[10px] font-medium tracking-[0.14em] text-gold-500">ROOM AMENITIES</p>
              {room.equipmentGroups.length === 0 ? <p className="mt-4 text-xs text-ink-500">등록된 객실 비품 정보가 없습니다.</p> : <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">{room.equipmentGroups.flatMap((group) => group.equipments).map((item) => <p className="text-xs text-ink-700" key={item.equipmentId}>✓ {item.name}{item.quantity != null ? ` · ${item.quantity}개` : ''}</p>)}</div>}
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-ivory-200 bg-white p-6">
            <p className="text-[9px] font-medium tracking-[0.15em] text-gold-500">YOUR STAY</p>
            <strong className="mt-3 block font-display text-[30px] font-medium">{won.format(room.basePrice)}</strong>
            <p className="mt-1 text-[10px] text-ink-500">1박 기준 · 세금 포함</p>
            <dl className="mt-5 grid grid-cols-2 gap-y-4 border-y border-ivory-200 py-5 text-[10px]"><dt className="text-gold-500">CAPACITY</dt><dd className="text-right">최대 {room.capacity.maxGuests}인</dd><dt className="text-gold-500">BED</dt><dd className="text-right">{specs.bedType ? `${specs.bedType} ${specs.bedCount ?? ''}` : '정보 없음'}</dd><dt className="text-gold-500">ROOM SIZE</dt><dd className="text-right">{specs.areaM2 == null ? '—' : `${specs.areaM2}㎡`}</dd></dl>
            <p className="mt-5 text-[9px] leading-5 text-ink-500">체크인·체크아웃 시간과 취소 정책은 선택한 일정의 예약 단계에서 확인해 주세요.</p>
            <Link className="mt-5 block rounded-sm bg-navy-900 px-5 py-3 text-center text-[10px] font-medium text-white" to={`/reservations?room_id=${room.roomId}`}>CHECK AVAILABILITY</Link>
          </aside>
        </section>

      {related.length > 0 && <section className="bg-transparent px-6 py-12 md:px-0"><div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[260px_1fr]"><div><p className="text-[9px] font-medium tracking-[0.15em] text-gold-500">EXPLORE MORE</p><h2 className="mt-3 font-display text-[30px] font-medium">또 다른 고요에<br />머물러보세요.</h2><Link className="mt-5 inline-block text-[10px] font-medium tracking-[0.08em]" to="/rooms">VIEW ALL ROOMS →</Link></div><div className="grid gap-5 sm:grid-cols-3">{related.map((item) => <Link className="overflow-hidden rounded-lg border border-ivory-200 bg-white" key={item.roomId} to={`/rooms/${item.roomId}`}>{item.mainImageUrl ? <img alt="" className="h-[150px] w-full object-cover" src={resolveImageUrl(item.mainImageUrl)} /> : <div className="grid h-[150px] place-items-center text-xs text-muted">NO IMAGE</div>}<div className="p-3"><h3 className="font-display text-lg font-semibold">{item.name}</h3><p className="mt-1 text-[9px] text-ink-500">{item.standardGuests} guests · 최대 {item.maxGuests}명</p><p className="mt-1 text-[9px] text-gold-500">{won.format(item.basePrice)} / night</p></div></Link>)}</div></div></section>}
    </main>
  )
}
