import type { InquiryStatus } from './types'

// 답변 대기/완료 상태 배지.
export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const answered = status === 'ANSWERED'
  return (
    <span
      className={`inline-flex h-6 w-fit items-center rounded-full px-2.5 text-[10px] font-medium tracking-[0.12em] ${
        answered ? 'bg-gold-500 text-navy-900' : 'bg-subtle text-muted'
      }`}
    >
      {answered ? 'ANSWERED' : 'WAITING'}
    </span>
  )
}
