import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui'
import { ApiError } from './client'
import { getPrograms, reserveProgram } from './program'
import { getProgramPresentation, instructorMark } from './programPresentation'
import type { ProgramResponse } from './types'

const sessionFlow = [
  { number: '01', name: 'ARRIVE', description: '공간과 자세 익히기', duration: '5분' },
  { number: '02', name: 'BREATHE', description: '호흡 명상과 바디스캔', duration: '30분' },
  { number: '03', name: 'RETURN', description: '감각 기록과 마무리', duration: '10분' },
]

const attendanceGuide = [
  { label: 'ARRIVAL', value: '시작 10분 전까지 명상실에 도착해 주세요.' },
  { label: 'WHAT TO WEAR', value: '움직임이 편한 옷과 양말을 권장합니다.' },
  { label: 'WHAT WE PROVIDE', value: '명상 쿠션, 담요, 따뜻한 차를 준비합니다.' },
  { label: 'CANCELLATION', value: '시작 2시간 전까지 무료로 취소할 수 있습니다.' },
  { label: 'ACCESSIBILITY', value: '의자 명상과 편한 자세로 대체할 수 있습니다.' },
]

export default function ProgramDetailPage() {
  const { programId } = useParams()
  const id = Number(programId)
  const invalidId = !Number.isInteger(id) || id < 1
  const [program, setProgram] = useState<ProgramResponse | null>(null)
  const [related, setRelated] = useState<ProgramResponse[]>([])
  const [loading, setLoading] = useState(!invalidId)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(invalidId ? '올바르지 않은 프로그램 번호입니다.' : '')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    if (invalidId) return () => undefined

    getPrograms()
      .then((programs) => {
        if (!active) return
        const selected = programs.find((item) => item.id === id)
        if (!selected) {
          setError('해당 프로그램을 찾을 수 없습니다.')
          return
        }
        setProgram(selected)
        setRelated(programs.filter((item) => item.id !== id).slice(0, 3))
      })
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) {
          setError('프로그램 상세 정보를 보려면 먼저 로그인해 주세요.')
          return
        }
        setError(
          err instanceof Error && err.message
            ? err.message
            : '프로그램 정보를 불러오지 못했습니다.',
        )
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [id, invalidId])

  const handleJoin = async () => {
    if (!program || joining) return
    setJoining(true)
    setError('')
    setNotice('')
    try {
      await reserveProgram({ programId: program.id, quantity: 1 })
      const refreshedPrograms = await getPrograms()
      const refreshed = refreshedPrograms.find((item) => item.id === program.id)
      if (refreshed) setProgram(refreshed)
      setNotice('프로그램 신청이 완료되었습니다. 마이페이지에서 신청 내역을 확인해 주세요.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('프로그램 신청은 로그인 후 이용할 수 있습니다.')
      } else if (err instanceof ApiError) {
        setError(err.message || '프로그램 신청에 실패했습니다.')
      } else {
        setError('프로그램 신청 중 오류가 발생했습니다.')
      }
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center text-sm text-muted" role="status">
        프로그램 정보를 불러오는 중입니다…
      </main>
    )
  }

  if (!program) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 text-center">
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
        {error.includes('로그인') && (
          <Link
            className="mt-5 mr-6 inline-block border-b border-navy-900 pb-1 text-xs"
            to="/login"
          >
            로그인하기
          </Link>
        )}
        <Link className="mt-5 inline-block border-b border-navy-900 pb-1 text-xs" to="/programs">
          프로그램 목록으로 돌아가기
        </Link>
      </main>
    )
  }

  const presentation = getProgramPresentation(program)
  const isClosed = program.status === 'CLOSED' || program.remain < 1

  return (
    <main>
      <section className="bg-[#fbfaf6] px-6 py-12 md:min-h-[330px] md:px-[100px]">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,790px)_380px] lg:justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-[0.14em] text-[#ab854d]">
              PROGRAM / {presentation.category} / {program.name.toUpperCase()}
            </p>
            <h1 className="mt-3 font-display text-[44px] leading-[1.05] font-semibold text-[#0b1a2e] md:text-[50px] md:leading-[56px]">
              {program.name}
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-[#3d403d]">{presentation.description}</p>
            <div className="mt-4 grid gap-3 text-[11px] font-medium tracking-[0.07em] text-[#0b1a2e] sm:grid-cols-2 lg:grid-cols-4">
              <span>
                {presentation.time} · {presentation.duration}
              </span>
              <span>{presentation.location}</span>
              <span>{presentation.level}</span>
              <span>★ 4.9 · 36 REVIEWS</span>
            </div>
          </div>
          <aside className="rounded-[14px] border border-[#d1ccbf] bg-white px-[26px] py-6">
            <p className="text-[10px] font-medium tracking-[0.14em] text-[#ab854d]">NEXT SESSION</p>
            <p className="mt-3 font-display text-[28px] leading-[33px] font-semibold text-[#0b1a2e]">
              Tomorrow · {presentation.time}
            </p>
            <p className="mt-3 text-xs leading-[19px] text-[#3d403d]">
              {program.remain} seats left · 숙박객 무료
            </p>
            <Button
              className="mt-[13px] h-[50px] w-full"
              disabled={isClosed || joining}
              onClick={() => void handleJoin()}
            >
              {joining ? '신청 중…' : isClosed ? 'PROGRAM CLOSED' : 'JOIN PROGRAM'}
            </Button>
            <p className="mt-[13px] text-[10px] leading-[17px] text-[#3d403d]">
              신청 내역은 마이페이지에서 확인할 수 있습니다.
            </p>
            {notice && (
              <p className="mt-3 text-xs leading-5 text-[#4f6b48]" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="mt-3 text-xs leading-5 text-error" role="alert">
                {error}
              </p>
            )}
          </aside>
        </div>
      </section>

      <section className="bg-[#fbfaf6] px-6 py-5 md:px-[100px]">
        <div className="relative mx-auto h-[360px] max-w-[1240px] overflow-hidden rounded-[14px] md:h-[460px]">
          <img
            alt={`${program.name} 명상 공간`}
            className="h-full w-full object-cover"
            src={program.pictureUrl || presentation.heroImage}
          />
          <blockquote className="absolute right-5 bottom-5 max-w-[400px] rounded-[12px] bg-white/92 px-6 py-5 shadow-card backdrop-blur-sm md:right-10 md:bottom-10">
            <p className="text-[10px] font-medium tracking-[0.14em] text-[#ab854d]">
              A QUIET BEGINNING
            </p>
            <p className="mt-2 text-lg leading-7 font-medium text-[#0b1a2e] md:text-xl">
              “고요는 멈춤이 아니라,
              <br />
              나에게 돌아오는 움직임입니다.”
            </p>
          </blockquote>
        </div>
      </section>

      <section className="bg-[#f6f3ed] px-6 py-16 md:px-[100px]">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[minmax(0,790px)_400px] lg:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.17em] text-[#ab854d]">
              ABOUT THIS PRACTICE
            </p>
            <h2 className="mt-6 font-display text-[38px] leading-[44px] font-semibold text-[#0b1a2e]">
              {presentation.aboutTitle}
            </h2>
            <p className="mt-6 text-sm leading-[27px] text-[#3d403d]">{presentation.aboutBody}</p>
            <div className="mt-6 border-t border-[#c7bfad] pt-6">
              <p className="text-[11px] font-medium tracking-[0.17em] text-[#ab854d]">
                SESSION FLOW
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {sessionFlow.map((step) => (
                  <div
                    className="min-h-[140px] rounded-[12px] border border-[#c7bfad] bg-white p-[18px]"
                    key={step.number}
                  >
                    <p className="font-display text-[28px] leading-[31px] font-semibold text-[#ab854d]">
                      {step.number}
                    </p>
                    <p className="mt-2 text-[11px] font-bold tracking-[0.12em] text-[#0b1a2e]">
                      {step.name}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[#3d403d]">
                      {step.description}
                      <br />
                      {step.duration}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-6 rounded-[12px] bg-[#e5e3d4] px-6 py-[22px] sm:flex-row sm:items-center">
              <img alt="명상 가이드 서윤" className="size-[108px]" src={instructorMark} />
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] text-[#ab854d]">
                  YOUR GUIDE
                </p>
                <p className="mt-2 font-display text-[26px] leading-[31px] font-semibold text-[#0b1a2e]">
                  서윤 · Mindfulness Guide
                </p>
                <p className="mt-2 text-xs leading-[21px] text-[#3d403d]">
                  MBSR 기반 마음챙김과 호흡 수련을 안내합니다. 누구나 안전하고 편안하게 참여할 수
                  있는 속도를 가장 중요하게 생각합니다.
                </p>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-[14px] border border-[#c7bfad] bg-white p-7">
            <p className="text-[10px] font-medium tracking-[0.15em] text-[#ab854d]">
              BEFORE YOU JOIN
            </p>
            <h2 className="mt-[18px] font-display text-[32px] leading-[37px] font-semibold text-[#0b1a2e]">
              Good to know
            </h2>
            <div className="mt-[18px] border-t border-[#c7bfad] pt-[18px]">
              {attendanceGuide.map((item) => (
                <div className="mt-[18px] first:mt-0" key={item.label}>
                  <p className="text-[10px] font-medium tracking-[0.13em] text-[#ab854d]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-[21px] text-[#3d403d]">{item.value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-[#fbfaf6] px-6 py-16 md:px-[100px]">
          <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[340px_1fr]">
            <div className="self-center">
              <p className="text-[10px] font-medium tracking-[0.15em] text-[#ab854d]">
                CONTINUE YOUR PRACTICE
              </p>
              <h2 className="mt-4 font-display text-[34px] leading-[39px] font-semibold text-[#0b1a2e]">
                More ways to return to yourself.
              </h2>
              <p className="mt-3 text-xs leading-[21px] text-[#3d403d]">
                호흡, 움직임, 차 명상 등 자신에게 맞는 다음 프로그램을 선택해보세요.
              </p>
              <Link
                className="mt-4 inline-block text-[10px] font-bold tracking-[0.12em] text-[#0b1a2e]"
                to="/programs"
              >
                VIEW ALL PROGRAMS →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((item, index) => {
                const itemPresentation = getProgramPresentation(item, index + 1)
                return (
                  <Link
                    className="overflow-hidden rounded-[12px] border border-[#d1ccbf] bg-white"
                    key={item.id}
                    to={`/programs/${item.id}`}
                  >
                    <img
                      className="h-[156px] w-full object-cover"
                      src={item.pictureUrl || itemPresentation.image}
                      alt=""
                    />
                    <div className="px-3.5 py-3">
                      <h3 className="font-display text-xl leading-6 font-semibold text-[#0b1a2e]">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-[10px] font-medium tracking-[0.09em] text-[#ab854d]">
                        {itemPresentation.time} · {itemPresentation.duration}
                      </p>
                      <p className="mt-1 text-[9px] font-bold tracking-[0.09em] text-[#0b1a2e]">
                        VIEW PROGRAM →
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
