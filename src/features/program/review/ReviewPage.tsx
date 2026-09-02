import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { useSession } from '../../auth/useSession'
import { ApiError } from '../client'
import { getMyProgramReservations } from '../program'
import type { ProgramReservationResponse, ReviewResponse } from '../types'
import { addReview, deleteReview, getReviews } from './review'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date(value))
}

export default function ReviewPage() {
  const session = useSession()
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [reservations, setReservations] = useState<ProgramReservationResponse[]>([])
  const [reservationId, setReservationId] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refreshReviews = async () => setReviews(await getReviews())

  useEffect(() => {
    let active = true
    Promise.all([
      getReviews(),
      session ? getMyProgramReservations() : Promise.resolve([] as ProgramReservationResponse[]),
    ])
      .then(([reviewList, reservationList]) => {
        if (!active) return
        setReviews(reviewList)
        setReservations(reservationList)
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error && loadError.message
              ? loadError.message
              : '후기 정보를 불러오지 못했습니다.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session])

  const reviewedReservationIds = useMemo(
    () => new Set(reviews.map((review) => review.programReservationId)),
    [reviews],
  )
  const availableReservations = reservations.filter(
    (reservation) =>
      reservation.status === 'RESERVED' && !reviewedReservationIds.has(reservation.reservationId),
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const parsedReservationId = Number(reservationId)
    if (!parsedReservationId || !content.trim()) {
      setError('후기를 작성할 프로그램과 내용을 모두 입력해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      await addReview({
        programReservationId: parsedReservationId,
        content: content.trim(),
      })
      await refreshReviews()
      setReservationId('')
      setContent('')
      setNotice('후기가 등록되었습니다.')
    } catch (submitError) {
      setError(
        submitError instanceof ApiError && submitError.message
          ? submitError.message
          : '후기를 등록하지 못했습니다.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (review: ReviewResponse) => {
    if (!window.confirm(`‘${review.programName}’ 후기를 삭제하시겠습니까?`)) return
    setError('')
    setNotice('')
    try {
      await deleteReview(review.id)
      await refreshReviews()
      setNotice('후기가 삭제되었습니다.')
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError && deleteError.message
          ? deleteError.message
          : '후기를 삭제하지 못했습니다.',
      )
    }
  }

  return (
    <main>
      <section className="bg-[#f4f1ea] px-6 py-16 md:px-[100px] md:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
              GUEST REFLECTIONS
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[52px] leading-[0.95] font-semibold text-navy-900 md:text-[72px]">
              Small moments,
              <br />
              quietly remembered.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-7 text-ink-500">
            MSDS에서 경험한 고요와 변화를 나눠주세요. 프로그램에 참여한 회원만 후기를 작성할 수
            있습니다.
          </p>
        </div>
      </section>

      <section className="bg-[#fbfaf6] px-6 py-14 md:px-[100px]">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[380px_1fr]">
          <aside className="h-fit rounded-lg border border-[#d8d0c2] bg-white p-6 lg:sticky lg:top-24">
            <p className="text-[10px] font-medium tracking-[0.15em] text-gold-500">
              WRITE A REVIEW
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">당신의 고요를 들려주세요.</h2>
            {!session ? (
              <div className="mt-6 border-t border-[#e5dfd4] pt-6">
                <p className="text-sm leading-6 text-ink-500">후기 작성은 로그인 후 가능합니다.</p>
                <Link
                  className="mt-5 inline-flex min-h-11 items-center bg-navy-900 px-6 text-xs font-medium text-white"
                  to="/login"
                >
                  로그인하기
                </Link>
              </div>
            ) : availableReservations.length === 0 ? (
              <div className="mt-6 border-t border-[#e5dfd4] pt-6">
                <p className="text-sm leading-6 text-ink-500">
                  후기를 작성할 수 있는 프로그램 신청 내역이 없습니다.
                </p>
                <Link
                  className="mt-4 inline-block text-xs underline underline-offset-4"
                  to="/my-programs"
                >
                  내 프로그램 신청 보기 →
                </Link>
              </div>
            ) : (
              <form
                className="mt-6 space-y-5 border-t border-[#e5dfd4] pt-6"
                onSubmit={handleSubmit}
              >
                <label className="block text-xs font-medium text-ink-700">
                  참여 프로그램
                  <select
                    className="mt-2 h-11 w-full rounded-sm border border-[#cfc7ba] bg-white px-3 text-sm"
                    onChange={(event) => setReservationId(event.target.value)}
                    required
                    value={reservationId}
                  >
                    <option value="">프로그램을 선택하세요</option>
                    {availableReservations.map((reservation) => (
                      <option key={reservation.reservationId} value={reservation.reservationId}>
                        {reservation.programName} · {reservation.quantity}명
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-ink-700">
                  후기 내용
                  <textarea
                    className="mt-2 min-h-36 w-full resize-y rounded-sm border border-[#cfc7ba] p-3 text-sm leading-6"
                    maxLength={1000}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="프로그램에서 느낀 점을 남겨주세요."
                    required
                    value={content}
                  />
                </label>
                <div className="flex items-center justify-between text-[10px] text-ink-500">
                  <span>솔직하고 따뜻한 경험을 나눠주세요.</span>
                  <span>{content.length}/1000</span>
                </div>
                <Button className="w-full" disabled={submitting} type="submit">
                  {submitting ? '등록 중…' : '후기 등록'}
                </Button>
              </form>
            )}
            {notice && (
              <p className="mt-5 text-sm text-[#4f6b48]" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="mt-5 text-sm text-error" role="alert">
                {error}
              </p>
            )}
          </aside>

          <div>
            <div className="flex items-end justify-between border-b border-[#cfc7ba] pb-5">
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] text-gold-500">
                  ALL STORIES
                </p>
                <h2 className="mt-2 font-display text-4xl font-semibold">Guest reviews</h2>
              </div>
              <p className="text-xs text-ink-500">{reviews.length} REVIEWS</p>
            </div>

            {loading ? (
              <p className="py-12 text-sm text-ink-500">후기를 불러오는 중입니다…</p>
            ) : reviews.length === 0 ? (
              <div className="border-b border-[#e5dfd4] py-16 text-center text-sm text-ink-500">
                아직 등록된 후기가 없습니다. 첫 이야기를 남겨주세요.
              </div>
            ) : (
              <div>
                {reviews.map((review) => (
                  <article className="border-b border-[#e5dfd4] py-8" key={review.id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-medium tracking-[0.14em] text-gold-500">
                          {review.programName.toUpperCase()}
                        </p>
                        <h3 className="mt-2 font-display text-2xl font-semibold">
                          {review.userName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] tracking-[0.04em] text-ink-500">
                          {formatDate(review.createdAt)}
                        </p>
                        {session?.user?.userId === review.userId && (
                          <button
                            className="mt-2 text-[11px] text-error underline underline-offset-4"
                            onClick={() => void handleDelete(review)}
                            type="button"
                          >
                            후기 삭제
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-ink-700">
                      {review.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
