import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { SocialIcons } from './SocialIcons'

const links = [
  ['STAY', '/rooms'],
  ['PROGRAM', '/programs'],
  ['WELLNESS', '/wellness'],
  ['ABOUT', '/about'],
  ['RESERVATION', '/reservations'],
]
export function Footer() {
  return (
    <footer className="bg-navy-900 px-6 pt-9 pb-5 text-white md:h-[360px] md:px-[max(5rem,calc((100vw-1240px)/2))]">
      <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 md:h-[190px] md:flex-row">
        <Logo compact inverse />
        <div className="text-[11px]">
          <p className="mb-2 font-medium tracking-[1.65px] text-gold-500">QUICK LINKS</p>
          {links.map(([label, to]) => (
            <NavLink
              className="block leading-[22px] opacity-90 hover:text-gold-300"
              key={to}
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </div>
        <address className="not-italic text-[11px] leading-[20px] opacity-90">
          <p className="mb-2 font-medium tracking-[1.65px] text-gold-500">CONTACT & LOCATION</p>
          <p>hello@msds-guesthouse.com</p>
          <p>02-6155-3114</p>
          <p>
            서울특별시 송파구 올림픽로35길 125 (신천동)
            <br />
            삼성SDS 잠실 West Campus · 05510
          </p>
        </address>
        <div>
          <p className="mb-2 text-[11px] font-medium tracking-[1.65px] text-gold-500">FOLLOW US</p>
          <SocialIcons />
        </div>
      </div>
      <div className="mx-auto mt-6 flex max-w-[1240px] flex-col justify-between gap-3 border-t border-border-subtle/45 pt-4 text-[10px] text-white/70 sm:flex-row">
        <span>© 2026 MSDS Meditation Guesthouse. All rights reserved.</span>
        <span>
          PRIVACY POLICY · TERMS OF SERVICE ·{' '}
          <a className="hover:text-gold-300" href="#top">
            TOP ↑
          </a>
        </span>
      </div>
    </footer>
  )
}
