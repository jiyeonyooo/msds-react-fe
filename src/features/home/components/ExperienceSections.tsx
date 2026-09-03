import { Link } from 'react-router-dom'
import { homeMedia } from '../homeMedia'

export function ExperienceSections() {
  return (
    <>
      <WellnessSection />
      <QuietnessSection />
      <ProgramSection />
      <FinalSection />
    </>
  )
}

function WellnessSection() {
  return (
    <section
      data-section
      id="wellness-experience"
      data-sequence
      className="landing-wellness bg-canvas"
      aria-labelledby="wellness-title"
    >
      <div className="mx-auto grid w-[min(1088px,calc(100%_-_48px))] grid-cols-1 items-center gap-8 pt-[110px] pb-[160px] md:grid-cols-[1.2fr_1fr] md:gap-x-[70px] md:gap-y-10 md:pt-[160px] md:pb-[230px]">
        <div>
          <p
            data-sequence-item
            className="text-[0.69rem] font-medium tracking-[0.17em] text-gold-500"
          >
            WELLNESS EXPERIENCE
          </p>
          <h2
            data-sequence-item
            className="my-[18px] font-display text-[clamp(2.7rem,5vw,4.4rem)] leading-none font-medium"
            id="wellness-title"
          >
            오늘, 마음의
            <br />
            온도는 어떤가요?
          </h2>
        </div>
        <ol className="m-0 list-none p-0">
          {[
            '한 가지 질문으로 시작합니다.',
            '마음의 상태를 천천히 살펴봅니다.',
            '나를 위한 휴식의 방향을 찾아봅니다.',
          ].map((text, index) => (
            <li data-sequence-item className="border-t border-ivory-200 py-[18px]" key={text}>
              <span className="inline-block w-[45px] font-display text-xl text-gold-500">
                0{index + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
        <Link
          data-sequence-item
          className="inline-flex min-h-11 items-center justify-center border border-transparent bg-navy-900 px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-white no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          to="/wellness/check"
        >
          WELLNESS CHECK
        </Link>
      </div>
    </section>
  )
}

function QuietnessSection() {
  return (
    <section
      data-section
      id="quietness-experience"
      data-sequence
      className="landing-quietness bg-navy-900 py-[110px] text-white md:py-[170px]"
      aria-labelledby="quietness-title"
    >
      <div className="mx-auto w-[min(1088px,calc(100%_-_48px))]">
        <p
          data-sequence-item
          className="text-[0.69rem] font-medium tracking-[0.17em] text-gold-500"
        >
          QUIETNESS EXPERIENCE
        </p>
        <h2
          data-sequence-item
          className="my-[18px] font-display text-[clamp(2.7rem,5vw,4.4rem)] leading-none font-medium"
          id="quietness-title"
        >
          A QUIETER WAY
          <br />
          TO BE HERE
        </h2>
        <p data-sequence-item className="leading-[1.9] text-[#dce2e9]">
          공간과 시간대에 따라 달라지는 고요함을, 측정 정보가 준비되는 대로 확인할 수 있습니다.
        </p>
        <div className="mt-10 mb-[30px] grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            ['SPACE', '공간별 고요함'],
            ['TIME', '시간대별 분위기'],
            ['FIND', '나에게 맞는 조용한 곳'],
          ].map(([label, text]) => (
            <article
              data-sequence-item
              className="min-h-[150px] border border-white/30 p-[22px]"
              key={label}
            >
              <span className="text-[0.68rem] tracking-[0.14em] text-gold-300">{label}</span>
              <p className="font-display text-[1.6rem]">{text}</p>
            </article>
          ))}
        </div>
        <Link
          data-sequence-item
          className="inline-flex min-h-11 items-center justify-center border border-white px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-white no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          to="/wellness#quietness"
        >
          EXPLORE QUIETNESS
        </Link>
      </div>
    </section>
  )
}

function ProgramSection() {
  return (
    <section
      data-section
      id="program-experience"
      data-sequence
      className="landing-program bg-canvas"
      aria-labelledby="program-title"
    >
      <div className="mx-auto w-[min(1088px,calc(100%_-_48px))] py-[110px] md:py-[170px]">
        <div>
          <p
            data-sequence-item
            className="text-[0.69rem] font-medium tracking-[0.17em] text-gold-500"
          >
            MEDITATION PROGRAM
          </p>
          <h2
            data-sequence-item
            className="my-[18px] font-display text-[clamp(2.7rem,5vw,4.4rem)] leading-none font-medium"
            id="program-title"
          >
            DISCOVER. RESERVE.
            <br />
            PRACTICE. REFLECT.
          </h2>
          <p data-sequence-item className="leading-[1.9] text-ink-700">
            프로그램을 발견하고 참여하며, 나만의 리듬을 돌아보는 경험입니다.
          </p>
        </div>
        <ol className="mt-[45px] mb-[30px] grid list-none grid-cols-1 gap-0 p-0 md:grid-cols-4 md:gap-[10px]">
          {['DISCOVER', 'RESERVE', 'PRACTICE', 'REFLECT'].map((step, index) => (
            <li
              data-sequence-item
              className="flex gap-1.5 border-t border-navy-900 py-5 text-[0.78rem] tracking-[0.08em] md:block"
              key={step}
            >
              <span className="inline-block w-[45px] font-display text-xl text-gold-500">
                0{index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <Link
          data-sequence-item
          className="inline-flex min-h-11 items-center justify-center border border-navy-900 px-6 py-[13px] text-xs font-medium tracking-[0.05em] text-navy-900 no-underline transition-[transform,background-color] duration-[240ms] ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          to="/programs"
        >
          VIEW PROGRAMS
        </Link>
      </div>
    </section>
  )
}

function FinalSection() {
  return (
    <section
      data-section
      data-final
      className="landing-final bg-cover bg-center pt-[120px] pb-[150px] text-center text-white md:pt-[190px] md:pb-[230px]"
      style={{
        backgroundImage: `linear-gradient(rgb(14 34 57 / 0.7), rgb(14 34 57 / 0.7)), url(${homeMedia.coast})`,
      }}
      aria-labelledby="final-title"
    >
      <div data-final-content className="mx-auto w-[min(1088px,calc(100%_-_48px))]">
        <img
          className="mx-auto mb-5 block h-auto w-[min(230px,65vw)]"
          src={homeMedia.primaryLogoDark}
          alt="MSDS"
        />
        <h2
          className="my-[18px] font-display text-[clamp(2.3rem,5vw,3.8rem)] leading-none font-medium"
          id="final-title"
        >
          오늘의 마음을 쉬게 하고,
          <br />
          가장 조용한 곳에 머물러 보세요.
        </h2>
      </div>
    </section>
  )
}
