import { NavLink } from 'react-router-dom'

type NavItemProps = { label: string; to: string }
export function NavItem({ label, to }: NavItemProps) {
  return <NavLink className={({ isActive }) => `border-b px-2 py-3 text-xs tracking-[0.14em] transition-colors lg:px-4 ${isActive ? 'border-gold-500 text-navy-900' : 'border-transparent text-secondary hover:border-gold-300'}`} end={to === '/'} to={to}>{label}</NavLink>
}
