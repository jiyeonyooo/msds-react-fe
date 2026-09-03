import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRevealAll } from '../../components/motion/hooks'
import { resolveImageUrl } from '../../lib/imageUrl'
import { roomsApi } from './api'
import type { RoomSummary, RoomType } from './types'

const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })
const typeName: Record<RoomType, string> = { STAY: '스테이', REST: '휴식', MEDITATE: '명상', RETREAT: '리트리트' }
const roomTypeFilters: { value: 'ALL' | RoomType; label: string }[] = [
  { value: 'ALL', label: '전체' },
  ...(Object.entries(typeName).map(([value, label]) => ({
    value: value as RoomType,
    label,
  }))),
]

export function RoomsPage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<'ALL' | RoomType>('ALL')
  const [sort, setSort] = useState('recommended')

  useEffect(() => {
    let active = true
    roomsApi.list()
      .then((data) => active && setRooms(data))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : '객실 목록을 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const visibleRooms = useMemo(() => {
    const filtered =
      selectedType === 'ALL' ? rooms : rooms.filter((room) => room.roomType === selectedType)
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.basePrice - b.basePrice)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.basePrice - a.basePrice)
    return filtered
  }, [rooms, selectedType, sort])
  // 목록이 도착한 뒤에 그려지므로 길이를 키로 리빌 관찰을 다시 건다.
  useRevealAll(`rooms-${visibleRooms.length}`)

  return (
    <main className="min-h-screen bg-canvas">
      <section className="mx-auto max-w-[1240px] px-6 py-14 sm:px-8 md:px-12 md:py-16 lg:px-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium tracking-[0.18em] text-gold-500">ROOMS &amp; SUITES</p>
            <h1 className="mt-2 font-display text-[38px] font-medium">{visibleRooms.length} ROOMS</h1>
            <p className="mt-4 w-full text-sm leading-7 text-ink-700">
              자연의 결을 가까이 두고 온전한 쉼에 집중할 수 있도록, 전망과 공간의 쓰임을
              세심하게 설계한 MSDS의 객실을 만나보세요.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-sm border border-ivory-200 bg-white px-4 py-3 text-[9px] tracking-[0.12em] text-ink-500">SORT BY<select className="border-0 bg-transparent text-[10px] text-navy-900 outline-none" onChange={(event) => setSort(event.target.value)} value={sort}><option value="recommended">추천순</option><option value="price-asc">낮은 가격순</option><option value="price-desc">높은 가격순</option></select></label>
        </div>
        <div className="mb-8 flex flex-wrap gap-2" aria-label="객실 유형 필터">
          {roomTypeFilters.map((filter) => (
            <button
              className={`min-h-9 rounded-full border px-4 text-[10px] tracking-[0.08em] transition ${selectedType === filter.value ? 'border-navy-900 bg-navy-900 text-white' : 'border-ivory-200 bg-white text-ink-700 hover:border-gold-300'}`}
              key={filter.value}
              type="button"
              aria-pressed={selectedType === filter.value}
              onClick={() => setSelectedType(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

      {loading && <div className="py-24 text-center text-sm text-muted" role="status">객실을 불러오는 중입니다…</div>}
      {!loading && error && <div className="my-14 border border-error-border bg-white px-6 py-10 text-center text-sm text-error" role="alert"><p>{error}</p><button className="mt-5 border-b border-error" onClick={() => location.reload()}>다시 시도</button></div>}
      {!loading && !error && rooms.length === 0 && <div className="my-14 border border-dashed border-gold-300 px-6 py-20 text-center text-sm leading-7 text-muted">현재 안내할 수 있는 객실이 없습니다.<br />잠시 후 다시 확인해 주세요.</div>}

      <section className="mt-12 grid gap-6 md:grid-cols-2" aria-label="객실 목록">
        {visibleRooms.map((room, index) => (
          <Link
            className="group relative block h-full overflow-hidden border border-border-subtle bg-white shadow-card outline-none transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:scale-[1.015] hover:border-gold-300 hover:shadow-[0_24px_55px_rgba(16,35,55,0.18)] focus-visible:z-10 focus-visible:scale-[1.015] focus-visible:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
            key={room.roomId}
            to={`/rooms/${room.roomId}`}
            aria-label={`${room.name} 객실 자세히 보기`}
          >
            <article className="flex h-full flex-col">
              <div className="relative h-[260px] shrink-0 overflow-hidden bg-[linear-gradient(135deg,#f1ece3,#dde3d8)] md:h-[330px]">
                {room.mainImageUrl && <img className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none" src={resolveImageUrl(room.mainImageUrl)} alt={`${room.name} 객실`} onError={(event) => { event.currentTarget.style.display = 'none' }} />}
                <span className="absolute top-5 left-5 bg-navy-900/90 px-3 py-2 text-[10px] tracking-[0.14em] text-white">0{index + 1} · {typeName[room.roomType]}</span>
              </div>
              <div className="flex flex-1 flex-col p-7 md:p-9">
                <div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><h2 className="font-display text-[34px] leading-none">{room.name}</h2><p className="mt-4 line-clamp-3 h-[4.5rem] text-sm leading-6 text-muted">{room.description ?? '고요한 휴식을 위해 준비된 객실입니다.'}</p></div><strong className="whitespace-nowrap text-sm font-medium text-gold-500">{won.format(room.basePrice)}<small className="font-normal text-muted"> / 박</small></strong></div>
                <dl className="mt-6 grid grid-cols-3 border-y border-border-subtle py-4 text-center text-xs [&_dd]:mt-1.5 [&_dd]:text-navy-900 [&_dt]:text-[10px] [&_dt]:tracking-[0.1em] [&_dt]:text-muted"><div><dt>STANDARD</dt><dd>{room.standardGuests}명</dd></div><div className="border-x border-border-subtle"><dt>MAXIMUM</dt><dd>{room.maxGuests}명</dd></div><div><dt>AREA</dt><dd>{room.areaM2 == null ? '—' : `${room.areaM2}㎡`}</dd></div></dl>
              </div>
            </article>
            <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[linear-gradient(145deg,rgba(16,35,55,0.68),rgba(16,35,55,0.88))] px-8 text-center text-white opacity-0 backdrop-blur-[1px] transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="translate-y-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none">
                <span className="mb-5 block text-[10px] font-medium tracking-[0.24em] text-gold-300">DISCOVER YOUR STAY</span>
                <span className="block font-display text-[32px] leading-none tracking-[-0.02em]">{room.name}</span>
                <span className="mx-auto mt-6 block h-px w-10 bg-gold-300 transition-[width] duration-500 group-hover:w-16 group-focus-visible:w-16" />
                <span className="mt-5 block text-xs font-medium tracking-[0.16em]">객실 자세히 보기&nbsp; →</span>
              </span>
            </span>
          </Link>
        ))}
      </section>
      </section>
    </main>
  )
}
