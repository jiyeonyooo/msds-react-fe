import { Link, useLocation } from 'react-router-dom'
import { adminNavigation, type AdminNavigationItem } from './adminNavigation'

export function AdminHomePage() {
  return (
    <>
      <PageHeading description="관리할 업무를 선택하세요." title="운영 대시보드" />
      <div className="grid gap-4 lg:grid-cols-2">
        {adminNavigation.map((item) => (
          <Link className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#8ba0b5] hover:shadow-md" key={item.to} to={item.to}>
            <p className="text-sm font-semibold text-[#172b44]">{item.label}</p>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <span className="mt-5 block text-[11px] tracking-wide text-slate-400 group-hover:text-[#b08d4d]">{item.endpoint}</span>
          </Link>
        ))}
      </div>
    </>
  )
}

export function AdminFeaturePlaceholderPage() {
  const { pathname } = useLocation()
  const item = adminNavigation.find((navigation) => pathname === navigation.to)
  if (!item) return null

  return <FeaturePlaceholder item={item} />
}

export function AdminForbiddenPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-24 text-center">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">ACCESS DENIED</p>
      <h1 className="mt-3 text-3xl font-semibold text-navy-900">관리자 권한이 필요합니다.</h1>
      <Link className="mt-7 inline-block rounded-sm bg-navy-900 px-6 py-3 text-xs tracking-[0.08em] text-white" to="/">
        홈으로 돌아가기
      </Link>
    </main>
  )
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <header className="mb-8 border-b border-slate-300 pb-6"><p className="text-[11px] font-semibold tracking-[0.16em] text-[#a77f3b]">ADMINISTRATION</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#172b44]">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p></header>
}

function FeaturePlaceholder({ item }: { item: AdminNavigationItem }) {
  return (
    <>
      <PageHeading description={item.description} title={item.label} />
      <section className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center" aria-labelledby="admin-feature-preparing">
        <h3 className="text-lg font-semibold text-[#172b44]" id="admin-feature-preparing">기능 준비 중</h3>
        <p className="mt-2 text-sm text-slate-600">이 화면의 세부 조회·등록·수정 기능은 다음 단계에서 연결합니다.</p>
        <p className="mt-5 text-xs text-slate-400">연결 예정 API: {item.endpoint}</p>
      </section>
    </>
  )
}
