import { Link } from 'react-router-dom'
import { ReservationSearchBar } from '../../reservation/ReservationSearchBar'
import type { AvailabilityRequest } from '../../reservation/types'
import { homeMedia } from '../homeMedia'

export function HeroSection({ onSearch }: { onSearch: (form: AvailabilityRequest) => void }) {
  return (
    <section
      data-section
      className="landing-hero relative min-h-[960px] overflow-hidden text-white after:absolute after:inset-0 after:bg-[linear-gradient(90deg,rgb(14_34_57/0.76),rgb(14_34_57/0.14)_72%,transparent)] after:content-[''] md:min-h-[820px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-ken-burns bg-cover bg-center"
        style={{ backgroundImage: `url(${homeMedia.hero})` }}
      />
      <div
        className="relative z-[1] mx-auto w-[min(1088px,calc(100%_-_48px))] pt-[72px] md:pt-[86px]"
        data-hero-content
      >
        <h1 className="sr-only">MSDS</h1>
        <img
          className="block h-auto w-[230px] md:w-[min(310px,65vw)]"
          src={homeMedia.primaryLogoDark}
          alt="MSDS, Mindful Stay Deep Silence"
        />
        <p className="mt-[15px] leading-[1.9] text-[#eef1f3]">
          마음챙김과 깊은 고요 속에서
          <br />
          온전한 휴식에 닿아가는 머무름입니다.
        </p>
        <div className="mt-[25px] flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center border border-transparent bg-navy-900 px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-white no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            to="/rooms"
          >
            EXPLORE ROOMS
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center border border-white px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-white no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            to="/facility"
          >
            EXPLORE FACILITY
          </Link>
        </div>
      </div>
      <ReservationSearchBar
        className="absolute right-1/2 bottom-7 z-[2] w-[min(1248px,calc(100%_-_48px))] translate-x-1/2 rounded-lg !border-0 !p-4 shadow-floating md:bottom-[58px] md:!p-[26px]"
        onSearch={onSearch}
      />
    </section>
  )
}
