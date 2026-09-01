import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import roomImage1 from '../../assets/rooms1.png'
import roomImage2 from '../../assets/rooms2.png'
import roomImage3 from '../../assets/rooms3.png'
import roomImage4 from '../../assets/rooms4.png'
import { roomsApi } from './api'
import type { RoomSummary, RoomType } from './types'

const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })
const roomImages = [roomImage1, roomImage2, roomImage3, roomImage4]
const typeName: Record<RoomType, string> = { STAY: '스테이', REST: '휴식', MEDITATE: '명상', RETREAT: '리트리트' }

export function RoomsPage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    roomsApi
      .list()
      .then((data) => active && setRooms(data))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : '객실 목록을 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:px-12 md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">ROOMS &amp; SUITES</p>
      <div className="mt-2.5 flex flex-col justify-between gap-6 border-b border-gold-300 pb-9 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">고요에 머무는 방</h1>
          <p className="mt-4 text-sm leading-7 text-muted">각기 다른 쉼의 방식으로 준비한 MSDS의 객실을 만나보세요.</p>
        </div>
        <Link className="w-fit rounded-sm bg-navy-900 px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-navy-700" to="/reservations">날짜로 예약 가능 객실 찾기</Link>
      </div>

      {loading && <div className="py-24 text-center text-sm text-muted" role="status">객실을 불러오는 중입니다…</div>}
      {!loading && error && <div className="my-14 border border-error-border bg-white px-6 py-10 text-center text-sm text-error" role="alert"><p>{error}</p><button className="mt-5 border-b border-error" onClick={() => location.reload()}>다시 시도</button></div>}
      {!loading && !error && rooms.length === 0 && <div className="my-14 border border-dashed border-gold-300 px-6 py-20 text-center text-sm leading-7 text-muted">현재 안내할 수 있는 객실이 없습니다.<br />잠시 후 다시 확인해 주세요.</div>}

      <section className="mt-12 grid gap-6 md:grid-cols-2" aria-label="객실 목록">
        {rooms.map((room, index) => (
          <article className="overflow-hidden border border-border-subtle bg-white shadow-card" key={room.roomId}>
            <div className="relative h-[260px] bg-cover bg-center md:h-[330px]" style={{ backgroundImage: `url(${roomImages[index % roomImages.length]})` }}>
              <span className="absolute top-5 left-5 bg-navy-900/90 px-3 py-2 text-[10px] tracking-[0.14em] text-white">0{index + 1} · {typeName[room.roomType]}</span>
            </div>
            <div className="p-7 md:p-9">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-[34px] leading-none">{room.name}</h2><p className="mt-4 min-h-12 text-sm leading-6 text-muted">{room.description ?? '고요한 휴식을 위해 준비된 객실입니다.'}</p></div><strong className="whitespace-nowrap text-sm font-medium text-gold-500">{won.format(room.basePrice)}<small className="font-normal text-muted"> / 박</small></strong></div>
              <dl className="mt-6 grid grid-cols-3 border-y border-border-subtle py-4 text-center text-xs [&_dd]:mt-1.5 [&_dd]:text-navy-900 [&_dt]:text-[10px] [&_dt]:tracking-[0.1em] [&_dt]:text-muted"><div><dt>STANDARD</dt><dd>{room.standardGuests}명</dd></div><div className="border-x border-border-subtle"><dt>MAXIMUM</dt><dd>{room.maxGuests}명</dd></div><div><dt>AREA</dt><dd>{room.areaM2 == null ? '—' : `${room.areaM2}㎡`}</dd></div></dl>
              <Link className="mt-6 block w-full border border-navy-900 px-5 py-3 text-center text-xs tracking-[0.08em] transition hover:bg-navy-900 hover:text-white" to={`/rooms/${room.roomId}`}>객실 자세히 보기</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
