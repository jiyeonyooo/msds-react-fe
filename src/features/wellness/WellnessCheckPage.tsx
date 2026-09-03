import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { reducedMotion } from '../../components/motion/hooks'
import { wellnessApi } from './api'
import { SectionLabel } from './WellnessShared'
import { categoryCopy, stayStageLabel } from './wellnessFormat'
import { clearDraft, readDraft, writeDraft, writeLastResult } from './wellnessDraft'
import type { ResultRouteState, StayStage, WellnessQuestion } from './types'
import { useWellnessMember } from './useWellnessMember'

const autoAdvanceDelay = 420

export function WellnessCheckPage() {
  const { isMember } = useWellnessMember()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<WellnessQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [restored, setRestored] = useState(false)
  const advanceTimer = useRef<number | null>(null)
  const stayStage: StayStage = isMember ? 'DURING_STAY' : 'GENERAL'

  useEffect(() => {
    let active = true
    wellnessApi
      .questions()
      .then((data) => {
        if (!active) return
        const ordered = [...data].sort((a, b) => a.displayOrder - b.displayOrder)
        setQuestions(ordered)
        // 새로고침이나 실수로 나갔다 온 경우, 답을 처음부터 다시 받지 않는다.
        const draft = readDraft(ordered)
        if (draft) {
          setAnswers(draft.answers)
          setIndex(draft.index)
          setRestored(true)
        }
      })
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

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    },
    [],
  )

  const question = questions[index]
  const selected = question ? answers[question.questionId] : undefined
  const isLast = index === questions.length - 1
  const answeredCount = Object.keys(answers).length

  const goTo = (nextIndex: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = null
    setError('')
    setRestored(false)
    setIndex(Math.min(Math.max(0, nextIndex), Math.max(0, questions.length - 1)))
  }

  const moveNext = () => {
    if (selected == null) {
      setError('지금 마음과 가장 가까운 답을 하나 선택해 주세요.')
      return
    }
    if (!isLast) goTo(index + 1)
  }

  const choose = (questionId: number, value: number) => {
    const nextAnswers = { ...answers, [questionId]: value }
    setAnswers(nextAnswers)
    setError('')
    setRestored(false)
    const nextIndex = isLast ? index : index + 1
    writeDraft({ answers: nextAnswers, index: nextIndex })
    // 고르자마자 다음 질문으로 넘긴다. 10문항에서 '다음' 클릭이 사라지는 만큼 흐름이 끊기지 않는다.
    if (isLast) return
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (reducedMotion()) {
      goTo(nextIndex)
      return
    }
    advanceTimer.current = window.setTimeout(() => goTo(nextIndex), autoAdvanceDelay)
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
    const unanswered = payload.answers.findIndex((answer) => answer.value == null)
    if (unanswered >= 0) {
      setError('아직 답하지 않은 질문이 있습니다.')
      goTo(unanswered)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const result = isMember
        ? await wellnessApi.submitMember(payload)
        : await wellnessApi.submitGuest(payload)
      const state: ResultRouteState = { result, answers: payload.answers, questions }
      clearDraft()
      // 비회원 결과는 서버에 남지 않는다. 새로고침해도 방금 본 결과가 사라지지 않도록 세션에 남긴다.
      writeLastResult(state)
      navigate(result.checkId ? `/wellness/result/${result.checkId}` : '/wellness/result', {
        state,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '검사 결과를 저장하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 숫자키로 답하고 Enter/방향키로 오간다. 마우스를 놓지 않아도 되는 만큼 응답이 빨라진다.
  useEffect(() => {
    if (!question || submitting) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing) return
      const target = event.target as HTMLElement | null
      if (target && ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(index - 1)
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveNext()
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        if (isLast) void submit()
        else moveNext()
        return
      }
      const digit = Number(event.key)
      if (!Number.isInteger(digit) || digit < 1 || digit > question.options.length) return
      event.preventDefault()
      choose(question.questionId, question.options[digit - 1].value)
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  })

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
            {restored && (
              <p
                className="mb-6 rounded-md border border-border-accent bg-white px-5 py-4 text-xs text-ink-700"
                role="status"
              >
                이전에 답하던 곳부터 이어서 진행합니다. 처음부터 다시 하려면{' '}
                <button
                  className="border-0 bg-transparent p-0 text-gold-500 underline underline-offset-4"
                  onClick={() => {
                    clearDraft()
                    setAnswers({})
                    setIndex(0)
                    setRestored(false)
                  }}
                  type="button"
                >
                  기록 지우기
                </button>
                를 눌러 주세요.
              </p>
            )}
            <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
              <div>
                <SectionLabel>
                  QUESTION {String(index + 1).padStart(2, '0')} /{' '}
                  {String(questions.length).padStart(2, '0')}
                </SectionLabel>
                <p className="mt-2 text-sm text-muted">{categoryCopy[question.category].title}</p>
                <p className="mt-3 text-xs text-muted">
                  숫자키 1–{question.options.length}로 답하고, Enter 또는 ← → 키로 문항을 오갈 수 있어요.
                </p>
              </div>
              <ProgressRing answered={answeredCount} total={questions.length} />
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_336px]">
              <article
                className="rounded-lg border border-border-subtle bg-white p-7 md:p-11"
              >
                <SectionLabel>
                  {categoryCopy[question.category].eyebrow} ·{' '}
                  {categoryCopy[question.category].title}
                </SectionLabel>
                <h2 className="mt-7 max-w-[720px] text-3xl font-medium leading-[1.35] md:text-[38px]">
                  {question.content}
                </h2>
                <fieldset className="mt-9 grid gap-3 sm:grid-cols-5">
                  <legend className="sr-only">답변 선택</legend>
                  {question.options.map((option, optionIndex) => {
                    const checked = selected === option.value
                    return (
                      <label
                        className={`flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-md border px-3 text-center transition duration-500 ease-calm ${checked ? 'border-navy-900 bg-navy-900 text-white' : 'border-transparent bg-subtle hover:border-gold-300'}`}
                        key={option.value}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name={`question-${question.questionId}`}
                          checked={checked}
                          onChange={() => choose(question.questionId, option.value)}
                        />
                        <span className="font-display text-lg">{option.value}</span>
                        <span className="mt-4 text-xs leading-5">{option.label}</span>
                        <span
                          className={`mt-3 text-[10px] tracking-[0.12em] ${checked ? 'text-gold-300' : 'text-muted'}`}
                        >
                          KEY {optionIndex + 1}
                        </span>
                      </label>
                    )
                  })}
                </fieldset>
                <div className="mt-7 flex flex-col justify-between gap-2 text-xs text-muted sm:flex-row sm:items-center">
                  <p>0 전혀 그렇지 않다&nbsp;&nbsp;—&nbsp;&nbsp;4 매우 그렇다</p>
                  <p className="text-[10px] tracking-[0.05em]">숫자키 1–5로 선택 · ENTER로 다음</p>
                </div>
                {error && (
                  <p className="mt-5 text-sm text-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-6">
                  <Button
                    variant="secondary"
                    disabled={index === 0 || submitting}
                    onClick={() => goTo(index - 1)}
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
                      : '비회원 결과는 서버에 저장되지 않고, 이 브라우저 세션에만 잠시 남습니다.'}
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
          </>
        )}
      </section>
    </main>
  )
}

/**
 * 진행률을 원으로 보여 준다.
 * 채워지는 막대는 '남은 분량'을 재촉하는 쪽으로 읽혀서, 호흡 링과 같은 원형으로 바꿨다.
 */
function ProgressRing({ answered, total }: { answered: number; total: number }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const progress = total === 0 ? 0 : answered / total
  return (
    <div className="relative grid size-[92px] place-items-center justify-self-start md:justify-self-end">
      <span
        aria-hidden="true"
        className="animate-breathe absolute inset-1 rounded-full border border-gold-300/40"
      />
      <svg className="relative size-[92px] -rotate-90" viewBox="0 0 92 92" role="presentation">
        <circle cx="46" cy="46" fill="none" r={radius} stroke="#e7e0d5" strokeWidth="4" />
        <circle
          cx="46"
          cy="46"
          fill="none"
          r={radius}
          stroke="#b79a67"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          strokeWidth="4"
          style={{ transition: 'stroke-dashoffset 760ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className="absolute text-center text-[11px] leading-4 text-muted">
        <b className="block font-display text-lg text-navy-900">{answered}</b>／{total}
      </span>
    </div>
  )
}
