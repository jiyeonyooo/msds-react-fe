// review.ts
import { authApiClient, publicApiClient } from "../../../lib/apiClient.ts";
import type { ApiResponse, ReviewResponse, ReviewCreateRequest } from "../types.ts";

export const getReviews = async (): Promise<ReviewResponse[]> => {
  const res = await publicApiClient.get<ApiResponse<ReviewResponse[]>>("/meditation/review");
  return res.data.data;
};

export const getMyReviews = async (): Promise<ReviewResponse[]> => {
  const res = await authApiClient.get<ApiResponse<ReviewResponse[]>>("/meditation/review/me");
  return res.data.data;
};

export const addReview = async (request: ReviewCreateRequest): Promise<number> => {
  const res = await authApiClient.post<ApiResponse<number>>("/meditation/review", request);
  return res.data.data;
};

export const deleteReview = async (reviewId: number): Promise<void> => {
  await authApiClient.delete<ApiResponse<void>>(`/meditation/review/${reviewId}`);
};