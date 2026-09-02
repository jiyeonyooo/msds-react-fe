import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { wellnessApi } from './api'
import { SectionLabel } from './WellnessShared'
import { categoryCopy, stayStageLabel } from './wellnessFormat'
import type { ResultRouteState, StayStage, WellnessQuestion } from './types'
import { useWellnessMember } from './useWellnessMember'

export function WellnessCheckPage() {
  const { isMember } = useWellnessMember()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<WellnessQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const stayStage: StayStage = isMember ? 'DURING_STAY' : 'GENERAL'

  useEffect(() => {
    let active = true
    wellnessApi
      .questions()
      .then(
        (data) => active && setQuestions([...data].sort((a, b) => a.displayOrder - b.displayOrder)),
      )
      .catch(
        (caught: unknown) =>
          active &&
          setError(caught instanceof Error ? caught.message : '질문을 불러오지 못했습니다.'),
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const question = questions[index]
  const selected = question ? answers[question.questionId] : undefined
  const isLast = index === questions.length - 1
  const answeredCount = Object.keys(answers).length

  const moveNext = () => {
    if (selected == null) {
      setError('지금 마음과 가장 가까운 답을 하나 선택해 주세요.')
      return
    }
    setError('')
    if (!isLast) setIndex((value) => value + 1)
  }

  const submit = async () => {
    if (!question || selected == null) return moveNext()
    const payload = {
      reservationId: null,
      stayStage,
      answers: questions.map((item) => ({
        questionId: item.questionId,
        value: answers[item.questionId],
      })),
    }
    if (payload.answers.some((answer) => answer.value == null)) {
      setError('아직 답하지 않은 질문이 있습니다.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const result = isMember
        ? await wellnessApi.submitMember(payload)
        : await wellnessApi.submitGuest(payload)
      const state: ResultRouteState = { result, answers: payload.answers, questions }
      navigate(result.checkId ? `/wellness/result/${result.checkId}` : '/wellness/result', {
        state,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '검사 결과를 저장하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      <section className="bg-subtle">
        <div className="mx-auto max-w-[1240px] px-6 py-14 md:px-12 md:py-16">
          <SectionLabel>
            TODAY’S CHECK · {stayStage === 'DURING_STAY' ? 'DURING STAY' : 'GUEST CHECK'}
          </SectionLabel>
          <h1 className="mt-4 text-4xl font-medium md:text-5xl">오늘의 마음상태 체크</h1>
          <p className="mt-5 text-sm text-secondary">
            정답은 없습니다. 지금 느껴지는 정도와 가장 가까운 답을 선택해 주세요.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[1240px] px-6 py-16 md:px-12 md:py-20">
        {loading && (
          <div className="py-32 text-center text-sm text-muted" role="status">
            마음상태 질문을 준비하고 있습니다…
          </div>
        )}
        {!loading && !question && (
          <div
            className="rounded-lg border border-error-border bg-white p-12 text-center text-sm text-error"
            role="alert"
          >
            {error || '현재 진행할 수 있는 설문이 없습니다.'}
          </div>
        )}
        {question && (
          <>
            <div className="grid items-end gap-5 md:grid-cols-[1fr_1fr]">
              <div>
                <SectionLabel>
                  QUESTION {String(index + 1).padStart(2, '0')} /{' '}
                  {String(questions.length).padStart(2, '0')}
                </SectionLabel>
                <p className="mt-2 text-sm text-muted">{categoryCopy[question.category].title}</p>
              </div>
              <div>
                <div className="h-1 rounded-full bg-subtle">
                  <i
                    className="block h-full rounded-full bg-gold-500 transition-all"
                    style={{ width: `${((index + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-[10px] text-muted">
                  {answeredCount}개 응답 완료
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_336px]">
              <article className="rounded-lg border border-border-subtle bg-white p-7 md:p-11">
                <SectionLabel>
                  {categoryCopy[question.category].eyebrow} ·{' '}
                  {categoryCopy[question.category].title}
                </SectionLabel>
                <h2 className="mt-7 max-w-[720px] text-3xl font-medium leading-[1.35] md:text-[38px]">
                  {question.content}
                </h2>
                <fieldset className="mt-9 grid gap-3 sm:grid-cols-5">
                  <legend className="sr-only">답변 선택</legend>
                  {question.options.map((option) => {
                    const checked = selected === option.value
                    return (
                      <label
                        className={`flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-md border px-3 text-center transition ${checked ? 'border-navy-900 bg-navy-900 text-white' : 'border-transparent bg-subtle hover:border-gold-300'}`}
                        key={option.value}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name={`question-${question.questionId}`}
                          checked={checked}
                          onChange={() => {
                            setAnswers((current) => ({
                              ...current,
                              [question.questionId]: option.value,
                            }))
                            setError('')
                          }}
                        />
                        <span className="font-display text-lg">{option.value}</span>
                        <span className="mt-4 text-xs leading-5">{option.label}</span>
                      </label>
                    )
                  })}
                </fieldset>
                <p className="mt-7 text-xs text-muted">
                  0 전혀 그렇지 않다&nbsp;&nbsp;—&nbsp;&nbsp;4 매우 그렇다
                </p>
                {error && (
                  <p className="mt-5 text-sm text-error" role="alert">
                    {error}
                  </p>
                )}
              </article>
              <aside className="rounded-lg bg-navy-900 p-7 text-white">
                <h2 className="text-2xl font-medium">체크 전 안내</h2>
                <ul className="mt-7 space-y-5 text-xs leading-6 text-white/70">
                  <li className="flex gap-4">
                    <span className="text-gold-300">●</span>최근 24시간의 상태를 떠올려 주세요.
                  </li>
                  <li className="flex gap-4">
                    <span className="text-gold-300">●</span>너무 오래 고민하지 않아도 괜찮아요.
                  </li>
                  <li className="flex gap-4">
                    <span className="text-gold-300">●</span>
                    {isMember
                      ? '회원 기록은 현재 숙박 단계에 저장됩니다.'
                      : '비회원 결과는 이 기기에 저장되지 않습니다.'}
                  </li>
                </ul>
                <div className="mt-8 rounded-md bg-white/8 p-5">
                  <SectionLabel>STAY STAGE</SectionLabel>
                  <p className="mt-3 text-sm">
                    {stayStageLabel[stayStage]} · {stayStage}
                  </p>
                </div>
                <p className="mt-6 text-xs leading-6 text-white/50">
                  의료적 진단이나 치료를 대신하지 않습니다.
                </p>
              </aside>
            </div>
            <div className="mt-7 flex justify-between">
              <Button
                variant="secondary"
                disabled={index === 0 || submitting}
                onClick={() => {
                  setError('')
                  setIndex((value) => Math.max(0, value - 1))
                }}
              >
                PREVIOUS
              </Button>
              {isLast ? (
                <Button disabled={submitting} onClick={() => void submit()}>
                  {submitting ? 'SAVING…' : 'VIEW MY RESULT'}
                </Button>
              ) : (
                <Button disabled={submitting} onClick={moveNext}>
                  NEXT QUESTION
                </Button>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
