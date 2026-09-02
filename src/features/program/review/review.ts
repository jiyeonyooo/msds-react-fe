// review.ts
import { apiClient } from "../client.ts";
import type { ReviewResponse, ReviewCreateRequest } from "../types.ts";

export const getReviews = () => apiClient.get<ReviewResponse[]>("/meditation/review");

export const addReview = (request: ReviewCreateRequest) =>
  apiClient.postForLocation("/meditation/review", request);

export const deleteReview = (reviewId: number) => apiClient.delete(`/meditation/review/${reviewId}`);