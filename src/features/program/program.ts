// program.ts
import { authApiClient, publicApiClient } from "../../lib/apiClient.ts";
import type { ApiResponse, ProgramResponse, ProgramCreateRequest, ReservationRequest, ReservationResponse } from "./types.ts";

export const getPrograms = async (): Promise<ProgramResponse[]> => {
  const res = await publicApiClient.get<ApiResponse<ProgramResponse[]>>("/meditation/program");
  return res.data.data;
};

export const reserveProgram = async (request: ReservationRequest): Promise<number> => {
  const res = await authApiClient.post<ApiResponse<number>>("/meditation/program", request);
  return res.data.data;
};

export const cancelReservation = async (reservationId: number): Promise<void> => {
  await authApiClient.delete<ApiResponse<void>>(`/meditation/program/reservation/${reservationId}`);
};

export const createProgram = async (request: ProgramCreateRequest): Promise<number> => {
  const res = await authApiClient.post<ApiResponse<number>>("/meditation/admin/program", request);
  return res.data.data;
};

export const deleteProgram = async (programId: number): Promise<void> => {
  await authApiClient.delete<ApiResponse<void>>(`/meditation/admin/program/${programId}`);
};

export const getMyReservations = async (): Promise<ReservationResponse[]> => {
  const res = await authApiClient.get<ApiResponse<ReservationResponse[]>>("/meditation/program/reservations/me");
  return res.data.data;
};