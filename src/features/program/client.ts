// client.ts
import type { ApiResponse } from "./types.ts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PATCH";
  body?: unknown;
}

// 응답이 ApiResponse<T>로 감싸져 있으므로 data만 꺼내서 반환
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const parsed: ApiResponse<T> | null = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, parsed?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }
  return parsed?.data as T;
}

// Location 헤더가 필요한 POST용 (예약/리뷰 생성)
async function requestWithLocation(path: string, options: RequestOptions = {}): Promise<string | null> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    const parsed: ApiResponse<unknown> | null = text ? JSON.parse(text) : null;
    throw new ApiError(res.status, parsed?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }
  return res.headers.get("Location");
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
  postForLocation: (path: string, body: unknown) => requestWithLocation(path, { method: "POST", body }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};