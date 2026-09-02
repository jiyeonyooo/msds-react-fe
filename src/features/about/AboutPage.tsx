import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import coast from '../../assets/msds-coast.png'
import hero from '../../assets/rooms5.png'
import facility2 from '../../assets/facility2.png'
import facility5 from '../../assets/facility5.png'
import rooms3 from '../../assets/rooms3.png'
import { navigate } from '../../lib/navigation'

// 브랜드 3원칙. 홈 화면의 카드와 같은 기호를 쓰되 이곳에서는 배경까지 설명한다.
const principles = [
  {
    symbol: '☾',
    title: 'DEEP SILENCE',
    korean: '깊은 고요',
    body: '객실과 공용 공간의 소음을 상시 측정해 조용한 시간을 지킵니다. 밤 9시부터 아침 7시까지는 사일런트 아워로, 안내도 서면으로 대신합니다.',
  },
  {
    symbol: '⌇',
    title: 'MINDFUL STAY',
    korean: '머무름의 태도',
    body: '체크인부터 체크아웃까지가 하나의 리듬입니다. 아침 명상, 낮의 산책, 저녁의 기록까지 머무는 순간마다 돌아볼 자리를 둡니다.',
  },
  {
    symbol: '☼',
    title: 'SLOW WELLNESS',
    korean: '느린 회복',
    body: '정해진 코스를 따르지 않습니다. 웰니스 체크로 지금의 마음 상태를 확인하고, 그날의 나에게 맞는 프로그램을 고르시면 됩니다.',
  },
]

// 하루의 흐름. 프로그램 시간표가 아니라 머무름의 리듬을 보여주는 안내다.
const dayFlow = [
  { time: '06:30', title: '새벽 명상', body: '해가 드는 명상 홀에서 30분간 호흡을 고릅니다.' },
  { time: '08:00', title: '고요한 아침', body: '대화 없이 즐기는 사일런트 브렉퍼스트로 하루를 엽니다.' },
  { time: '11:00', title: '해안 산책', body: '바다를 따라 걷는 2km 산책로에서 몸을 깨웁니다.' },
  { time: '15:00', title: '차와 기록', body: '티 라운지에서 오늘의 마음을 웰니스 체크에 남깁니다.' },
  { time: '19:30', title: '저녁 명상', body: '하루를 정리하는 바디스캔과 이완 세션이 열립니다.' },
  { time: '21:00', title: '사일런트 아워', body: '조명을 낮추고 모든 공간이 침묵으로 돌아갑니다.' },
]

const spaces = [
  { image: rooms3, eyebrow: 'STAY', title: '고요에 머무는 방', body: '1인 리트리트부터 4인 도미토리까지, 쉼의 방식에 따라 고른 객실.', to: '/rooms' },
  { image: facility2, eyebrow: 'FACILITY', title: '회복을 돕는 공간', body: '명상 홀, 티 라운지, 사우나까지 머무름을 잇는 시설.', to: '/facility' },
  { image: facility5, eyebrow: 'PROGRAM', title: '함께하는 시간', body: '명상, 사운드 배스, 글쓰기 세션으로 이어지는 프로그램.', to: '/programs' },
]

const facts = [
  ['2026', '문을 연 해'],
  ['22', '객실 수'],
  ['10H', '매일 지키는 사일런트 아워'],
  ['38dB', '평균 실내 소음'],
]

