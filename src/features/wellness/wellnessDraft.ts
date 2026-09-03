import type { ResultRouteState, WellnessQuestion } from './types'

/**
 * 마음상태 체크의 중간 상태와 마지막 결과를 세션에 남긴다.
 *
 * 10문항짜리 설문인데 새로고침 한 번에 답이 전부 사라졌고, 비회원 결과는 라우트 state 에만
 * 있어서 결과 화면을 새로고침하면 "표시할 결과가 없어요"로 떨어졌다. 서버에 저장되지 않는
 * 비회원 데이터라 브라우저 세션에만 두고, 시간이 지나면 스스로 지워지게 한다.
 */
const draftKey = 'msds-wellness-draft'
const resultKey = 'msds-wellness-result'
const draftLifetime = 6 * 60 * 60 * 1000
const resultLifetime = 24 * 60 * 60 * 1000

export type WellnessDraft = { answers: Record<number, number>; index: number }

type Stored<T> = T & { savedAt: number }

function read<T>(key: string, lifetime: number): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored<T>
    if (!parsed || typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > lifetime) {
      sessionStorage.removeItem(key)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function write(key: string, value: object) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...value, savedAt: Date.now() }))
  } catch {
    // 저장이 막혀도 진행 자체는 막지 않는다.
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // 지우지 못해도 만료 시간이 결국 정리한다.
  }
}

export function readDraft(questions: WellnessQuestion[]): WellnessDraft | null {
  const stored = read<WellnessDraft>(draftKey, draftLifetime)
  if (!stored || typeof stored.answers !== 'object') return null
  // 문항이 개편되면 남아 있는 답이 엉뚱한 질문에 붙는다. 현재 문항에 있는 답만 되살린다.
  const validIds = new Set(questions.map((question) => question.questionId))
  const answers = Object.entries(stored.answers).reduce<Record<number, number>>(
    (result, [questionId, value]) => {
      if (validIds.has(Number(questionId)) && typeof value === 'number')
        result[Number(questionId)] = value
      return result
    },
    {},
  )
  if (Object.keys(answers).length === 0) return null
  const index = Math.min(Math.max(0, Number(stored.index) || 0), Math.max(0, questions.length - 1))
  return { answers, index }
}

export const writeDraft = (draft: WellnessDraft) => write(draftKey, draft)
export const clearDraft = () => remove(draftKey)

export function readLastResult(): ResultRouteState | null {
  const stored = read<ResultRouteState>(resultKey, resultLifetime)
  return stored?.result ? stored : null
}

export const writeLastResult = (state: ResultRouteState) => write(resultKey, state)
export const clearLastResult = () => remove(resultKey)
