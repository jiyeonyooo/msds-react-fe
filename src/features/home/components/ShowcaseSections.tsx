import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Facility } from '../../facility/types'
import type { RoomSummary, RoomType } from '../../rooms/types'
import { homeMedia } from '../homeMedia'

type HomeContentStatus = 'loading' | 'ready' | 'error'

const roomTypeCopy: Record<RoomType, string> = {
  STAY: '균형 잡힌 기본 머무름',
  REST: '느슨하고 조용한 휴식',
  MEDITATE: '개인 명상과 집중',
  RETREAT: '회복에 몰입하는 쉼',
}

const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price)

const showcaseDataClass =
  'my-4 grid max-h-none gap-[7px] pr-[5px] md:max-h-[280px] md:overflow-auto'
const stateClass = 'border-l-[3px] border-gold-500 bg-white p-5 leading-[1.7] text-ink-700'
const dataCardClass =
  'block gap-3 border-l-2 border-gold-500 bg-white/70 px-[14px] py-3 md:flex md:justify-between'
const dataLabelClass = 'text-[0.64rem] tracking-[0.12em] text-gold-500'
const dataTitleClass = 'my-0.5 font-display text-[1.2rem] font-medium'
const dataCopyClass = 'm-0 text-xs leading-[1.45] text-ink-700'

export function RoomsShowcaseSection({
  rooms,
  status,
}: {
  rooms: RoomSummary[]
  status: HomeContentStatus
}) {
  return (
    <ShowcaseSection
      kind="rooms"
      images={homeMedia.rooms}
      eyebrow="01. FIND YOUR ROOM"
      title={
        <>
          A ROOM FOR THE
          <br />
          WAY YOU REST
        </>
      }
      description="방문 목적에 맞는 객실 유형을 발견하고, 예약 가능한 객실은 예약 검색에서 확인하세요."
    >
      <div className={showcaseDataClass} aria-live="polite">
        {status === 'loading' && <p className={stateClass}>객실 정보를 불러오는 중입니다.</p>}
        {status === 'error' && (
          <p className={stateClass}>
            객실 정보를 지금 불러올 수 없습니다. 객실 목록에서 다시 확인해 주세요.
          </p>
        )}
        {status === 'ready' && rooms.length === 0 && (
          <p className={stateClass}>현재 소개할 객실 유형이 없습니다.</p>
        )}
        {rooms.slice(0, 3).map((room) => (
          <article className={dataCardClass} key={room.roomId}>
            <div>
              <small className={dataLabelClass}>{room.roomType}</small>
              <h3 className={dataTitleClass}>{room.name}</h3>
              <p className={dataCopyClass}>{roomTypeCopy[room.roomType]}</p>
            </div>
            <dl className="mt-2 min-w-[140px] md:mt-0">
              <div className="flex justify-between gap-2 border-b border-ivory-200 text-[0.67rem]">
                <dt>기준 / 최대</dt>
                <dd className="m-0">
                  {room.standardGuests} / {room.maxGuests}명
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-ivory-200 text-[0.67rem]">
                <dt>1박 기본가</dt>
                <dd className="m-0">₩{formatPrice(room.basePrice)}~</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="inline-flex min-h-11 items-center justify-center border border-transparent bg-navy-900 px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-white no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          to="/rooms"
        >
          EXPLORE ROOMS
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center border border-navy-900 px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-navy-900 no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          to="/reservations"
        >
          CHECK AVAILABILITY
        </Link>
      </div>
    </ShowcaseSection>
  )
}

export function FacilityShowcaseSection({
  facilities,
  status,
}: {
  facilities: Facility[]
  status: HomeContentStatus
}) {
  return (
    <ShowcaseSection
      kind="facility"
      images={homeMedia.facilities}
      eyebrow="02. EXTEND YOUR STAY"
      title={
        <>
          STAY BEYOND
          <br />
          YOUR ROOM
        </>
      }
      description="객실 밖의 고요·회복·환대가 머무름을 완성합니다."
    >
      <div className={showcaseDataClass} aria-live="polite">
        {status !== 'ready' && (
          <p className={stateClass}>시설 정보는 전체 시설 페이지에서 확인할 수 있습니다.</p>
        )}
        {status === 'ready' && facilities.length === 0 && (
          <p className={stateClass}>현재 소개할 운영 시설이 없습니다.</p>
        )}
        {facilities.map((facility) => (
          <article className={dataCardClass} key={facility.facilityId}>
            <div>
              <small className={dataLabelClass}>{facility.category}</small>
              <h3 className={dataTitleClass}>{facility.name}</h3>
              <p className={dataCopyClass}>
                {facility.description || '시설 상세 페이지에서 이용 정보를 확인해 주세요.'}
              </p>
            </div>
          </article>
        ))}
      </div>
      <Link
        className="inline-flex min-h-11 items-center justify-center border border-navy-900 px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-navy-900 no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        to="/facility"
      >
        VIEW ALL FACILITIES
      </Link>
    </ShowcaseSection>
  )
}

function ShowcaseSection({
  children,
  description,
  eyebrow,
  images,
  kind,
  title,
}: {
  children: ReactNode
  description: string
  eyebrow: string
  images: readonly string[]
  kind: 'rooms' | 'facility'
  title: ReactNode
}) {
  const isFacility = kind === 'facility'

  return (
    <section
      data-section
      data-showcase
      className={`landing-showcase landing-showcase--${kind} h-auto min-h-0 bg-ivory-100 py-[74px] md:min-h-[720px] md:py-0`}
      aria-label={eyebrow}
    >
      <div data-showcase-pin className="h-auto md:h-svh md:min-h-[720px]">
        <div
          className={`mx-auto flex h-auto w-[min(1088px,calc(100%_-_48px))] flex-col md:grid md:h-full md:items-stretch ${
            isFacility
              ? 'md:grid-cols-[minmax(0,55%)_minmax(0,45%)]'
              : 'md:grid-cols-[minmax(0,45%)_minmax(0,55%)]'
          }`}
        >
          <div
            className={`relative z-[3] order-1 max-h-none overflow-visible bg-ivory-100 p-0 md:order-0 md:self-center md:max-h-[calc(100svh_-_64px)] md:overflow-hidden md:py-[38px] ${
              isFacility ? 'md:col-start-2 md:pl-[42px]' : 'md:pr-[42px]'
            }`}
            data-showcase-copy
          >
            <p className="text-[0.69rem] font-medium tracking-[0.17em] text-gold-500">{eyebrow}</p>
            <h2 className="my-[18px] font-display text-[clamp(2.7rem,5vw,4.4rem)] leading-none font-medium">
              {title}
            </h2>
            <p className="mb-5 leading-[1.9] text-ink-700">{description}</p>
            {children}
          </div>
          <div
            className={`relative order-2 mt-[30px] h-[430px] min-w-0 overflow-hidden bg-navy-900 md:order-0 md:mt-0 md:h-full ${
              isFacility ? 'md:col-start-1 md:row-start-1' : ''
            }`}
          >
            {images.map((image, index) => (
              <figure
                data-showcase-slide
                className="relative hidden h-full first:block md:absolute md:inset-0 md:m-0 md:block md:will-change-[transform,opacity]"
                key={image}
              >
                <img
                  className="h-full w-full object-cover"
                  src={image}
                  alt={`${kind === 'rooms' ? '객실' : '편의시설'} 예시 ${index + 1}`}
                />
                <figcaption
                  className={`absolute bottom-[18px] font-display text-[1.4rem] text-white ${isFacility ? 'left-[22px]' : 'right-[22px]'}`}
                >
                  0{index + 1}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
