import { Link } from 'react-router-dom'
import primaryLogoDark from '../../assets/ui/primary-logo-dark.svg'
import primaryLogoLight from '../../assets/ui/primary-logo-light.svg'

type LogoProps = { inverse?: boolean; compact?: boolean }

export function Logo({ compact = false, inverse = false }: LogoProps) {
  const source = inverse ? primaryLogoDark : primaryLogoLight
  const size = compact ? 'w-[220px]' : 'w-[150px]'
  return <Link aria-label="MSDS 홈으로" className={`block shrink-0 ${size}`} to="/"><img alt="MSDS" className="h-auto w-full" src={source} /></Link>
}
