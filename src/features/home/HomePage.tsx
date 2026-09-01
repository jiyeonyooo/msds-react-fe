import { navigate } from '../../lib/navigation'
import hero from '../../assets/msds-hero.png'
import coast from '../../assets/msds-coast.png'
const primary =
  'rounded-msds bg-msds-navy px-6 py-3 text-xs tracking-[0.06em] text-white transition hover:bg-msds-navy-light'
export function HomePage() {
  return (
    <main>
      <section
        className="relative h-[720px] bg-cover bg-center md:h-[780px]"
        style={{ backgroundImage: `url(${hero})` }}
      >
        <div className="w-auto px-6 pt-19 md:w-[650px] md:px-[max(3rem,calc((100vw-1248px)/2))] md:pt-25">
          <span className="font-display text-[2.125rem] text-msds-gold">☾</span>
          <h1 className="my-2 font-display text-7xl leading-[0.95] tracking-[-0.125rem] md:text-[6rem]">
            MSDS
          </h1>
          <p className="text-[0.6875rem] font-medium tracking-[0.17em]">
            M I N D F U L S T A Y , D E E P S I L E N C E
          </p>
          <i className="my-[18px] block h-px w-18 bg-msds-gold" />
          <p className="my-[18px] text-base leading-loose text-msds-copy">
            마음챙김과 깊은 고요 속에서
            <br />
            온전히 나에게 돌아오는 웰니스 스테이
          </p>
          <button className={primary} onClick={() => navigate('/reservations')}>
            BOOK YOUR STAY →
          </button>
        </div>
        <section
          className="absolute bottom-[18px] left-1/2 grid w-[calc(100%-48px)] max-w-7xl -translate-x-1/2 grid-cols-1 gap-3 rounded-panel bg-white p-4 shadow-panel md:bottom-5 md:grid-cols-[1fr_1fr_1fr_auto] md:gap-[18px] md:p-[22px_30px]"
          aria-label="예약 바로가기"
        >
          {[
            ['CHECK-IN', '머무를 날짜 선택'],
            ['CHECK-OUT', '떠나는 날짜 선택'],
            ['GUESTS', '인원 선택'],
          ].map(([label, value]) => (
            <div className="rounded-msds border border-msds-border p-3 md:p-[18px]" key={label}>
              <span className="text-[0.625rem] tracking-[0.12em] text-msds-muted">{label}</span>
              <b className="mt-2 block text-sm font-normal">{value}</b>
            </div>
          ))}
          <button className={primary} onClick={() => navigate('/reservations')}>
            CHECK AVAILABILITY
          </button>
        </section>
      </section>
      <section className="mx-auto grid max-w-[1088px] grid-cols-1 gap-8 px-6 py-20 md:grid-cols-2 md:gap-[90px] md:px-0 md:py-[138px]">
        <div>
          <i className="block h-0.5 w-[54px] bg-msds-gold" />
          <h2 className="my-[22px] font-display text-[2.75rem] leading-[1.15] tracking-[0.3px]">
            A PLACE TO RETURN
            <br />
            TO YOURSELF
          </h2>
          <p className="leading-loose text-msds-copy">
            MSDS는 바쁜 일상에서 벗어나 깊은 침묵과 마음챙김으로
            <br />
            온전히 나에게 돌아가는 명상 게스트하우스입니다.
            <br />
            숙박·명상·마음 기록이 하나의 회복 여정으로 이어집니다.
          </p>
          <button
            className="mt-[22px] border-0 bg-transparent p-0 text-xs tracking-[0.14em] text-msds-gold"
            onClick={() => navigate('/about')}
          >
            OUR STORY →
          </button>
        </div>
        <img className="h-[380px] w-full object-cover" src={coast} alt="고요한 바다와 해안" />
      </section>
      <section className="mx-auto grid max-w-[1088px] grid-cols-1 gap-4 px-6 pb-[70px] md:grid-cols-3 md:px-0 md:pb-[110px]">
        {[
          ['☾', 'DEEP SILENCE', '자연 속에서 깊은 침묵을 경험하며 마음을 비웁니다.'],
          ['⌇', 'MINDFUL STAY', '머무는 모든 순간이 회복의 시간이 됩니다.'],
          ['☼', 'SLOW WELLNESS', '나에게 맞는 느린 리듬을 찾아갑니다.'],
        ].map(([icon, title, text]) => (
          <article className="bg-white px-[26px] py-[42px] text-center" key={title}>
            <span className="font-display text-[42px] text-msds-gold">{icon}</span>
            <h3 className="font-display text-2xl font-semibold tracking-[1px]">{title}</h3>
            <p className="text-sm leading-7 text-msds-copy">{text}</p>
            <button className="mt-[22px] border-0 bg-transparent p-0 text-xs tracking-[0.14em] text-msds-gold">
              LEARN MORE →
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}
