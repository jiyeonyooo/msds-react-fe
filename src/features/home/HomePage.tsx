import { useEffect, useState, type FormEvent } from 'react'
import calendarIcon from '../../assets/home/calendar.svg'
import chevronDownIcon from '../../assets/home/chevron-down.svg'
import courtyardImage from '../../assets/home/meditation-courtyard.png'
import oceanSuiteImage from '../../assets/home/ocean-suite.png'
import symbolLeaf from '../../assets/home/symbol-leaf.svg'
import symbolMoon from '../../assets/home/symbol-moon.svg'
import symbolSun from '../../assets/home/symbol-sun.svg'
import coastImage from '../../assets/msds-coast.png'
import heroImage from '../../assets/msds-hero.png'
import heroLogo from '../../assets/ui/primary-logo-light.svg'
import { BookingField, Button } from '../../components/ui'
import { navigate } from '../../lib/navigation'
import { roomsApi } from '../rooms/api'
import type { RoomSummary } from '../rooms/types'
import { quietnessApi } from '../wellness/api'
import type { QuietnessLevel } from '../wellness/types'

const features = [
  {
    symbol: symbolMoon,
    title: 'DEEP SILENCE',
    description: '자연 속의 깊은 침묵을 경험하며\n복잡한 마음을 비웁니다.',
    path: '/wellness',
  },
  {
    symbol: symbolLeaf,
    title: 'MINDFUL STAY',
    description: '정갈한 공간과 세심한 배려로\n편안한 머무름을 제공합니다.',
    path: '/rooms',
  },
  {
    symbol: symbolSun,
    title: 'INNER PEACE',
    description: '명상과 마음 기록을 통해\n내면의 평온과 균형을 찾습니다.',
    path: '/programs',
  },
] as const

const fallbackRooms = [
  {
    name: 'Ocean Silence Suite',
    details: '2 guests · Double bed · Ocean view',
    price: '₩180,000 / night',
    image: oceanSuiteImage,
  },
  {
    name: 'Forest Twin',
    details: '2 guests · Twin beds · Pine view',
    price: '₩140,000 / night',
    image: oceanSuiteImage,
  },
  {
    name: 'Still Room',
    details: '1 guest · Single bed · Garden view',
    price: '₩110,000 / night',
    image: courtyardImage,
  },
] as const

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

function dateAfter(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date)
}

type LiveQuietness = {
  score: number | null
  level: QuietnessLevel | null
  quietestSpace: string
  averageDecibel: number | null
}

const initialQuietness: LiveQuietness = {
  score: null,
  level: null,
  quietestSpace: '측정 중',
  averageDecibel: null,
}

function quietnessScore(decibel: number) {
  return Math.round(Math.max(0, Math.min(100, 110 - decibel)))
}

function quietnessLevelLabel(level: QuietnessLevel | null) {
  return level ? level.replaceAll('_', ' ') : 'MEASURING'
}

