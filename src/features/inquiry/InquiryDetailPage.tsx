import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../lib/apiError'
import { AccountLayout, HeroAction } from '../account/AccountLayout'
import { inquiryApi } from './api'
import { InquiryStatusBadge } from './InquiryStatusBadge'
import type { Inquiry } from './types'

/** 문의 상세. GET /api/inquiries/{inquiryId} (본인 문의만 조회 가능) */
export function InquiryDetailPage() {
  const { inquiryId = '' } = useParams()
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void inquiryApi
      .detail(inquiryId)
      .then((response) => setInquiry(response.data))
      .catch((cause) => setError((cause as ApiError).message))
  }, [inquiryId])

  return (
    <AccountLayout
      description="남기신 문의와 답변 내용을 확인하실 수 있습니다."
      eyebrow="INQUIRY DETAIL"
      hero={<HeroAction badge="LIST" label="목록으로 돌아가기" to="/inquiries" />}
      title="문의 상세"
    >
      <article className="grid gap-[18px] rounded-xl border border-border-subtle bg-white p-9">
        {error && (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        {!inquiry && !error && <p className="text-sm text-muted">불러오는 중…</p>}
        {inquiry && (
          <>
            <div className="grid gap-3">
              <InquiryStatusBadge status={inquiry.status} />
              <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
                {inquiry.title}
              </h2>
              <p className="text-xs text-muted">
                {inquiry.authorEmail} · 작성 {inquiry.createdAt}
              </p>
            </div>
            <span className="h-px w-full bg-border-subtle" />
            <p className="text-sm leading-7 whitespace-pre-wrap text-secondary">
              {inquiry.content}
            </p>
            <div className="grid gap-2 rounded-md bg-subtle px-5 py-[18px]">
              <strong className="text-[13px] font-medium text-navy-900">답변</strong>
              {inquiry.answerContent ? (
                <>
                  <p className="text-xs leading-[22px] whitespace-pre-wrap text-secondary">
                    {inquiry.answerContent}
                  </p>
                  <span className="text-[11px] text-muted">답변 {inquiry.answeredAt}</span>
                </>
              ) : (
                <p className="text-xs leading-[22px] text-secondary">
                  아직 답변이 등록되지 않았습니다. 확인 후 순차적으로 답변 드리겠습니다.
                </p>
              )}
            </div>
          </>
        )}
      </article>
    </AccountLayout>
  )
}
