// src/api/program.ts
import { apiClient } from "./client";
import type { ProgramResponse, ProgramCreateRequest, ReservationRequest } from "../types/meditation";

export const getPrograms = () => apiClient.get<ProgramResponse[]>("/meditation/program");

export const reserveProgram = (request: ReservationRequest) =>
  apiClient.postForLocation("/meditation/program", request);

export const cancelReservation = (reservationId: number) =>
  apiClient.delete(`/meditation/program/reservation/${reservationId}`);

// --- 관리자 ---
export const createProgram = (request: ProgramCreateRequest) =>
  apiClient.postForLocation("/meditation/admin/program", request);

export const deleteProgram = (programId: number) =>
  apiClient.delete(`/meditation/admin/program/${programId}`);