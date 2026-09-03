import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../lib/apiError'
import { AccountLayout } from '../account/AccountLayout'
import { AccountEmptyState, AccountPanel, AccountPanelAction } from '../account/AccountPanel'
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
      <AccountPanel
        action={<AccountPanelAction to="/inquiries/new">새 문의 작성</AccountPanelAction>}
        meta={
          inquiries
            ? `총 ${inquiries.length}건 · 답변이 등록되면 상태가 ANSWERED로 바뀝니다.`
            : '불러오는 중…'
        }
        title="문의 목록"
      >
        {error && (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        {inquiries?.length === 0 && (
          <AccountEmptyState
            actionLabel="첫 문의 남기기"
            actionTo="/inquiries/new"
            message="아직 남기신 문의가 없습니다. 궁금한 점을 편하게 남겨 주세요."
          />
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
      </AccountPanel>
    </AccountLayout>
  )
}
