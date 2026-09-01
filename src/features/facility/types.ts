export type FacilityCategory =
  | 'WELLNESS'
  | 'LEISURE'
  | 'FOOD'
  | 'BUSINESS'
  | 'CONVENIENCE'
  | 'PARKING'
  | 'ACCESSIBILITY'
  | 'ETC'

export type FacilityFilter = 'ALL' | FacilityCategory

export type Facility = {
  facilityId: number
  name: string
  category: FacilityCategory
  description: string | null
  imageUrl: string | null
}

export type FacilityListResponse = {
  code: string
  message: string
  data: Facility[]
}
