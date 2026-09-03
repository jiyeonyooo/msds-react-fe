import hero from '../../assets/rooms5.png'

const mapUrl =
  'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%86%A1%ED%8C%8C%EA%B5%AC%20%EC%98%AC%EB%A6%BC%ED%94%BD%EB%A1%9C35%EA%B8%B8%20125'

const principles = [
  {
    title: 'DEEP SILENCE',
    korean: '깊은 고요',
    body: '필요한 자극은 덜고, 머무는 사람의 리듬이 자연스럽게 드러나는 시간을 만듭니다.',
  },
  {
    title: 'MINDFUL STAY',
    korean: '머무름의 태도',
    body: '정해진 방식보다 지금의 나에게 필요한 속도를 존중합니다. 쉬어 가는 일에도 각자의 방법이 있습니다.',
  },
  {
    title: 'SLOW WELLNESS',
    korean: '천천히 회복하기',
    body: '더 많이 채우기보다 잠시 멈춰 나를 살피는 경험이 일상으로 이어지도록 돕습니다.',
  },
]

export function AboutPage() {
  return (
    <main>
      <section
        className="relative h-[420px] bg-cover bg-center md:h-[520px]"
        style={{ backgroundImage: `url(${hero})` }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/55 to-navy-900/25"
        />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-14 md:px-12 md:pb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-300">ABOUT MSDS</p>
          <h1 className="mt-3 font-display text-[46px] leading-[1.05] tracking-[-0.06rem] text-white md:text-[68px]">
            머무름이 곧 회복이 되는 곳
          </h1>
          <p className="mt-5 max-w-[640px] text-sm leading-7 break-keep text-white/80 md:text-base">
            MSDS는 Mindful Stay, Deep Silence의 약자입니다. 바쁜 일상에서 한 걸음 물러나, 나만의
            호흡과 감각을 다시 만나는 시간을 위한 명상 게스트하우스입니다.
          </p>
        </div>
      </section>

      <section className="bg-navy-900 px-6 py-20 md:px-12 md:py-[112px]">
        <div className="mx-auto max-w-[1088px]">
          <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">OUR PRINCIPLES</p>
          <h2 className="mt-3 font-display text-[2.25rem] leading-tight text-white md:text-[2.75rem]">
            머무름을 지키는 세 가지 약속
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden border border-white/15 bg-white/15 md:grid-cols-3">
            {principles.map((principle) => (
              <article className="bg-navy-900 px-8 py-11" key={principle.title}>
                <h3 className="font-display text-2xl font-semibold tracking-[1px] text-white">
                  {principle.title}
                </h3>
                <p className="mt-1 text-[11px] tracking-[0.14em] text-gold-300">
                  {principle.korean}
                </p>
                <p className="mt-5 text-sm leading-7 break-keep text-white/70">{principle.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-subtle px-6 py-20 md:px-12 md:py-[112px]">
        <div className="mx-auto max-w-[1088px]">
          <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">VISIT MSDS</p>
          <div className="mt-3 flex flex-col justify-between gap-6 border-b border-gold-300 pb-8 md:flex-row md:items-end">
            <h2 className="font-display text-[2.25rem] leading-tight md:text-[2.75rem]">
              고요를 찾아오시는 길
            </h2>
            <p className="max-w-[420px] text-sm leading-7 break-keep text-muted">
              방문 전 예약 일자와 체크인 안내를 확인해 주세요. 정확한 경로는 지도 앱에서 확인하실 수
              있습니다.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_1fr]">
            <article className="bg-white p-7 md:p-9">
              <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">LOCATION</p>
              <h3 className="mt-3 font-display text-[28px] leading-tight text-navy-900">
                MSDS 잠실
              </h3>
              <address className="mt-5 not-italic text-sm leading-7 text-secondary">
                서울특별시 송파구 올림픽로35길 125 (신천동)
                <br />
                삼성SDS 잠실 West Campus · 05510
              </address>
              <a
                className="mt-7 inline-block border-b border-gold-300 pb-1 text-xs tracking-[0.08em] text-navy-900 transition-colors hover:text-gold-500"
                href={mapUrl}
                rel="noreferrer"
                target="_blank"
              >
                지도에서 길찾기 →
              </a>
            </article>
            <div className="grid gap-6">
              <article className="border border-border-subtle bg-white p-7">
                <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">
                  GETTING HERE
                </p>
                <h3 className="mt-3 text-[15px] font-medium text-navy-900">대중교통 · 차량 방문</h3>
                <p className="mt-3 text-sm leading-7 break-keep text-secondary">
                  지하철과 버스 이용 시 지도 앱에서 ‘MSDS 잠실’을 목적지로 설정해 주세요. 차량
                  방문과 주차 안내는 예약 전 문의로 확인해 주시면 가장 정확하게 안내해 드립니다.
                </p>
              </article>
              <article className="border border-border-subtle bg-white p-7">
                <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">CONTACT</p>
                <h3 className="mt-3 text-[15px] font-medium text-navy-900">문의 및 체크인 안내</h3>
                <p className="mt-3 text-sm leading-7 text-secondary">
                  <a
                    className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 hover:text-navy-900"
                    href="tel:02-6155-3114"
                  >
                    02-6155-3114
                  </a>
                  <br />
                  <a
                    className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 hover:text-navy-900"
                    href="mailto:hello@msds-guesthouse.com"
                  >
                    hello@msds-guesthouse.com
                  </a>
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
