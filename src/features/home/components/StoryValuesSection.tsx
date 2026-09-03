import { homeMedia } from '../homeMedia'

const values = [
  {
    icon: '☾',
    title: 'WELLNESS',
    description: '지금의 마음 상태를 살피고, 나에게 맞는 휴식의 시작점을 찾아보세요.',
    target: 'wellness-experience',
  },
  {
    icon: '⌇',
    title: 'QUIETNESS',
    description: '공간별 고요함과 시간대별 분위기를 확인해 나에게 맞는 조용한 곳을 찾아보세요.',
    target: 'quietness-experience',
  },
  {
    icon: '☼',
    title: 'MEDITATION',
    description: '프로그램을 찾아 참여하고, 경험을 돌아보는 시간을 이어가세요.',
    target: 'program-experience',
  },
] as const

export function StoryValuesSection({ onCardSelect }: { onCardSelect: (target: string) => void }) {
  return (
    <section data-section className="landing-story-values bg-canvas" aria-labelledby="story-title">
      <div
        id="story"
        data-story
        className="mx-auto grid w-[min(1088px,calc(100%_-_48px))] grid-cols-1 items-center gap-8 pt-[74px] md:grid-cols-2 md:gap-[90px] md:pt-[138px]"
      >
        <div data-story-copy>
          <i className="mb-5 block h-0.5 w-[54px] bg-gold-500" aria-hidden="true" />
          <p className="text-[0.69rem] font-medium tracking-[0.17em] text-gold-500">
            THE WAY WE STAY
          </p>
          <h2
            className="my-[18px] font-display text-[clamp(2.7rem,5vw,4.4rem)] leading-none font-medium"
            id="story-title"
          >
            A PLACE TO RETURN
            <br />
            TO YOURSELF
          </h2>
          <p className="leading-[1.9] text-ink-700">
            MSDS는 바쁜 일상에서 벗어나 깊은 침묵과 마음챙김으로 온전한 휴식에 닿아가는 명상
            게스트하우스입니다. 숙박과 명상, 마음 기록이 하나의 느린 여정으로 이어집니다.
          </p>
        </div>
        <img
          data-story-image
          className="min-h-[250px] w-full object-cover md:min-h-[380px]"
          src={homeMedia.coast}
          alt="고요한 바다와 해안"
        />
      </div>

      <div
        data-values
        className="mx-auto grid w-[min(1088px,calc(100%_-_48px))] grid-cols-1 gap-4 pt-[74px] pb-[130px] md:grid-cols-3 md:pt-[100px] md:pb-[200px]"
        aria-label="MSDS 핵심 경험"
      >
        {values.map(({ description, icon, target, title }, index) => (
          <button
            data-value-card
            className="group relative block min-h-[270px] min-w-0 border-0 bg-transparent p-0 text-center text-inherit md:min-h-[330px]"
            type="button"
            key={title}
            onClick={() => onCardSelect(target)}
            aria-label={`${title} 섹션으로 이동`}
          >
            <span className="relative flex min-h-[270px] w-full flex-col items-center border border-transparent bg-white px-7 py-[34px] shadow-card transition-[transform_320ms_cubic-bezier(0.22,1,0.36,1),border-color_260ms_ease,box-shadow_260ms_ease,background-color_260ms_ease] group-hover:z-[1] group-hover:-translate-y-[10px] group-hover:scale-[1.025] group-hover:border-gold-300 group-hover:bg-ivory-100 group-hover:shadow-[0_22px_42px_-12px_rgb(14_34_57/0.2)] group-focus-visible:z-[1] group-focus-visible:-translate-y-[10px] group-focus-visible:scale-[1.025] group-focus-visible:border-gold-300 group-focus-visible:bg-ivory-100 group-focus-visible:shadow-[0_22px_42px_-12px_rgb(14_34_57/0.2)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:translate-y-0 motion-reduce:group-focus-visible:scale-100 md:min-h-[330px]">
              <span
                className="h-[55px] font-display text-5xl leading-none text-gold-500"
                aria-hidden="true"
              >
                {icon}
              </span>
              <small className="mt-3 font-display text-base text-gold-500">0{index + 1}</small>
              <span className="my-2 block font-display text-[1.65rem] font-medium">{title}</span>
              <span className="block flex-1 text-sm leading-[1.8] text-ink-700">{description}</span>
              <b className="text-xs font-medium text-gold-500">
                EXPLORE <span aria-hidden="true">→</span>
              </b>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
