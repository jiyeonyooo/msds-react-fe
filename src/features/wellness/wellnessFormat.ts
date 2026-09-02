import type {
  QuietnessLevel,
  StayStage,
  WellnessAnswerDetail,
  WellnessCategory,
  WellnessLevel,
} from './types'

export const levelLabel: Record<WellnessLevel, string> = {
  VERY_RELAXED: '매우 편안',
  RELAXED: '편안',
  NORMAL: '보통',
  TIRED: '지침',
  VERY_TIRED: '매우 지침',
}

export const quietnessLabel: Record<QuietnessLevel, string> = {
  VERY_QUIET: '매우 조용함',
  QUIET: '조용함',
  NORMAL: '보통',
  LOUD: '다소 시끄러움',
  VERY_LOUD: '시끄러움',
  UNKNOWN: '측정 전',
}

export const stayStageLabel: Record<StayStage, string> = {
  GENERAL: '일반',
  BEFORE_STAY: '숙박 전',
  DURING_STAY: '숙박 중',
  AFTER_STAY: '숙박 후',
}

export const categoryCopy: Record<WellnessCategory, { eyebrow: string; title: string }> = {
  STRESS: { eyebrow: 'STRESS', title: '걱정과 부담' },
  TENSION: { eyebrow: 'TENSION', title: '몸과 마음의 긴장' },
  FATIGUE: { eyebrow: 'FATIGUE', title: '피로와 에너지' },
  REST: { eyebrow: 'REST', title: '휴식과 안정' },
  MOOD: { eyebrow: 'MOOD', title: '감정의 흐름' },
  FOCUS: { eyebrow: 'FOCUS', title: '집중과 선명함' },
  OVERALL: { eyebrow: 'OVERALL', title: '전반적인 마음' },
}

export function categoryScores(answers: WellnessAnswerDetail[]) {
  const buckets = new Map<WellnessCategory, number[]>()
  answers.forEach((answer) => {
    const list = buckets.get(answer.category) ?? []
    list.push(answer.convertedValue)
    buckets.set(answer.category, list)
  })
  return [...buckets.entries()].map(([category, values]) => ({
    category,
    score: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 25),
  }))
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(
    new Date(value),
  )
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export function toLocalDateTime(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 19)
}

export function scoreDescription(score: number) {
  if (score <= 20) return '매우 편안'
  if (score <= 40) return '편안'
  if (score <= 60) return '보통'
  if (score <= 80) return '조금 높음'
  return '높음'
}
