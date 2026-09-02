import { type FormEvent, type ReactNode, useState } from 'react'
import {
  BookingField,
  Button,
  RoomMediaCard,
  Select,
  StatusBadge,
  TextInput,
} from '../../components/ui'
import { navigate } from '../../lib/navigation'
import type { AvailabilityRequest } from './types'
import { useReservationAvailability } from './hooks'

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
const initialForm: AvailabilityRequest = {
  check_in_date: today,
  check_out_date: '',
  guest_count: 2,
}

export function ReservationPage() {
  const [form, setForm] = useState(initialForm)
  const {
    rooms,
    errors,
    loading,
    message,
    setErrors,
    setMessage,
    search: searchAvailability,
  } = useReservationAvailability()
  const update = <K extends keyof AvailabilityRequest>(key: K, value: AvailabilityRequest[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setMessage('')
  }
  async function search(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.check_in_date < today)
      next.check_in_date = '체크인은 오늘 또는 이후 날짜를 선택해 주세요.'
    if (!form.check_out_date || form.check_out_date <= form.check_in_date)
      next.check_out_date = '체크아웃은 체크인 이후 날짜여야 합니다.'
    if (form.guest_count < 1) next.guest_count = '투숙 인원은 1명 이상이어야 합니다.'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    await searchAvailability(form)
  }
  const ready = Boolean(form.check_in_date && form.check_out_date && form.guest_count >= 1)
  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">MAKE A RESERVATION</p>
      <h1 className="my-2.5 font-display text-[52px] leading-[0.95] tracking-[-0.125rem] md:text-[62px]">
        예약하기
      </h1>
      <p className="text-sm text-muted">원하시는 머무름의 시간과 인원을 선택해 주세요.</p>
      <form
        className="mt-[38px] grid grid-cols-1 gap-3 border border-border-subtle bg-white p-[26px] md:grid-cols-[1fr_1fr_1fr_auto]"
        onSubmit={search}
        noValidate
      >
        <Field label="CHECK-IN" error={errors.check_in_date}>
          <TextInput
            aria-invalid={Boolean(errors.check_in_date)}
            className="border-0 bg-transparent p-0"
            type="date"
            min={today}
            value={form.check_in_date}
            onChange={(event) => update('check_in_date', event.target.value)}
          />
        </Field>
        <Field label="CHECK-OUT" error={errors.check_out_date}>
          <TextInput
            aria-invalid={Boolean(errors.check_out_date)}
            className="border-0 bg-transparent p-0"
            type="date"
            min={form.check_in_date}
            value={form.check_out_date}
            onChange={(event) => update('check_out_date', event.target.value)}
          />
        </Field>
        <Field label="GUESTS" error={errors.guest_count}>
          <Select
            aria-invalid={Boolean(errors.guest_count)}
            className="border-0 bg-transparent p-0"
            value={form.guest_count}
            onChange={(event) => update('guest_count', Number(event.target.value))}
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                성인 {count}명
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={loading || !ready}>
          {loading ? '조회 중…' : '예약 가능 객실 보기'}
        </Button>
      </form>
      {message && (
        <p className="mt-[14px] text-[13px] text-error" role="alert">
          {message}
        </p>
      )}
      {rooms?.length === 0 && (
        <div className="mt-[30px] border border-dashed border-gold-300 px-6 py-[70px] text-center leading-loose text-muted">
          예약 가능한 객실 유형이 없습니다. 다른 날짜를 선택해 주세요.
        </div>
      )}
      {rooms && rooms.length > 0 && (
        <section className="mt-[72px]">
          <div className="mb-7 flex items-end justify-between border-b border-gold-300 max-md:block">
            <div>
              <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">
                AVAILABILITY
              </p>
              <h2 className="my-[22px] font-display text-[34px] leading-[1.15] tracking-[0.3px]">
                {form.check_in_date.replaceAll('-', '.')} —{' '}
                {form.check_out_date.replaceAll('-', '.')}
              </h2>
            </div>
            <p>표시된 금액과 잔여 객실은 서버 기준입니다. 예약 생성 시 다시 확인됩니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3 md:gap-5">
            {rooms.map((room) => (
              <RoomMediaCard
                key={room.room_id}
                name={room.room_name}
                description={room.description ?? '고요한 휴식을 위한 객실입니다.'}
                imageUrl={room.image_url}
                badge={<StatusBadge available={room.available} />}
                footer={
                  <>
                    <small className="text-[11px] text-muted">
                      남은 객실 {room.remaining_count}개
                    </small>
                    <Button
                      disabled={!room.available}
                      onClick={() =>
                        navigate(
                          `/reservations/confirm?room_id=${room.room_id}&check_in_date=${form.check_in_date}&check_out_date=${form.check_out_date}&guest_count=${form.guest_count}`,
                        )
                      }
                    >
                      이 객실 예약
                    </Button>
                  </>
                }
              >
                <dl className="grid grid-cols-2 gap-2.5 border-t border-[#eee9e0] pt-4 text-xs [&_dd]:m-0 [&_dd]:text-right [&_dt]:text-muted">
                  <dt>최대 인원</dt>
                  <dd>{room.max_guest_count}명</dd>
                  <dt>숙박 일수</dt>
                  <dd>{room.nights}박</dd>
                  <dt>1박 기준가</dt>
                  <dd>{won(room.base_price)}</dd>
                  <dt>총 예약 금액</dt>
                  <dd className="m-0 text-right text-gold-500">{won(room.total_price)}</dd>
                </dl>
              </RoomMediaCard>
            ))}
          </div>
        </section>
      )}
      {!loading && !message && rooms === null && (
        <p className="my-[45px] text-sm text-muted">
          날짜와 인원을 입력하면 예약 가능한 객실 유형을 안내합니다.
        </p>
      )}
    </main>
  )
}
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <BookingField label={label}>{children}</BookingField>
      {error && (
        <p className="mt-1 text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