export function AboutPage() {
  return (
    <main>
      <section className="relative h-[420px] bg-cover bg-center md:h-[520px]" style={{ backgroundImage: `url(${hero})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/55 to-navy-900/25" aria-hidden="true" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-14 md:px-12 md:pb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-300">ABOUT MSDS</p>
          <h1 className="mt-3 font-display text-[46px] leading-[1.05] tracking-[-0.06rem] text-white md:text-[68px]">머무름이 곧 회복이 되는 곳</h1>
          <p className="mt-5 max-w-[640px] text-sm leading-7 break-keep text-white/80 md:text-base">
            MSDS는 Mindful Stay, Deep Silence의 약자입니다. 좋은 잠과 깊은 침묵, 그리고 스스로를 돌아보는 시간을 하나의 머무름으로 잇는 명상 게스트하우스입니다.
          </p>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-subtle">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4 md:px-12 md:py-12">
          {facts.map(([value, label]) => (
            <div className="text-center" key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="m-0">
                <strong className="block font-display text-[38px] leading-none font-medium text-navy-900">{value}</strong>
                <span className="mt-2 block text-[11px] tracking-[0.1em] text-muted">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid max-w-[1088px] grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2 md:gap-[90px] md:px-0 md:py-[128px]">
        <div>
          <i className="block h-0.5 w-[54px] bg-gold-500" />
          <p className="mt-5 text-[11px] font-medium tracking-[0.2em] text-gold-500">OUR STORY</p>
          <h2 className="mt-3 font-display text-[2.5rem] leading-[1.15] tracking-[0.3px] md:text-[2.75rem]">소음을 덜어내는 일에서<br />시작했습니다</h2>
          <div className="mt-6 grid gap-4 text-sm leading-loose break-keep text-secondary">
            <p>
              도시의 숙소에서 잘 자지 못하는 사람들을 오래 지켜봤습니다. 침대가 불편해서가 아니라, 쉬는 동안에도 소리와 알림이 끊이지 않기 때문이었습니다. 그래서 무엇을 더할지가 아니라 무엇을 덜어낼지부터 정했습니다.
            </p>
            <p>
              MSDS는 그 질문에서 출발한 스테이입니다. 소음을 측정해 조용함을 관리하고, 대화가 필요 없는 시간을 하루에 열 시간 남겨두고, 프로그램은 권하되 강요하지 않습니다. 머무는 동안 해야 할 일이 하나도 없다는 것, 그것이 저희가 준비한 회복의 조건입니다.
            </p>
          </div>
          <Button className="mt-7" variant="text" onClick={() => navigate('/rooms')}>객실 둘러보기 →</Button>
        </div>
        <img className="h-[300px] w-full object-cover md:h-[440px]" src={coast} alt="MSDS 앞 해안 풍경" />
      </section>

      <section className="bg-navy-900 px-6 py-20 md:px-12 md:py-[112px]">
        <div className="mx-auto max-w-[1088px]">
          <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">OUR PRINCIPLES</p>
          <h2 className="mt-3 font-display text-[2.25rem] leading-tight text-white md:text-[2.75rem]">머무름을 지키는 세 가지 약속</h2>
          <div className="mt-12 grid gap-px overflow-hidden border border-white/15 bg-white/15 md:grid-cols-3">
            {principles.map((principle) => (
              <article className="bg-navy-900 px-8 py-11" key={principle.title}>
                <span className="font-display text-[42px] text-gold-500" aria-hidden="true">{principle.symbol}</span>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-[1px] text-white">{principle.title}</h3>
                <p className="mt-1 text-[11px] tracking-[0.14em] text-gold-300">{principle.korean}</p>
                <p className="mt-5 text-sm leading-7 break-keep text-white/70">{principle.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1088px] px-6 py-20 md:px-0 md:py-[112px]">
        <div className="flex flex-col justify-between gap-4 border-b border-gold-300 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">A DAY AT MSDS</p>
            <h2 className="mt-3 font-display text-[2.25rem] leading-tight md:text-[2.75rem]">하루는 이렇게 흘러갑니다</h2>
          </div>
          <p className="max-w-[420px] text-sm leading-7 break-keep text-muted">모두 참여할 필요는 없습니다. 오늘의 나에게 필요한 시간만 고르시면 됩니다.</p>
        </div>
        <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {dayFlow.map((step) => (
            <li className="flex gap-5 border-b border-border-subtle pb-6" key={step.time}>
              <span className="w-16 shrink-0 pt-1 font-display text-lg font-medium text-gold-500">{step.time}</span>
              <div>
                <h3 className="text-[15px] font-medium text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 break-keep text-secondary">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-subtle px-6 py-20 md:px-12 md:py-[112px]">
        <div className="mx-auto max-w-[1088px]">
          <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">SPACES & PROGRAMS</p>
          <h2 className="mt-3 font-display text-[2.25rem] leading-tight md:text-[2.75rem]">머무는 동안 만나실 것들</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {spaces.map((space) => (
              <Link className="group block overflow-hidden border border-border-subtle bg-white shadow-card transition hover:-translate-y-0.5" key={space.to} to={space.to}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" src={space.image} alt={space.title} />
                </div>
                <div className="p-7">
                  <span className="text-[10px] font-medium tracking-[0.16em] text-gold-500">{space.eyebrow}</span>
                  <h3 className="mt-2 font-display text-[28px] leading-tight">{space.title}</h3>
                  <p className="mt-3 text-sm leading-6 break-keep text-muted">{space.body}</p>
                  <span className="mt-5 block text-xs tracking-[0.08em] text-navy-900 group-hover:text-gold-500">자세히 보기 →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1088px] grid-cols-1 gap-10 px-6 py-20 md:grid-cols-[1fr_auto] md:items-end md:px-0 md:py-[112px]">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">VISIT US</p>
          <h2 className="mt-3 font-display text-[2.25rem] leading-tight md:text-[2.75rem]">고요를 찾아오시는 길</h2>
          <dl className="mt-8 grid gap-4 text-sm leading-7 md:grid-cols-2">
            <div><dt className="text-[10px] tracking-[0.14em] text-gold-500">ADDRESS</dt><dd className="m-0 mt-1.5 text-secondary">서울특별시 송파구 올림픽로35길 125 (신천동)<br />삼성SDS 잠실 West Campus · 05510</dd></div>
            <div><dt className="text-[10px] tracking-[0.14em] text-gold-500">CHECK-IN / OUT</dt><dd className="m-0 mt-1.5 text-secondary">체크인 15:00 · 체크아웃 11:00<br />사일런트 아워 21:00 – 07:00</dd></div>
            <div><dt className="text-[10px] tracking-[0.14em] text-gold-500">CONTACT</dt><dd className="m-0 mt-1.5 text-secondary">hello@msds-guesthouse.com<br />02-6155-3114</dd></div>
            <div><dt className="text-[10px] tracking-[0.14em] text-gold-500">INQUIRY</dt><dd className="m-0 mt-1.5 text-secondary">궁금한 점은 <Link className="border-b border-gold-300 text-navy-900" to="/inquiries/new">문의 남기기</Link>로 보내주시면<br />운영팀이 순차적으로 답변드립니다.</dd></div>
          </dl>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <Button onClick={() => navigate('/reservations')}>BOOK YOUR STAY →</Button>
          <Button variant="secondary" onClick={() => navigate('/wellness')}>웰니스 체크 해보기</Button>
        </div>
      </section>
    </main>
  )
}
