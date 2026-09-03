import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { ApiError } from '../../program/client'
import { answerAdminInquiry, getAdminInquiry } from './api'
import type { InquiryResponse } from './types'

function messageFor(error: unknown) {
  if (error instanceof ApiError && error.status === 403) return '관리자 권한이 필요합니다.'
  if (error instanceof ApiError && error.status === 404) return '존재하지 않는 문의입니다.'
  return error instanceof Error && error.message ? error.message : '요청을 처리하지 못했습니다.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value.replace(' ', 'T')))
}

export function AdminInquiryDetailPage() {
  const inquiryId = Number(useParams().inquiryId)
  const [inquiry, setInquiry] = useState<InquiryResponse | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    if (!Number.isInteger(inquiryId) || inquiryId < 1)
      return () => {
        active = false
      }
    getAdminInquiry(inquiryId)
      .then((item) => {
        if (!active) return
        setInquiry(item)
        setAnswer(item.answerContent ?? '')
      })
      .catch((loadError: unknown) => active && setError(messageFor(loadError)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [inquiryId])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!answer.trim()) {
      setError('답변 내용은 공백일 수 없습니다.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const updated = await answerAdminInquiry(inquiryId, answer.trim())
      setInquiry(updated)
      setAnswer(updated.answerContent ?? '')
      setNotice('답변이 등록되어 고객 문의 내역에 반영되었습니다.')
    } catch (saveError) {
      setError(messageFor(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (!Number.isInteger(inquiryId) || inquiryId < 1)
    return <main className="p-12 text-sm text-error">올바른 문의 번호가 아닙니다.</main>
  if (loading)
    return <main className="p-12 text-sm text-ink-500">문의 내용을 불러오는 중입니다…</main>
  if (!inquiry)
    return (
      <main className="p-12">
        <p className="text-sm text-error">{error}</p>
        <Link className="mt-5 inline-block text-xs underline" to="/admin/inquiries">
          문의 목록으로
        </Link>
      </main>
    )

  const author = inquiry.authorEmail.split('@')[0]
  const answered = inquiry.status === 'ANSWERED'

  return (
    <main className="px-6 pt-[38px] pb-12 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-medium tracking-[0.18em] text-gold-500">
            CUSTOMER SUPPORT
          </p>
          <h1 className="mt-2 font-display text-[38px] leading-none text-navy-900">
            문의 상세 및 답변
          </h1>
          <p className="mt-3 text-sm text-ink-700">
            고객의 문의 내용을 확인하고 정중하고 정확한 답변을 작성합니다.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <code className="rounded-sm border border-gold-300 bg-white px-3 py-2 text-[10px] text-navy-900">
            PATCH /api/admin/inquiries/{'{inquiryId}'}/answer
          </code>
          <Link
            className="inline-flex min-h-11 items-center rounded-sm border border-gold-300 bg-white px-6 text-xs font-medium"
            to="/admin/inquiries"
          >
            문의 목록
          </Link>
        </div>
      </div>

      {notice && (
        <p
          className="mt-5 border border-[#bfd0bd] bg-[#eef4ec] px-4 py-3 text-sm text-[#486043]"
          role="status"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          className="mt-5 border border-error-border bg-[#f8eeeb] px-4 py-3 text-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,648px)_minmax(360px,412px)]">
        <section className="overflow-hidden rounded-lg border border-gold-300 bg-white">
          <header className="flex h-[74px] items-center justify-between border-b border-gold-300 bg-subtle px-7">
            <h2 className="text-base font-medium">문의 내용</h2>
            <span
              className={`rounded-full border px-3 py-1.5 text-[10px] font-medium ${answered ? 'border-[#bfd0bd] text-[#486043]' : 'border-gold-300 text-gold-500'}`}
            >
              {answered ? '답변 완료' : '답변 대기'}
            </span>
          </header>
          <div className="min-h-[170px] px-7 py-6">
            <p className="text-[10px] font-medium tracking-[0.14em] text-gold-500">WRITTEN BY</p>
            <p className="mt-2 text-xs text-ink-700">
              {author} · {formatDate(inquiry.createdAt)}
            </p>
            <h3 className="mt-3 font-display text-[27px] leading-tight text-navy-900">
              {inquiry.title}
            </h3>
          </div>
          <div className="px-7 py-6">
            <p className="text-[13px] font-medium">질문 내용</p>
            <p className="mt-4 min-h-[236px] whitespace-pre-wrap rounded-[5px] border border-gold-300 bg-subtle p-[22px] text-sm leading-[1.75] text-navy-900">
              {inquiry.content}
            </p>
          </div>
          <div className="min-h-[168px] bg-subtle px-7 py-[22px]">
            <p className="text-[10px] font-medium tracking-[0.13em] text-gold-500">
              ANSWER SAFEGUARDS
            </p>
            <p className="mt-3 text-sm font-medium">답변 전 확인</p>
            <ul className="mt-3 space-y-1 text-xs leading-[1.75] text-ink-700">
              <li>• 의료적 진단이나 치료를 단정하는 표현은 사용하지 않습니다.</li>
              <li>• 실제 숙소 운영 정책과 프로그램 범위 안에서 안내합니다.</li>
              <li>• 고객의 개인정보는 답변에 다시 노출하지 않습니다.</li>
            </ul>
          </div>
        </section>

        <form
          className="overflow-hidden rounded-lg border border-gold-300 bg-white"
          onSubmit={submit}
        >
          <header className="flex h-[74px] items-center justify-between border-b border-gold-300 bg-subtle px-6">
            <h2 className="text-base font-medium">관리자 답변</h2>
            <span className="rounded-full border border-gold-300 bg-white px-2.5 py-1.5 text-[10px] text-gold-500">
              필수
            </span>
          </header>
          <div className="p-6">
            <label className="text-[13px] font-medium" htmlFor="answer-content">
              답변 내용 *
            </label>
            <p className="mt-3 text-[11px] leading-[1.55] text-ink-700">
              고객이 이해하기 쉬운 문장으로 실제 운영 범위 안에서 안내해 주세요.
            </p>
            <textarea
              className="mt-3 h-[338px] w-full resize-none rounded-[5px] border border-gold-300 p-[18px] text-[13px] leading-[1.7] outline-none focus:border-gold-500"
              id="answer-content"
              maxLength={2000}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={
                '답변 내용을 입력해 주세요.\n\n예: 안녕하세요. MSDS의 디지털 디톡스 프로그램은 원하시는 숙박객이 자율적으로 참여할 수 있도록 운영하고 있습니다…'
              }
              value={answer}
            />
            <p className="mt-2 text-[11px] text-gold-500">
              {answer.trim() ? `${answer.length}/2000` : '답변 내용은 공백일 수 없습니다.'}
            </p>
          </div>
          <div className="border-y border-gold-300 bg-subtle px-6 py-5">
            <p className="text-[9px] font-medium tracking-[0.14em] text-gold-500">SUBMISSION</p>
            <p className="mt-2 text-xs font-medium">등록 즉시 고객 문의 내역에 표시됩니다.</p>
            <p className="mt-1.5 text-[11px] text-ink-700">
              오탈자와 운영 정책을 한 번 더 확인해 주세요.
            </p>
          </div>
          <div className="flex min-h-[104px] items-center justify-end gap-3 px-6">
            <Button
              onClick={() => setAnswer(inquiry.answerContent ?? '')}
              type="button"
              variant="secondary"
            >
              답변 취소
            </Button>
            <Button disabled={saving || !answer.trim()} type="submit">
              {saving ? '등록 중…' : answered ? '답변 수정' : '답변 등록'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
