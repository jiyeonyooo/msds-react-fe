import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../lib/apiError'
import { getAdminInquiries } from './api'
import type { InquiryResponse, InquiryStatus } from './types'

type Filter = 'ALL' | InquiryStatus

function messageFor(error: unknown) {
  if (error instanceof ApiError && error.status === 403) return '관리자 권한이 필요합니다.'
  return error instanceof Error && error.message
    ? error.message
    : '문의 목록을 불러오지 못했습니다.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value.replace(' ', 'T')),
  )
}

export function AdminInquiryListPage() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [inquiries, setInquiries] = useState<InquiryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAdminInquiries(filter === 'ALL' ? undefined : filter)
      .then((items) => active && setInquiries(items))
      .catch((loadError: unknown) => active && setError(messageFor(loadError)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [filter])

  return (
    <main className="px-6 py-10 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-medium tracking-[0.18em] text-gold-500">
            CUSTOMER SUPPORT
          </p>
          <h1 className="mt-2 font-display text-[38px] leading-none text-navy-900">문의 관리</h1>
          <p className="mt-3 text-sm text-ink-700">고객 문의를 확인하고 답변 상태를 관리합니다.</p>
        </div>
        <div
          className="flex rounded-sm border border-gold-300 bg-white p-1"
          aria-label="문의 상태 필터"
        >
          {(['ALL', 'WAITING', 'ANSWERED'] as const).map((status) => (
            <button
              className={`px-4 py-2 text-[10px] font-medium tracking-[0.08em] ${filter === status ? 'bg-navy-900 text-white' : 'text-ink-700'}`}
              key={status}
              onClick={() => {
                setLoading(true)
                setError('')
                setFilter(status)
              }}
              type="button"
            >
              {status === 'ALL' ? '전체' : status === 'WAITING' ? '답변 대기' : '답변 완료'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p
          className="mt-6 border border-error-border bg-[#f8eeeb] p-4 text-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <section className="mt-8 overflow-hidden rounded-lg border border-gold-300 bg-white">
        <div className="grid grid-cols-[110px_1fr_150px] border-b border-gold-300 bg-subtle px-6 py-4 text-[10px] font-medium tracking-[0.12em] text-ink-700 max-sm:hidden">
          <span>STATUS</span>
          <span>INQUIRY</span>
          <span>CREATED</span>
        </div>
        {loading ? (
          <p className="p-10 text-center text-sm text-ink-500">문의를 불러오는 중입니다…</p>
        ) : inquiries.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-500">조건에 맞는 문의가 없습니다.</p>
        ) : (
          inquiries.map((inquiry) => (
            <Link
              className="grid gap-3 border-b border-border-subtle px-6 py-5 transition last:border-b-0 hover:bg-subtle sm:grid-cols-[110px_1fr_150px] sm:items-center"
              key={inquiry.inquiryId}
              to={`/admin/inquiries/${inquiry.inquiryId}`}
            >
              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-medium ${inquiry.status === 'WAITING' ? 'border-gold-300 text-gold-500' : 'border-[#bfd0bd] text-[#486043]'}`}
              >
                {inquiry.status === 'WAITING' ? '답변 대기' : '답변 완료'}
              </span>
              <span>
                <strong className="block font-display text-xl font-medium text-navy-900">
                  {inquiry.title}
                </strong>
                <span className="mt-1 block text-xs text-ink-500">{inquiry.authorEmail}</span>
              </span>
              <span className="text-xs text-ink-500">{formatDate(inquiry.createdAt)}</span>
            </Link>
          ))
        )}
      </section>
    </main>
  )
}
