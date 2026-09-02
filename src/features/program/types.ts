// src/types/meditation.ts

export type ProgramStatus = "OPEN" | "CLOSED";

export interface ProgramResponse {
  id: number;
  name: string;
  pictureUrl: string | null;
  capacity: number;
  remain: number;
  status: ProgramStatus;
}

export interface ProgramCreateRequest {
  name: string;
  pictureUrl?: string;
  capacity: number;
}

export interface ReservationRequest {
  programId: number;
  quantity: number;
}

export interface ReviewResponse {
  id: number;
  programName: string;
  memberName: string; // 백엔드 필드명 그대로 유지. userName으로 바뀌면 여기도 수정 필요
  content: string;
  createdAt: string; // LocalDateTime은 JSON에서 ISO 문자열로 옴 (예: "2026-09-01T10:30:00")
}

export interface ReviewCreateRequest {
  programReservationId: number;
  content: string;
}