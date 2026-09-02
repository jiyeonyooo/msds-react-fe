// src/api/program.ts
import { apiClient } from './client'
import type {
  ProgramApplicationResponse,
  ProgramCreateRequest,
  ProgramReservationResponse,
  ProgramResponse,
  ProgramUpdateRequest,
  ReservationRequest,
} from './types'

export const getPrograms = () => apiClient.get<ProgramResponse[]>('/meditation/program')

export const getProgram = (programId: number) =>
  apiClient.get<ProgramResponse>(`/meditation/program/detail/${programId}`)

export const reserveProgram = (request: ReservationRequest) =>
  apiClient.postForLocation('/meditation/program', request)

export const cancelReservation = (reservationId: number) =>
  apiClient.delete(`/meditation/program/reservation/${reservationId}`)

export const getMyProgramReservations = () =>
  apiClient.get<ProgramReservationResponse[]>('/meditation/program/reservations')

// --- 관리자 ---
export const createProgram = (request: ProgramCreateRequest) =>
  apiClient.postForLocation('/meditation/admin/program', request)

export const updateProgram = (programId: number, request: ProgramUpdateRequest) =>
  apiClient.put<void>(`/meditation/admin/program/${programId}`, request)

export const deleteProgram = (programId: number) =>
  apiClient.delete(`/meditation/admin/program/${programId}`)

export const getProgramApplications = (programId: number) =>
  apiClient.get<ProgramApplicationResponse[]>(`/meditation/admin/program/${programId}/applications`)
