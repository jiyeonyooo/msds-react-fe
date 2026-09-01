import { navigate } from '../../lib/navigation'
import hero from '../../assets/msds-hero.png'
import coast from '../../assets/msds-coast.png'
export function HomePage() {
  return (
    <main>
      <section className="hero" style={{ backgroundImage: `url(${hero})` }}>
        <div className="hero-copy">
          <span className="moon">☾</span>
          <h1>MSDS</h1>
          <p className="eyebrow">
            M I N D F U L &nbsp; S T A Y , &nbsp; D E E P &nbsp; S I L E N C E
          </p>
          <i />
          <p>
            마음챙김과 깊은 고요 속에서
            <br />
            온전히 나에게 돌아오는 웰니스 스테이
          </p>
          <button className="primary-button" onClick={() => navigate('/reservations')}>
            BOOK YOUR STAY&nbsp; →
          </button>
        </div>
        <section className="quick-book" aria-label="예약 바로가기">
          <div>
            <span>CHECK-IN</span>
            <b>머무를 날짜 선택</b>
          </div>
          <div>
            <span>CHECK-OUT</span>
            <b>떠나는 날짜 선택</b>
          </div>
          <div>
            <span>GUESTS</span>
            <b>인원 선택</b>
          </div>
          <button className="primary-button" onClick={() => navigate('/reservations')}>
            CHECK AVAILABILITY
          </button>
        </section>
      </section>
      <section className="story section">
        <div>
          <i />
          <h2>
            A PLACE TO RETURN
            <br />
            TO YOURSELF
          </h2>
          <p>
            MSDS는 바쁜 일상에서 벗어나 깊은 침묵과 마음챙김으로
            <br />
            온전히 나에게 돌아가는 명상 게스트하우스입니다.
            <br />
            숙박·명상·마음 기록이 하나의 회복 여정으로 이어집니다.
          </p>
          <button className="text-button" onClick={() => navigate('/about')}>
            OUR STORY →
          </button>
        </div>
        <img src={coast} alt="고요한 바다와 해안" />
      </section>
      <section className="feature-grid section">
        {[
          ['☾', 'DEEP SILENCE', '자연 속에서 깊은 침묵을 경험하며 마음을 비웁니다.'],
          ['⌇', 'MINDFUL STAY', '머무는 모든 순간이 회복의 시간이 됩니다.'],
          ['☼', 'SLOW WELLNESS', '나에게 맞는 느린 리듬을 찾아갑니다.'],
        ].map(([icon, title, text]) => (
          <article key={title}>
            <span>{icon}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <button className="text-button">LEARN MORE →</button>
          </article>
        ))}
      </section>
    </main>
  )
}
