import hero from '../../assets/msds-hero.png'
import coast from '../../assets/msds-coast.png'
import roomOne from '../../assets/rooms1.png'
import roomTwo from '../../assets/rooms2.png'
import roomThree from '../../assets/rooms3.png'
import facilityOne from '../../assets/facility1.png'
import facilityTwo from '../../assets/facility2.png'
import facilityThree from '../../assets/facility3.png'
import primaryLogoDark from '../../assets/ui/primary-logo-dark.svg'

export const homeMedia = {
  hero,
  coast,
  primaryLogoDark,
  rooms: [roomOne, roomTwo, roomThree],
  facilities: [facilityOne, facilityTwo, facilityThree],
} as const
