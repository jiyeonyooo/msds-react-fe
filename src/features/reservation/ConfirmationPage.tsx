import { useEffect, useState } from 'react'
import { Button } from '../../components/ui'
import { navigate } from '../../lib/navigation'
import { showToast } from '../../lib/toast'
import { clearSelectedRoom } from './bookingStore'
import { ApiError, reservationApi } from './api'
import type { AvailableRoom } from './types'

const won = (v: number) => `${v.toLocaleString('ko-KR')}원`
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

export function ConfirmationPage() {
  const q = new URLSearchParams(location.search)
  const roomId = Number(q.get('room_id')); const checkIn = q.get('check_in_date') ?? ''; const checkOut = q.get('check_out_date') ?? ''; const guests = Number(q.get('guest_count'))
  const invalid = !Number.isInteger(roomId) || roomId < 1 || !checkIn || checkIn < today || !checkOut || checkOut <= checkIn || !Number.isInteger(guests) || guests < 1
  const [room, setRoom] = useState<AvailableRoom | null>(null)
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (invalid) return
    void reservationApi.availability({ check_in_date: checkIn, check_out_date: checkOut, guest_count: guests }).then((result) => { const selected = result.rooms.find((item) => item.room_id === roomId); if (!selected || !selected.available) setError('선택한 객실은 현재 예약할 수 없습니다.'); else setRoom(selected) }).catch((e: ApiError) => setError(e.message))
  }, [roomId, checkIn, checkOut, guests, invalid])
  async function create() {
    if (!room) return
    setSaving(true)
    try { const saved = await reservationApi.create({ room_id: roomId, check_in_date: checkIn, check_out_date: checkOut, guest_count: guests }); clearSelectedRoom(); showToast('예약이 확정되었습니다. 마이페이지에서 확인할 수 있습니다.'); navigate(`/my-reservations/${saved.resv_id}`) }
    catch (e) { const err = e as ApiError; if (err.status === 401) { sessionStorage.setItem('return_path', location.pathname + location.search); showToast('로그인 후 예약을 이어서 진행할 수 있습니다.'); navigate('/login') } else if (err.code === 'ROOM_NOT_AVAILABLE') { setError('방금 다른 예약이 발생했습니다. 예약 가능 객실을 다시 조회해 주세요.'); showToast('방금 다른 예약이 먼저 처리되었습니다.', 'error') } else { setError(err.message); showToast(err.message, 'error') } }
    finally { setSaving(false) }
  }
  const displayError = invalid ? '예약 정보가 올바르지 않습니다.' : error
  return <main className="mx-auto max-w-[850px] px-6 pt-[58px] pb-[110px] md:pt-[90px]">
    <Button className="mb-[25px]" variant="text" onClick={() => navigate('/reservations')}>← 객실 목록으로</Button>
    <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">CONFIRM YOUR STAY</p><h1>예약을 확인해 주세요</h1>
    {displayError ? <><p className="mt-[14px] text-[13px] text-error">{displayError}</p><Button onClick={() => navigate('/reservations')}>예약 다시 조회</Button></> : !room ? <p>예약 정보를 불러오는 중입니다…</p> : <section className="mt-[38px] grid grid-cols-[1fr_auto] gap-[18px] border border-border-subtle bg-white p-[26px]"><div><span className="text-[11px] font-medium tracking-[0.17em]">SELECTED ROOM TYPE</span><h2 className="my-[7px] font-display text-[23px] font-medium">{room.room_name}</h2><p>{room.description}</p></div><dl className="col-span-2 grid grid-cols-2 gap-2.5 border-t border-[#eee9e0] pt-4 text-xs [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-muted"><dt>체크인</dt><dd>{checkIn}</dd><dt>체크아웃</dt><dd>{checkOut}</dd><dt>숙박 일수 / 인원</dt><dd>{room.nights}박 / 성인 {guests}명</dd><dt>1박 기준가</dt><dd>{won(room.base_price)}</dd><dt>총 예약 금액</dt><dd className="text-gold-500">{won(room.total_price)}</dd></dl><p>예약이 확정되면 이용 가능한 개별 객실은 서버에서 배정합니다.</p><Button disabled={saving} onClick={() => void create()}>{saving ? '예약 처리 중…' : '예약 확정'}</Button></section>}
  </main>
}
