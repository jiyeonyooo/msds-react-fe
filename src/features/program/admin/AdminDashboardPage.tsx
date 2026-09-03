import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  return (
    <main className="px-6 py-10 lg:px-10">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">OVERVIEW</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-navy-900">관리자 대시보드</h1>
      <p className="mt-3 text-sm text-ink-500">
        현재 연결된 운영 기능부터 차례로 관리할 수 있습니다.
      </p>
      <Link
        className="mt-8 block max-w-xl rounded-lg border border-[#d8d0c2] bg-white p-7 shadow-card transition hover:-translate-y-0.5"
        to="/admin/programs"
      >
        <p className="text-[10px] font-medium tracking-[0.16em] text-gold-500">PROGRAMS</p>
        <h2 className="mt-3 font-display text-3xl font-semibold">프로그램 관리</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          프로그램 등록, 수정, 삭제와 프로그램별 신청자 현황을 확인합니다.
        </p>
      </Link>
    </main>
  )
}
