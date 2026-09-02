// src/types/meditation.ts

export type ProgramStatus = 'OPEN' | 'CLOSED'

export interface ProgramResponse {
  id: number
  name: string
  pictureUrl: string | null
  capacity: number
  remain: number
  status: ProgramStatus
}

export interface ProgramCreateRequest {
  name: string
  pictureUrl?: string
  capacity: number
}

export interface ProgramUpdateRequest {
  name: string
  pictureUrl?: string
  capacity: number
}

export interface ReservationRequest {
  programId: number
  quantity: number
}

export type ProgramReservationStatus = 'RESERVED' | 'CANCELLED'

export interface ProgramReservationResponse {
  reservationId: number
  programId: number
  programName: string
  pictureUrl: string | null
  quantity: number
  status: ProgramReservationStatus
  createdAt: string
  cancelledAt: string | null
}

export interface ProgramApplicationResponse {
  reservationId: number
  programId: number
  userId: number
  name: string
  email: string
  quantity: number
  status: ProgramReservationStatus
  createdAt: string
  cancelledAt: string | null
}

export interface ReviewResponse {
  id: number
  programReservationId: number
  userId: number
  programName: string
  userName: string
  content: string
  createdAt: string // LocalDateTime은 JSON에서 ISO 문자열로 옴 (예: "2026-09-01T10:30:00")
}

export interface ReviewCreateRequest {
  programReservationId: number
  content: string
}
