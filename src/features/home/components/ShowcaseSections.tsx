import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Facility } from '../../facility/types'
import type { RoomSummary } from '../../rooms/types'
import { homeMedia } from '../homeMedia'

type HomeContentStatus = 'loading' | 'ready' | 'error'

const showcaseDataClass =
  'my-4 grid max-h-none gap-[7px] pr-[5px] md:max-h-[280px] md:overflow-auto'
const stateClass = 'border-l-[3px] border-gold-500 bg-white p-5 leading-[1.7] text-ink-700'
const dataCardClass =
  'block border-l-2 border-gold-500 bg-white/70 px-[18px] py-4 transition-colors hover:bg-white'
const dataLabelClass = 'mb-1 block text-[0.62rem] font-medium tracking-[0.14em] text-gold-500'
const dataTitleClass = 'm-0 font-display text-[1.25rem] font-medium'
const moreLinkClass =
  'mt-2 inline-flex min-h-11 origin-left items-center py-3 text-xs font-medium tracking-[0.08em] text-gold-500 no-underline transition-[transform,color] duration-300 hover:scale-105 hover:text-navy-900 motion-reduce:transform-none motion-reduce:transition-none'

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
        {rooms.slice(0, 2).map((room) => (
          <Link className={dataCardClass} key={room.roomId} to={`/rooms/${room.roomId}`}>
            <small className={dataLabelClass}>{room.roomType}</small>
            <h3 className={dataTitleClass}>{room.name}</h3>
          </Link>
        ))}
      </div>
      <Link className={moreLinkClass} to="/rooms">객실 더보기&nbsp; →</Link>
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
            <small className={dataLabelClass}>{facility.category}</small>
            <h3 className={dataTitleClass}>{facility.name}</h3>
          </article>
        ))}
      </div>
      <Link
        className={moreLinkClass}
        to="/facility"
      >
        편의시설 더보기&nbsp; →
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
            className={`relative z-[3] order-1 max-h-none overflow-visible bg-ivory-100 p-0 md:order-0 md:self-center md:overflow-visible md:py-[38px] ${
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
