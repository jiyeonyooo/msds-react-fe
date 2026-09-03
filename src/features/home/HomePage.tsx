import { useEffect, useRef, useState } from 'react'
import { getFacilities } from '../facility/api'
import type { Facility } from '../facility/types'
import { roomsApi } from '../rooms/api'
import type { RoomSummary } from '../rooms/types'
import type { AvailabilityRequest } from '../reservation/types'
import { bookingToQuery, setBooking } from '../reservation/bookingStore'
import { navigate } from '../../lib/navigation'
import { ExperienceSections } from './components/ExperienceSections'
import { HeroSection } from './components/HeroSection'
import { FacilityShowcaseSection, RoomsShowcaseSection } from './components/ShowcaseSections'
import { StoryValuesSection } from './components/StoryValuesSection'
import { scrollToExperience, useLandingMotion } from './useLandingMotion'

export function HomePage() {
  const scope = useRef<HTMLElement>(null)
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [contentStatus, setContentStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useLandingMotion(scope)

  useEffect(() => {
    let active = true
    Promise.all([roomsApi.list(), getFacilities()])
      .then(([roomData, facilityData]) => {
        if (!active) return
        setRooms(roomData)
        setFacilities(facilityData)
        setContentStatus('ready')
      })
      .catch(() => active && setContentStatus('error'))
    return () => {
      active = false
    }
  }, [])

  const goToReservation = (form: AvailabilityRequest) => {
    // 히어로에서 채운 조건이 예약 화면까지 그대로 이어지도록 컨텍스트에 먼저 남긴다.
    navigate(`/reservations?${bookingToQuery(setBooking(form), { search: '1' })}`)
  }

  const featuredFacilities = facilities
    .filter((facility) => ['WELLNESS', 'LEISURE', 'FOOD'].includes(facility.category))
    .slice(0, 3)

  return (
    <main ref={scope} className="landing-page overflow-x-clip text-navy-900">
      <HeroSection onSearch={goToReservation} />
      <StoryValuesSection onCardSelect={scrollToExperience} />
      <RoomsShowcaseSection rooms={rooms} status={contentStatus} />
      <FacilityShowcaseSection facilities={featuredFacilities} status={contentStatus} />
      <ExperienceSections />
    </main>
  )
}
