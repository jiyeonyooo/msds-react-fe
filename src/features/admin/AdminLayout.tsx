import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import wordmarkDark from '../../assets/ui/wordmark-dark.svg'
import { adminNavigation } from './adminNavigation'

export function AdminLayout() {
  const { pathname } = useLocation()
  return (
    <main className="min-h-screen bg-[#eef2f5] text-slate-800">
      <header className="h-[92px] border-b border-[#31465e] bg-[#172b44] text-white">
        <div className="relative mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 md:px-16">
          <Link className="pl-4 grid w-[112px] gap-0.5 text-white no-underline" to="/admin">
            <img alt="MSDS" className="w-full pb-1" src={wordmarkDark} />
            <span className="h-px w-full bg-[#c7a96d]" />
            <span className="pt-0.25 text-center text-[9px] font-medium tracking-[0.42em] text-[#c7a96d]">
              ADMIN
            </span>
          </Link>
          <nav
            className="absolute left-1/2 w-max max-w-[calc(100%-360px)] -translate-x-1/2 overflow-x-auto"
            aria-label="관리자 기능"
          >
            <ul className="flex min-w-max items-center gap-1">
              {adminNavigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) => {
                      const resourceActive =
                        item.to === '/admin/rooms' && pathname.startsWith('/admin/facilities')
                      return `block border-b-2 px-3 py-3 text-xs font-medium tracking-[0.04em] whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c7a96d] ${isActive || resourceActive ? 'border-[#c7a96d] text-white' : 'border-transparent text-slate-300 hover:border-slate-400 hover:text-white'}`
                    }}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            className="rounded-sm border border-[#708195] px-4 py-3 text-[11px] font-medium tracking-[0.06em] text-primary transition-colors bg-white hover:bg-white/70"
            to="/"
          >
            HOME
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-[1440px] p-5 md:p-10">
        <Outlet />
      </section>
    </main>
  )
}