export function HomePage() {
  const [quietness, setQuietness] = useState(initialQuietness)
  const [roomData, setRoomData] = useState<RoomSummary[]>([])
  const [availability, setAvailability] = useState({
    checkIn: dateAfter(10),
    checkOut: dateAfter(12),
    guests: 2,
  })
  const [roomPage, setRoomPage] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([quietnessApi.summary(), quietnessApi.spaces()])
      .then(([summary, spaces]) => {
        if (!active) return
        const quietest = [...spaces].sort((a, b) => a.decibel - b.decibel)[0]
        setQuietness({
          score: quietnessScore(summary.averageDecibel),
          level: summary.level,
          quietestSpace: quietest?.spaceName ?? '측정 공간 없음',
          averageDecibel: summary.averageDecibel,
        })
      })
      .catch(() => undefined)
    roomsApi
      .list()
      .then((data) => {
        if (active) setRoomData(data)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const roomImages = [oceanSuiteImage, oceanSuiteImage, courtyardImage]
  const availableRooms = roomData.length
    ? roomData.map((room, index) => ({
        roomId: room.roomId,
        name: room.name,
        details: room.description ?? `${room.standardGuests} guests · 최대 ${room.maxGuests}명`,
        price: `${won.format(room.basePrice)} / night`,
        image: room.mainImageUrl || roomImages[index % roomImages.length],
      }))
    : fallbackRooms
  const displayedRooms = Array.from({ length: Math.min(3, availableRooms.length) }, (_, index) =>
    availableRooms[(roomPage + index) % availableRooms.length],
  )
  const roomPageCount = Math.max(availableRooms.length, 1)

  const searchAvailability = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = new URLSearchParams({
      check_in_date: availability.checkIn,
      check_out_date: availability.checkOut,
      guest_count: String(availability.guests),
    })
    navigate(`/reservations?${query.toString()}`)
  }

  return (
    <main>
      <section
        className="relative min-h-[760px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="mx-auto max-w-[1120px] px-6 pt-20 md:pt-[105px]">
          <img
            alt="MSDS Mindful Stay, Deep Silence"
            className="w-[310px] max-w-[76vw]"
            src={heroLogo}
          />
          <p className="mt-7 text-xs font-medium tracking-[0.13em] text-ink-700">
            MEDITATION GUESTHOUSE
          </p>
          <p className="mt-4 text-base leading-[27px] tracking-[-0.2px] text-ink-700">
            마음챙김과 깊은 고요 속에서
            <br />
            온전히 나에게 돌아오는 웰니스 스테이
          </p>
          <Button className="mt-6" onClick={() => navigate('/reservations')}>
            BOOK YOUR STAY&nbsp; →
          </Button>
        </div>
        <form
          aria-label="예약 바로가기"
          className="mx-5 mt-12 grid gap-3 rounded-xl bg-white p-5 shadow-floating md:absolute md:bottom-5 md:left-1/2 md:mt-0 md:h-[132px] md:w-[calc(100%-80px)] md:max-w-[1120px] md:-translate-x-1/2 md:grid-cols-[1fr_1px_1fr_1px_1fr_auto] md:items-center md:gap-[18px] md:px-[30px] md:py-6"
          onSubmit={searchAvailability}
        >
          <BookingField as="div" className="rounded-lg" label="CHECK-IN">
            <span className="flex items-center justify-between gap-2">
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm font-normal tracking-normal text-navy-900 outline-none"
                min={dateAfter(0)}
                onChange={(event) =>
                  setAvailability((current) => ({ ...current, checkIn: event.target.value }))
                }
                required
                type="date"
                value={availability.checkIn}
              />
              <img alt="" className="size-4" src={calendarIcon} />
            </span>
          </BookingField>
          <span className="hidden h-[60px] w-px bg-ivory-200 md:block" />
          <BookingField as="div" className="rounded-lg" label="CHECK-OUT">
            <span className="flex items-center justify-between gap-2">
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm font-normal tracking-normal text-navy-900 outline-none"
                min={availability.checkIn}
                onChange={(event) =>
                  setAvailability((current) => ({ ...current, checkOut: event.target.value }))
                }
                required
                type="date"
                value={availability.checkOut}
              />
              <img alt="" className="size-4" src={calendarIcon} />
            </span>
          </BookingField>
          <span className="hidden h-[60px] w-px bg-ivory-200 md:block" />
          <BookingField as="div" className="rounded-lg" label="GUESTS">
            <span className="flex items-center justify-between gap-2">
              <select
                className="min-w-0 flex-1 appearance-none border-0 bg-transparent text-sm font-normal tracking-normal text-navy-900 outline-none"
                onChange={(event) =>
                  setAvailability((current) => ({
                    ...current,
                    guests: Number(event.target.value),
                  }))
                }
                value={availability.guests}
              >
                {[1, 2, 3, 4].map((count) => (
                  <option key={count} value={count}>
                    성인 {count}명
                  </option>
                ))}
              </select>
              <img alt="" className="size-4" src={chevronDownIcon} />
            </span>
          </BookingField>
          <Button className="h-[52px] md:h-[56px]" type="submit">
            CHECK AVAILABILITY
          </Button>
        </form>
      </section>

      <section className="bg-canvas py-20 md:h-[520px] md:py-[40px]">
        <div className="mx-auto grid max-w-[1088px] items-center gap-14 px-6 md:grid-cols-[470px_500px] md:justify-between md:px-0">
          <div>
            <span className="block h-0.5 w-[54px] bg-gold-500" />
            <h2 className="mt-[22px] font-display text-[44px] font-medium leading-[52px]">
              A PLACE TO RETURN
              <br />
              TO YOURSELF
            </h2>
            <p className="mt-[22px] text-base leading-[27px] tracking-[-0.2px] text-ink-700">
              MSDS는 바쁜 일상에서 벗어나 깊은 침묵과 마음챙김으로
              <br className="hidden md:block" /> 온전히 나에게 돌아가는 명상 게스트하우스입니다.
              <br className="hidden md:block" /> 숙박·명상·마음 기록이 하나의 회복 여정으로
              이어집니다.
            </p>
            <Button className="mt-[22px]" onClick={() => navigate('/facility')} variant="text">
              ABOUT MSDS&nbsp; →
            </Button>
          </div>
          <img
            alt="고요한 해 질 녘 바다"
            className="h-[420px] w-full rounded-t-[250px] object-cover md:h-[440px]"
            src={coastImage}
          />
        </div>
      </section>

      <section className="bg-white py-8 md:h-[300px] md:py-[15px]">
        <div className="mx-auto grid max-w-[1220px] md:grid-cols-[1fr_1px_1fr_1px_1fr] md:items-center">
          {features.map((feature, index) => (
            <div className="contents" key={feature.title}>
              <article className="flex h-[270px] flex-col items-center justify-center gap-4 px-6 text-center">
                <img alt="" className="size-16" src={feature.symbol} />
                <h3 className="font-display text-2xl font-semibold tracking-[1.2px]">
                  {feature.title}
                </h3>
                <p className="whitespace-pre-line text-sm leading-[23px] text-ink-700">
                  {feature.description}
                </p>
                <button
                  className="text-[11px] font-medium tracking-[1px] text-navy-900"
                  onClick={() => navigate(feature.path)}
                  type="button"
                >
                  LEARN MORE <span className="ml-2 text-gold-500">→</span>
                </button>
              </article>
              {index < features.length - 1 && (
                <span className="mx-auto block h-px w-[170px] bg-ivory-200 md:h-[170px] md:w-px" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="relative bg-canvas py-20 md:h-[600px] md:py-[85px]">
        <div className="mx-auto grid max-w-[1240px] gap-14 px-6 md:grid-cols-[520px_640px] md:items-center md:justify-between md:px-0">
          <RoomCard
            className="h-[430px]"
            details={displayedRooms[0].details}
            image={displayedRooms[0].image}
            imageClassName="h-[310px]"
            name={displayedRooms[0].name}
            price={displayedRooms[0].price}
            roomId={'roomId' in displayedRooms[0] ? displayedRooms[0].roomId : undefined}
          />
          <div>
            <div className="mb-3 flex items-center justify-end gap-3" aria-label="홈 객실 페이지">
              <button className="grid size-[34px] place-items-center rounded-full border border-[#dcd2c4] font-display text-xl" onClick={() => setRoomPage((roomPage - 1 + roomPageCount) % roomPageCount)} type="button" aria-label="이전 객실">‹</button>
              <span className="text-[11px] font-medium tracking-[0.1em]">{String(roomPage + 1).padStart(2, '0')} / {String(roomPageCount).padStart(2, '0')}</span>
              <button className="grid size-[34px] place-items-center rounded-full border border-[#dcd2c4] font-display text-xl" onClick={() => setRoomPage((roomPage + 1) % roomPageCount)} type="button" aria-label="다음 객실">›</button>
            </div>
            <span className="block h-0.5 w-[54px] bg-gold-500" />
            <h2 className="mt-[18px] font-display text-[44px] font-medium leading-[52px]">
              OUR ROOMS
            </h2>
            <p className="mt-[18px] text-base leading-[27px] tracking-[-0.2px] text-ink-700">
              자연과 조화를 이룬 정갈한 객실에서
              <br />
              깊은 휴식과 명상의 시간을 경험하세요.
            </p>
            <Button className="mt-[18px]" onClick={() => navigate('/rooms')} variant="text">
              VIEW ROOMS&nbsp; →
            </Button>
            <div className="mt-[18px] grid gap-5 sm:grid-cols-2">
              {displayedRooms.slice(1).map((room) => (
                <RoomCard
                  compact
                  key={room.name}
                  {...room}
                  roomId={'roomId' in room ? room.roomId : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-subtle py-20 md:h-[540px] md:py-[50px]">
        <div className="mx-auto grid max-w-[1240px] gap-14 px-6 md:grid-cols-[620px_550px] md:items-center md:justify-between md:px-0">
          <img
            alt="햇살이 드는 명상 정원"
            className="h-[420px] w-full rounded-sm object-cover md:h-[440px]"
            src={courtyardImage}
          />
          <div>
            <p className="text-xs font-medium tracking-[2px] text-gold-500">YOUR INNER WEATHER</p>
            <h2 className="mt-[18px] font-display text-[44px] font-medium leading-[52px]">
              A QUIETER STAY,
              <br />A CLEARER MIND
            </h2>
            <p className="mt-[18px] text-base leading-[27px] tracking-[-0.2px] text-ink-700">
              오늘의 마음을 가볍게 기록하고, 숙소의 조용함을 확인하세요.
              <br className="hidden md:block" /> 체류 전·중·후의 변화를 한눈에 보며 나만의 회복
              리듬을 찾습니다.
            </p>
            <div className="mt-[18px] flex min-h-[132px] items-center justify-between gap-6 rounded-xl border border-ivory-200 bg-white px-6 py-5">
              <div className="min-w-[92px] text-center">
                <p className="font-display text-[52px] font-medium leading-[60px]">
                  {quietness.score ?? '—'}
                </p>
                <p className="text-xs font-medium tracking-[1.4px] text-gold-500">
                  {quietnessLevelLabel(quietness.level)}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-[2px]">STAY QUIETNESS · LIVE</p>
                <p className="mt-2 text-sm leading-[22px] text-ink-700">
                  가장 조용한 공간&nbsp; · &nbsp;{quietness.quietestSpace}
                  <br />
                  평균 소음&nbsp; · &nbsp;
                  {quietness.averageDecibel === null
                    ? '측정 중'
                    : `${quietness.averageDecibel.toFixed(1)} dB`}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle">
                  <span
                    className="block h-full rounded-full bg-gold-500 transition-[width]"
                    style={{ width: `${quietness.score ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
            <Button className="mt-[18px]" onClick={() => navigate('/wellness')}>
              CHECK MY MIND&nbsp; →
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function RoomCard({
  name,
  details,
  price,
  image,
  compact = false,
  className = '',
  imageClassName = '',
  roomId,
}: {
  name: string
  details: string
  price: string
  image: string
  compact?: boolean
  className?: string
  imageClassName?: string
  roomId?: number
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-ivory-200 bg-white shadow-card ${compact ? 'h-[238px]' : ''} ${roomId ? 'cursor-pointer transition hover:-translate-y-1' : ''} ${className}`}
      onClick={roomId ? () => navigate(`/rooms/${roomId}`) : undefined}
    >
      <img
        alt={name}
        className={`w-full object-cover ${compact ? 'h-[160px]' : imageClassName}`}
        src={image}
      />
      <div className={compact ? 'px-4 py-2' : 'px-6 py-4'}>
        <h3 className={`font-display font-semibold ${compact ? 'text-lg' : 'text-[26px]'}`}>
          {name}
        </h3>
        <p className={`text-ink-700 ${compact ? 'text-[10px]' : 'mt-1 text-[13px]'}`}>{details}</p>
        <p className={`font-medium text-gold-500 ${compact ? 'mt-1 text-[10px]' : 'mt-2 text-xs'}`}>
          {price}
        </p>
      </div>
    </article>
  )
}
