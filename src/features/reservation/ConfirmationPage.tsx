import { useEffect, useState } from 'react'
import { navigate } from '../../lib/navigation'
import { ApiError, reservationApi } from './api'
import type { AvailableRoom } from './types'
const won = (v: number) => `${v.toLocaleString('ko-KR')}원`
export function ConfirmationPage() {
  const q = new URLSearchParams(location.search)
  const roomId = Number(q.get('room_id'))
  const checkIn = q.get('check_in_date') ?? ''
  const checkOut = q.get('check_out_date') ?? ''
  const guests = Number(q.get('guest_count'))
  const invalid = !roomId || !checkIn || !checkOut || guests < 1
  const [room, setRoom] = useState<AvailableRoom | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (invalid) return
    void reservationApi
      .availability({ check_in_date: checkIn, check_out_date: checkOut, guest_count: guests })
      .then((rooms) => {
        const selected = rooms.find((item) => item.room_id === roomId)
        if (!selected || !selected.available) setError('선택한 객실은 현재 예약할 수 없습니다.')
        else setRoom(selected)
      })
      .catch((e: ApiError) => setError(e.message))
  }, [roomId, checkIn, checkOut, guests, invalid])
  async function create() {
    if (!room) return
    setSaving(true)
    try {
      const saved = await reservationApi.create({
        room_id: roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count: guests,
      })
      navigate(`/my-reservations/${saved.resv_id}`)
    } catch (e) {
      const err = e as ApiError
      if (err.status === 401) {
        sessionStorage.setItem('return_path', location.pathname + location.search)
        navigate('/login')
      } else if (err.code === 'ROOM_NOT_AVAILABLE') {
        setError('방금 다른 예약이 발생했습니다. 예약 가능 객실을 다시 조회해 주세요.')
      } else setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  const displayError = invalid ? '예약 정보가 올바르지 않습니다.' : error
  return (
    <main className="mx-auto max-w-[850px] px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <button
        className="mb-[25px] border-0 bg-transparent p-0 text-xs tracking-[0.14em] text-msds-muted"
        onClick={() => navigate('/reservations')}
      >
        ← 객실 목록으로
      </button>
      <p className="text-[11px] font-medium tracking-[0.17em] text-msds-gold">CONFIRM YOUR STAY</p>
      <h1>예약을 확인해 주세요</h1>
      {displayError ? (
        <>
          <p className="mt-[14px] text-[13px] text-msds-error">{displayError}</p>
          <button
            className="rounded-msds bg-msds-navy px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-msds-navy-light"
            onClick={() => navigate('/reservations')}
          >
            예약 다시 조회
          </button>
        </>
      ) : !room ? (
        <p>예약 정보를 불러오는 중입니다…</p>
      ) : (
        <section className="mt-[38px] grid grid-cols-[1fr_auto] gap-[18px] border border-msds-border bg-white p-[26px]">
          <div>
            <span className="text-[11px] font-medium tracking-[0.17em]">SELECTED ROOM TYPE</span>
            <h2 className="my-[7px] font-display text-[23px] font-medium">{room.room_name}</h2>
            <p>{room.description}</p>
          </div>
          <dl className="col-span-2 grid grid-cols-2 gap-2.5 border-t border-[#eee9e0] pt-4 text-xs [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-msds-muted">
            <dt>체크인</dt>
            <dd>{checkIn}</dd>
            <dt>체크아웃</dt>
            <dd>{checkOut}</dd>
            <dt>숙박 일수 / 인원</dt>
            <dd>
              {room.nights}박 / 성인 {guests}명
            </dd>
            <dt>1박 기준가</dt>
            <dd>{won(room.base_price)}</dd>
            <dt>총 예약 금액</dt>
            <dd className="text-msds-gold">{won(room.total_price)}</dd>
          </dl>
          <p>예약이 확정되면 이용 가능한 개별 객실은 서버에서 배정합니다.</p>
          <button
            className="rounded-msds bg-msds-navy px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-msds-navy-light disabled:cursor-not-allowed disabled:bg-[#bdbbb6]"
            disabled={saving}
            onClick={() => void create()}
          >
            {saving ? '예약 처리 중…' : '예약 확정'}
          </button>
        </section>
      )}
    </main>
  )
}
