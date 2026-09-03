// program.ts
import { authApiClient, publicApiClient } from "../../lib/apiClient.ts";
import type { ApiResponse, ProgramResponse, ProgramCreateRequest, ReservationRequest, ReservationResponse, ProgramApplicationResponse, ProgramReservationResponse } from "./types.ts";

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

export const getProgramApplications = async (programId: number): Promise<ProgramApplicationResponse[]> => {
  const res = await authApiClient.get<ApiResponse<ProgramApplicationResponse[]>>(`/meditation/admin/program/${programId}/applications`);
  return res.data.data;
};

export const updateProgram = async (programId: number, request: ProgramCreateRequest): Promise<void> => {
  await authApiClient.patch<ApiResponse<void>>(`/meditation/admin/program/${programId}`, request);
};

export const getMyProgramReservations = async (): Promise<ProgramReservationResponse[]> => {
  const res = await authApiClient.get<ApiResponse<ProgramReservationResponse[]>>("/meditation/program/reservations");
  return res.data.data;
};

export const getProgram = async (programId: number): Promise<ProgramResponse> => {
  const res = await authApiClient.get<ApiResponse<ProgramResponse>>(`/meditation/program/detail/${programId}`);
  return res.data.data;
};

export const uploadProgramImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authApiClient.post<ApiResponse<string>>(
    "/meditation/admin/program/upload-image",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.data; // 예: "/images/uuid.jpg"
};
