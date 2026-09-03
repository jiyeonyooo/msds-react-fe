export type RoomType = 'STAY' | 'REST' | 'MEDITATE' | 'RETREAT'
export type RoomStatus = 'AVAILABLE' | 'SOLDOUT' | 'INAVAILABLE'

export type RoomSummary = {
  roomId: number
  name: string
  description: string | null
  mainImageUrl: string | null
  roomType: RoomType
  standardGuests: number
  maxGuests: number
  areaM2: number | null
  basePrice: number
}

export type RoomDetail = {
  roomId: number
  name: string
  description: string | null
  roomType: RoomType
  status: RoomStatus
  capacity: { standardGuests: number; maxGuests: number }
  roomSpecs: {
    areaM2: number | null
    bedType: 'SINGLE' | 'DOUBLE' | 'QUEEN' | 'KING' | 'TWIN' | null
    bedCount: number | null
    viewType: 'CITY' | 'OCEAN' | 'MOUNTAIN' | 'GARDEN' | 'RIVER' | 'NONE' | null
  }
  basePrice: number
  images: { imageId: number | null; imageUrl: string; imageType: string; sortOrder: number }[]
  equipmentGroups: {
    category: string
    categoryName: string
    equipments: {
      equipmentId: number
      name: string
      quantity: number | null
      note: string | null
      iconUrl: string | null
    }[]
  }[]
}
