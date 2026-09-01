import { Link } from 'react-router-dom'

const primaryButton =
  'rounded-sm bg-navy-900 px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:bg-[#bdbbb6]'
export function ComponentGallery() {
  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">DEVELOPMENT ONLY</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
        컴포넌트 갤러리
      </h1>
      <p className="text-sm text-muted">
        공통 UI의 기본 상태와 비활성 상태를 빠르게 확인합니다.
      </p>
      <section className="my-9 grid grid-cols-1 gap-[18px] md:grid-cols-3">
        <article className="grid gap-[14px] border border-border-subtle bg-white p-[22px]">
          <h2 className="m-0 font-display text-[28px] font-medium">Buttons</h2>
          <button className={primaryButton}>예약 확정</button>
          <button className={primaryButton} disabled>
            처리 중
          </button>
          <button className="border border-error-border bg-transparent px-[18px] py-3 text-error">
            예약 취소
          </button>
        </article>
        <article className="grid gap-[14px] border border-border-subtle bg-white p-[22px]">
          <h2 className="m-0 font-display text-[28px] font-medium">Status</h2>
          <span className="h-fit w-fit border border-gold-300 px-[7px] py-1 text-[11px] text-[#a6874f]">
            예약 완료
          </span>
          <span className="h-fit w-fit border border-border-subtle px-[7px] py-1 text-[11px] text-[#8f969b]">
            취소 완료
          </span>
        </article>
        <article className="grid gap-[14px] border border-border-subtle bg-white p-[22px]">
          <h2 className="m-0 font-display text-[28px] font-medium">Form fields</h2>
          <label className="grid gap-[5px] text-[10px] tracking-[1px] text-muted">
            CHECK-IN
            <input
              className="border border-border-subtle bg-white p-2.5"
              type="date"
              defaultValue="2026-09-12"
            />
          </label>
          <label className="grid gap-[5px] text-[10px] tracking-[1px] text-muted">
            GUESTS
            <select className="border border-border-subtle bg-white p-2.5" defaultValue="2">
              <option value="1">성인 1명</option>
              <option value="2">성인 2명</option>
            </select>
          </label>
        </article>
      </section>
      <Link className="mt-[22px] inline-block text-xs tracking-[0.14em] text-gold-500" to="/">
        홈으로 돌아가기 →
      </Link>
    </main>
  )
}
