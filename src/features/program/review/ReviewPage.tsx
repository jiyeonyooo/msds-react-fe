// ReviewPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { getReviews, addReview, deleteReview, getMyReviews } from './review.ts'
import { getMyReservations } from '../program.ts'
import { ApiError } from '../../../lib/apiError'
import type { ReviewResponse, ReservationResponse } from '../types.ts'

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [myReservations, setMyReservations] = useState<ReservationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [myReviewIds, setMyReviewIds] = useState<Set<number>>(new Set())

  // ReviewPage.tsx 수정
const loadAll = useCallback(() => {
  setLoading(true)
  Promise.all([getReviews(), getMyReservations(), getMyReviews()])
    .then(([reviewData, reservationData, myReviewData]) => {
      setReviews(reviewData)
      setMyReservations(reservationData)
      setMyReviewIds(new Set(myReviewData.map((r) => r.id)))
    })
    .catch(() => setError('목록을 불러오지 못했습니다.'))
    .finally(() => setLoading(false))
}, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 취소되지 않았고, 아직 리뷰를 안 쓴 예약만 작성 가능한 목록으로 보여준다
  const writableReservations = myReservations.filter((r) => r.status === 'RESERVED' && !r.hasReview)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedReservationId || !content.trim()) {
      setError('예약을 선택하고 후기 내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      await addReview({ programReservationId: selectedReservationId, content: content.trim() })
      setSelectedReservationId(null)
      setContent('')
      loadAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '후기 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: number) => {
    setError(null)
    try {
      await deleteReview(reviewId)
      loadAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '후기 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div>
      <h1>프로그램 후기 게시판</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            리뷰를 남길 예약 선택
            <select
              value={selectedReservationId ?? ''}
              onChange={(e) => setSelectedReservationId(Number(e.target.value) || null)}
            >
              <option value="">선택하세요</option>
              {writableReservations.map((r) => (
                <option key={r.reservationId} value={r.reservationId}>
                  {r.programName} — {new Date(r.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
          {writableReservations.length === 0 && (
            <p>리뷰를 남길 수 있는 예약이 없습니다. (예약 후, 취소되지 않은 건에 한해 작성 가능)</p>
          )}
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
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting || writableReservations.length === 0}>
          {submitting ? '등록 중...' : '후기 작성'}
        </button>
      </form>

      <hr />

      {loading && <p>불러오는 중...</p>}
      {!loading && reviews.length === 0 && <p>등록된 후기가 없습니다.</p>}

      <ul>
  {reviews.map((r) => (
    <li key={r.id}>
      <strong>[{r.programName}]</strong> {r.userName} —{' '}
      {new Date(r.createdAt).toLocaleDateString()}
      <p>{r.content}</p>
      {myReviewIds.has(r.id) && <button onClick={() => handleDelete(r.id)}>삭제</button>}
    </li>
  ))}
</ul>
    </div>
  )
}