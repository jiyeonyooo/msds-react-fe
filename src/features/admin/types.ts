import type { FacilityCategory } from '../facility/types'
import type { RoomDetail, RoomStatus, RoomType } from '../rooms/types'

export type ApiEnvelope<T> = { code: string; message: string; data: T }

export type RoomFormValue = {
  name: string
  description: string
  roomType: RoomType
  status: RoomStatus
  minGuest: number
  maxGuest: number
  area: number
  basePrice: number
}

export type RoomCreateRequest = RoomFormValue
export type RoomUpdateRequest = Partial<RoomCreateRequest>

export type FacilityDetail = {
  facilityId: number
  name: string
  category: FacilityCategory
  description: string | null
  imageUrl: string | null
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type FacilityFormValue = {
  name: string
  category: FacilityCategory
  description: string
  imageUrl: string
  active: boolean
}

export type FacilityCreateRequest = {
  name: string
  category: FacilityCategory
  description?: string
  imageUrl?: string
  active: boolean
}
export type FacilityUpdateRequest = Partial<FacilityCreateRequest>

export type { FacilityCategory, RoomDetail, RoomStatus, RoomType }
