import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { AccountLayout } from '../account/AccountLayout'
import { inquiryApi } from './api'
import { InquiryStatusBadge } from './InquiryStatusBadge'
import type { Inquiry } from './types'

/** 내 문의 목록. GET /api/inquiries */
export function InquiryListPage() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void inquiryApi
      .mine()
      .then((response) => setInquiries(response.data))
      .catch((cause) => setError((cause as ApiError).message))
  }, [])

  return (
    <AccountLayout
      description="머무름에 대해 남기신 문의와 답변을 한 곳에서 확인하실 수 있습니다."
      eyebrow="MEMBER SUPPORT"
      title="문의 내역"
    >
      <article className="rounded-xl border border-border-subtle bg-white px-8 py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
              문의 내역
            </h2>
            <p className="text-[10px] tracking-[0.08em] text-muted">
              답변이 등록되면 상태가 ANSWERED로 바뀝니다.
            </p>
          </div>
          {/* 작성 버튼은 히어로가 아니라 목록 바로 위에 둔다. 목록을 훑다가 바로 누를 수 있어야 한다. */}
          <div className="flex items-center gap-4">
            <p className="text-xs text-secondary">
              {inquiries ? `총 ${inquiries.length}건` : '불러오는 중…'}
            </p>
            <Link to="/inquiries/new">
              <Button size="sm">새 문의 작성</Button>
            </Link>
          </div>
        </div>
        <span className="my-4 block h-px w-full bg-border-subtle" />
        {error && (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        {inquiries?.length === 0 && (
          <div className="grid justify-items-center gap-5 border border-dashed border-gold-300 px-6 py-14 text-center">
            <p className="text-sm leading-loose text-muted">
              아직 남기신 문의가 없습니다. 궁금한 점을 편하게 남겨 주세요.
            </p>
            <Link to="/inquiries/new">
              <Button size="sm">첫 문의 남기기</Button>
            </Link>
          </div>
        )}
        {inquiries && inquiries.length > 0 && (
          <ul className="grid gap-3">
            {inquiries.map((inquiry) => (
              <li key={inquiry.inquiryId}>
                <Link
                  className="flex flex-col gap-2 rounded-md border border-border-subtle px-5 py-4 transition hover:border-gold-300 md:flex-row md:items-center md:gap-5"
                  to={`/inquiries/${inquiry.inquiryId}`}
                >
                  <InquiryStatusBadge status={inquiry.status} />
                  <strong className="flex-1 text-[15px] font-medium text-navy-900">
                    {inquiry.title}
                  </strong>
                  <span className="text-xs text-muted">{inquiry.createdAt}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </AccountLayout>
  )
}
