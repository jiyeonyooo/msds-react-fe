import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { ApiError } from '../../lib/apiError'
import { signOut } from '../auth/api'
import type { UserProfile } from '../auth/types'
import { useSession } from '../auth/useSession'
import { accountApi } from './api'
import { AccountLayout } from './AccountLayout'

const quickLinks = [
  {
    kicker: 'STAY',
    title: '예약 내역',
    description: '지금까지 예약한 머무름과 상태를 확인합니다.',
    to: '/mypage/reservations',
    action: '예약 보기 →',
  },
  {
    kicker: 'INQUIRY',
    title: '문의 남기기',
    description: '머무름에 대해 궁금한 점을 남기면 답변을 보내 드립니다.',
    to: '/inquiries/new',
    action: '문의 작성 →',
  },
  {
    kicker: 'ACCOUNT',
    title: '정보 수정',
    description: '이름과 전화번호를 최신 정보로 유지해 주세요.',
    to: '/mypage/edit',
    action: '정보 수정 →',
  },
]
const dateOf = (value?: string) => value?.slice(0, 10) ?? '-'

/** 마이페이지. GET /api/users/me 로 받은 회원 정보를 보여 준다. */
export function MyPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(session?.user ?? null)
  const [error, setError] = useState('')
  useEffect(() => {
    void accountApi
      .me()
      .then((response) => setProfile(response.data))
      .catch((cause) => setError((cause as ApiError).message))
  }, [])

  const fields = [
    { label: '이름', value: profile?.name ?? '-' },
    { label: '이메일', value: profile?.email ?? '-' },
    { label: '전화번호', value: profile?.phoneNumber ?? '-' },
    { label: '회원 권한', value: profile?.role ?? '-' },
    { label: '가입일', value: dateOf(profile?.createdAt) },
    { label: '최근 수정', value: profile?.updatedAt ?? '-' },
  ]

  return (
    <AccountLayout
      description="예약과 문의 내역을 한 곳에서 확인하고, 회원 정보를 최신 상태로 유지하세요."
      eyebrow="MY PAGE"
      hero={
        <div className="flex w-full items-start gap-5 rounded-xl bg-white p-7 lg:w-[440px]">
          <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-navy-900 text-2xl font-medium text-white">
            {profile?.name?.slice(0, 1) ?? '·'}
          </span>
          <div className="grid gap-1.5">
            <span className="flex h-6 w-fit items-center rounded-full bg-gold-500 px-2.5 text-[10px] font-medium tracking-[0.12em] text-navy-900">
              {profile?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
            </span>
            <strong className="text-xl leading-[30px] font-medium text-navy-900">
              {profile?.name ?? '회원'}님
            </strong>
            <span className="text-[13px] text-secondary">{profile?.email ?? '-'}</span>
            <span className="text-xs text-secondary/70">가입일 {dateOf(profile?.createdAt)}</span>
          </div>
        </div>
      }
      title="나의 고요를 이어가세요"
    >
      <article className="rounded-xl border border-border-subtle bg-white px-8 py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[28px] leading-[34px] font-medium text-navy-900">
              회원정보
            </h2>
            <p className="text-[10px] tracking-[0.08em] text-muted">
              예약 확인과 문의 응대에 사용되는 기본 정보입니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/mypage/edit')} size="sm">
              정보 수정
            </Button>
            <Button onClick={() => navigate('/mypage/delete')} size="sm" variant="secondary">
              회원 탈퇴
            </Button>
          </div>
        </div>
        <span className="my-4 block h-px w-full bg-border-subtle" />
        {error && (
          <p className="mb-4 text-[13px] text-error" role="alert">
            {error}
          </p>
        )}
        <dl className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {fields.map((field) => (
            <div className="grid gap-[7px]" key={field.label}>
              <dt className="text-[11px] font-medium tracking-[0.08em] text-muted">
                {field.label}
              </dt>
              <dd className="m-0 text-[15px] break-all text-navy-900">{field.value}</dd>
            </div>
          ))}
        </dl>
      </article>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {quickLinks.map((link, index) => (
          <article
            className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-white p-6"
            key={link.to}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle font-display text-lg text-gold-500">
              {`0${index + 1}`}
            </span>
            <p className="text-[10px] font-medium tracking-[0.1em] text-gold-500">{link.kicker}</p>
            <h3 className="font-display text-2xl leading-[31px] font-medium text-navy-900">
              {link.title}
            </h3>
            <p className="text-xs leading-5 text-secondary">{link.description}</p>
            <Link className="text-[11px] font-medium tracking-[0.08em] text-navy-900" to={link.to}>
              {link.action}
            </Link>
          </article>
        ))}
      </div>
      <div>
        <button
          className="border-0 bg-transparent p-0 text-xs tracking-[0.06em] text-muted"
          onClick={() => void signOut().then(() => navigate('/'))}
          type="button"
        >
          로그아웃
        </button>
      </div>
    </AccountLayout>
  )
}
