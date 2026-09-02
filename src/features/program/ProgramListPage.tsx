import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import morningSilenceImage from '../../assets/program/morning-silence.png'
import { ApiError } from './client'
import { getPrograms } from './program'
import {
  getProgramPresentation,
  type ProgramCategory,
  type ProgramPresentation,
} from './programPresentation'
import type { ProgramResponse } from './types'

const categories: ProgramCategory[] = ['ALL', 'MEDITATION', 'BREATH', 'MOVEMENT']

type PresentedProgram = {
  program: ProgramResponse
  presentation: ProgramPresentation
}

export default function ProgramListPage() {
  const [programs, setPrograms] = useState<ProgramResponse[]>([])
  const [category, setCategory] = useState<ProgramCategory>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPrograms()
      .then((data) => active && setPrograms(data))
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) {
          setError('프로그램 목록을 보려면 먼저 로그인해 주세요.')
          return
        }
        setError(
          err instanceof Error && err.message
            ? err.message
            : '프로그램 목록을 불러오지 못했습니다.',
        )
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const presentedPrograms = useMemo<PresentedProgram[]>(
    () =>
      programs.map((program, index) => ({
        program,
        presentation: getProgramPresentation(program, index),
      })),
    [programs],
  )
  const visiblePrograms = presentedPrograms.filter(
    ({ presentation }) => category === 'ALL' || presentation.category === category,
  )

  return (
    <main>
      <section className="bg-[#fbfaf6]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:min-h-[410px] md:grid-cols-[minmax(0,610px)_minmax(360px,520px)] md:items-center md:justify-between md:px-[100px] md:py-12">
          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#ab854d]">
              MINDFUL PROGRAMS
            </p>
            <h1 className="mt-4 font-display text-[44px] leading-[0.98] font-semibold tracking-[-0.02em] text-[#0b1a2e] md:text-[52px] md:leading-[56px]">
              Practice stillness,
              <br />
              one day at a time.
            </h1>
            <p className="mt-4 text-sm leading-[25px] text-[#3d403d]">
              숙박 중 참여할 수 있는 명상과 호흡, 움직임 프로그램을 만나보세요.
              <br className="hidden sm:block" />
              처음이어도 부담 없이 시작할 수 있도록 단계별로 구성했습니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="프로그램 유형 필터">
              {categories.map((item) => (
                <button
                  className={`min-w-28 rounded-full border px-3.5 py-2 text-left text-[10px] font-medium tracking-[0.11em] transition ${category === item ? 'border-[#0b1a2e] bg-[#0b1a2e] text-white' : 'border-[#c7bfad] text-[#0b1a2e] hover:border-[#0b1a2e]'}`}
                  key={item}
                  onClick={() => setCategory(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <img
            alt="고요한 명상 공간"
            className="h-[260px] w-full rounded-[160px] object-cover md:h-[314px] md:w-[520px]"
            src={morningSilenceImage}
          />
        </div>
      </section>

      <section className="bg-[#f6f3ed] px-6 py-16 md:px-[100px]">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-[#ab854d]">
                CURATED FOR YOUR STAY
              </p>
              <h2 className="mt-7 font-display text-[40px] leading-[46px] font-semibold text-[#0b1a2e]">
                Choose your practice.
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-medium tracking-[0.12em] text-[#3d403d]">
                {visiblePrograms.length} PROGRAMS · UPDATED TODAY
              </p>
              <Link
                className="mt-2 inline-block text-[10px] font-bold tracking-[0.12em] text-[#0b1a2e] hover:text-[#ab854d]"
                to="/reviews"
              >
                GUEST REVIEWS →
              </Link>
            </div>
          </div>

          {loading && (
            <div className="py-28 text-center text-sm text-muted" role="status">
              프로그램을 불러오는 중입니다…
            </div>
          )}
          {!loading && error && (
            <div
              className="mt-10 border border-error-border bg-white px-6 py-14 text-center"
              role="alert"
            >
              <p className="text-sm text-error">{error}</p>
              {error.includes('로그인') ? (
                <Link
                  className="mt-5 inline-block border-b border-navy-900 pb-1 text-xs tracking-[0.08em]"
                  to="/login"
                >
                  로그인하기
                </Link>
              ) : (
                <button
                  className="mt-5 border-b border-navy-900 pb-1 text-xs tracking-[0.08em]"
                  onClick={() => location.reload()}
                  type="button"
                >
                  다시 시도
                </button>
              )}
            </div>
          )}
          {!loading && !error && visiblePrograms.length === 0 && (
            <div className="mt-10 rounded-[14px] border border-dashed border-[#c7bfad] bg-white px-6 py-24 text-center text-sm leading-7 text-muted">
              {programs.length === 0
                ? '현재 등록된 프로그램이 없습니다. 새로운 일정이 열리면 이곳에서 안내해 드립니다.'
                : '선택한 유형의 프로그램이 없습니다.'}
            </div>
          )}

          {!loading && !error && visiblePrograms.length > 0 && (
            <div className="mt-11 grid gap-6 lg:grid-cols-2" aria-label="프로그램 목록">
              {visiblePrograms.map(({ program, presentation }) => (
                <article
                  className="group grid min-h-[300px] overflow-hidden rounded-[14px] border border-[#d1ccbf] bg-white sm:grid-cols-[238px_1fr]"
                  key={program.id}
                >
                  <img
                    alt={`${program.name} 프로그램`}
                    className="h-[240px] w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:h-[300px]"
                    src={program.pictureUrl || presentation.image}
                  />
                  <div className="flex min-w-0 flex-col gap-[11px] px-[26px] py-[26px]">
                    <p className="text-[10px] font-medium tracking-[0.14em] text-[#ab854d]">
                      {presentation.category} · {presentation.level}
                    </p>
                    <h3 className="font-display text-[28px] leading-[33px] font-semibold text-[#0b1a2e]">
                      {program.name}
                    </h3>
                    <p className="text-xs font-medium text-[#0b1a2e]">
                      {presentation.time} · {presentation.duration} · {presentation.location}
                    </p>
                    <p className="text-xs leading-[21px] text-[#3d403d]">
                      {presentation.description}
                    </p>
                    <div className="mt-auto border-t border-[#d1ccbf] pt-[11px]">
                      <p className="text-[11px] font-medium text-[#ab854d]">
                        {presentation.availabilityDay} · {program.remain} SEATS LEFT
                      </p>
                      <Link
                        className="mt-3 inline-block text-[10px] font-bold tracking-[0.12em] text-[#0b1a2e] transition group-hover:text-[#ab854d]"
                        to={`/programs/${program.id}`}
                      >
                        VIEW PROGRAM →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {!loading && !error && presentedPrograms.length > 0 && (
        <section className="bg-[#fbfaf6] px-6 py-16 md:px-[100px]">
          <div className="mx-auto grid max-w-[1240px] gap-10 rounded-[16px] bg-[#f0ede0] px-7 py-9 lg:grid-cols-[330px_1fr] lg:gap-14 lg:px-[42px] lg:py-[38px]">
            <div>
              <p className="text-[11px] font-medium tracking-[0.17em] text-[#ab854d]">
                TODAY · SEP 02
              </p>
              <h2 className="mt-3 font-display text-[38px] leading-[42px] font-semibold text-[#0b1a2e]">
                A gentle rhythm
                <br />
                for your day.
              </h2>
              <p className="mt-3 text-[13px] leading-[23px] text-[#3d403d]">
                원하는 시간에 참여하세요. 모든 프로그램은 숙박객을 위한 소규모 세션으로 운영됩니다.
              </p>
            </div>
            <div className="overflow-hidden rounded-[12px] bg-white">
              {presentedPrograms.slice(0, 4).map(({ program, presentation }) => (
                <Link
                  className="grid min-h-[79px] grid-cols-[72px_1fr_auto] items-center gap-4 border-t border-[#d1ccbf] px-5 first:border-t-0 hover:bg-[#fbfaf6] sm:grid-cols-[88px_1fr_90px] sm:px-6"
                  key={program.id}
                  to={`/programs/${program.id}`}
                >
                  <span className="font-display text-2xl font-semibold text-[#0b1a2e]">
                    {presentation.time}
                  </span>
                  <span>
                    <strong className="block text-[13px] text-[#0b1a2e]">{program.name}</strong>
                    <small className="mt-1 block text-[9px] font-medium tracking-[0.12em] text-[#ab854d]">
                      {presentation.location}
                    </small>
                  </span>
                  <span className="text-right text-[11px] text-[#3d403d]">
                    {program.remain} seats
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
