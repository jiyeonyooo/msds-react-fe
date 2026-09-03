// types.ts (최종)

export type ProgramStatus = "OPEN" | "CLOSED" | "DELETED";

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
  userName: string;
  content: string;
  createdAt: string;
}

export interface ReviewCreateRequest {
  programReservationId: number;
  content: string;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface ReservationResponse {
  reservationId: number;
  programName: string;
  quantity: number;
  status: "RESERVED" | "CANCELLED";
  createdAt: string;
  hasReview: boolean;
}