type StatusBadgeProps = { available?: boolean; status?: 'RESERVED' | 'CANCELLED' }
export function StatusBadge({ available, status }: StatusBadgeProps) {
  const isAvailable = available ?? status === 'RESERVED'
  const text = available === undefined ? (status === 'RESERVED' ? '예약 완료' : '취소 완료') : isAvailable ? '예약 가능' : '예약 마감'
  return <span className={`inline-flex h-fit border px-[7px] py-1 text-[11px] ${isAvailable ? 'border-gold-300 text-[#a6874f]' : 'border-border-subtle text-[#8f969b]'}`}>{text}</span>
}
