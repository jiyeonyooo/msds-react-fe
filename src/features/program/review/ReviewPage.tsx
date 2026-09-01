// src/pages/ReviewPage.tsx
import { useEffect, useState } from "react";
import { getReviews, addReview, deleteReview } from "./review.ts";
import { ApiError } from "../client.ts";
import type { ReviewResponse } from "../types.ts";

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reservationId, setReservationId] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    getReviews()
      .then(setReviews)
      .catch(() => setError("후기 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedId = Number(reservationId);
    if (!parsedId || !content.trim()) {
      setError("예약 번호와 후기 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await addReview({ programReservationId: parsedId, content: content.trim() });
      setReservationId("");
      setContent("");
      loadReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("후기 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    setError(null);
    try {
      await deleteReview(reviewId);
      loadReviews();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("후기 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div>
      <h1>프로그램 후기 게시판</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            예약 번호
            <input
              type="number"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              placeholder="내 예약 ID"
            />
          </label>
        </div>
        <div>
          <label>
            후기 내용
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="프로그램은 어떠셨나요?"
            />
          </label>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "등록 중..." : "후기 작성"}
        </button>
      </form>

      <hr />

      {loading && <p>불러오는 중...</p>}
      {!loading && reviews.length === 0 && <p>등록된 후기가 없습니다.</p>}

      <ul>
        {reviews.map((r) => (
          <li key={r.id}>
            <strong>[{r.programName}]</strong> {r.memberName} —{" "}
            {new Date(r.createdAt).toLocaleDateString()}
            <p>{r.content}</p>
            <button onClick={() => handleDelete(r.id)}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}