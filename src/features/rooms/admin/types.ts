import type { FacilityCategory } from '../../facility/types'
import type { RoomDetail, RoomStatus, RoomType } from '../types'

export type AdminRoom = RoomDetail

export type AdminRoomRequest = {
  name: string
  description: string
  roomType: RoomType
  status: RoomStatus
  minGuest: number
  maxGuest: number
  area: number
  basePrice: number
  mainImageUrl?: string
  bedType?: 'SINGLE' | 'DOUBLE' | 'QUEEN' | 'KING' | 'TWIN'
  bedCount?: number
}

export type AdminRoomUpdateRequest = Partial<AdminRoomRequest>

export type EquipmentCategory =
  | 'ELECTRONICS'
  | 'FURNITURE'
  | 'BATHROOM'
  | 'BEDDING'
  | 'KITCHEN'
  | 'CONVENIENCE'
  | 'WELLNESS'

export type RoomEquipmentOption = {
  equipmentId: number
  name: string
  category: EquipmentCategory
  description: string | null
  iconUrl: string | null
}

export type RoomEquipmentSelection = {
  equipmentId: number
  quantity: number
  note?: string
}

export type AdminFacility = {
  facilityId: number
  name: string
  category: FacilityCategory
  description: string | null
  imageUrl: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type AdminFacilityRequest = {
  name: string
  category: FacilityCategory
  description?: string
  imageUrl?: string
  active?: boolean
}

export type AdminFacilityUpdateRequest = Partial<AdminFacilityRequest>
