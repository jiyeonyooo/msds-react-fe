import type { SpaceQuietness, WellnessCategory } from './types'
import { quietnessLabel } from './wellnessFormat'

/**
 * 체크 결과에서 다음 걸음을 고른다.
 *
 * 지금까지 결과 화면과 개요 화면 모두 "10분 호흡 명상"을 고정 문구로 보여 주고 있었다.
 * 프로그램 API에는 시간표가 없으므로 특정 세션을 지어내지 않고, 가장 두드러진 항목에 맞는
 * 방향과 화면만 연결한다.
 */
export type WellnessRecommendation = {
  symbol: string
  eyebrow: string
  title: string
  body: string
  ctaLabel: string
  to: string
}

type CategoryScore = { category: WellnessCategory; score: number }

const byCategory: Partial<Record<WellnessCategory, Omit<WellnessRecommendation, 'body'>>> = {
  STRESS: {
    symbol: '⌒',
    eyebrow: 'YOUR NEXT STEP · 걱정과 부담',
    title: '호흡을 늦추는 짧은 세션으로 생각의 속도를 낮춰보세요.',
    ctaLabel: 'VIEW PROGRAMS',
    to: '/programs',
  },
  TENSION: {
    symbol: '⌇',
    eyebrow: 'YOUR NEXT STEP · 몸과 마음의 긴장',
    title: '천천히 걷거나 몸을 푸는 움직임 프로그램이 도움이 됩니다.',
    ctaLabel: 'VIEW PROGRAMS',
    to: '/programs',
  },
  FATIGUE: {
    symbol: '☾',
    eyebrow: 'YOUR NEXT STEP · 피로와 에너지',
    title: '오늘은 무엇을 더 하기보다, 쉬기 좋은 객실에서 머물러 보세요.',
    ctaLabel: 'EXPLORE ROOMS',
    to: '/rooms',
  },
  REST: {
    symbol: '☼',
    eyebrow: 'YOUR NEXT STEP · 휴식과 안정',
    title: '지금 가장 조용한 공간에서 잠시 머물러 보세요.',
    ctaLabel: 'FIND A QUIET PLACE',
    to: '/wellness#quietness',
  },
  MOOD: {
    symbol: '◡',
    eyebrow: 'YOUR NEXT STEP · 감정의 흐름',
    title: '하루를 정돈하는 저녁 프로그램으로 마음을 내려놓아 보세요.',
    ctaLabel: 'VIEW PROGRAMS',
    to: '/programs',
  },
  FOCUS: {
    symbol: '✦',
    eyebrow: 'YOUR NEXT STEP · 집중과 선명함',
    title: '조용한 아침 시간에 짧은 명상으로 하루를 열어 보세요.',
    ctaLabel: 'VIEW PROGRAMS',
    to: '/programs',
  },
}

const fallback: Omit<WellnessRecommendation, 'body'> = {
  symbol: '⌒',
  eyebrow: 'YOUR NEXT STEP',
  title: '오늘의 마음에 맞춰 천천히 머무는 시간을 가져보세요.',
  ctaLabel: 'VIEW PROGRAMS',
  to: '/programs',
}

export function recommendWellnessNext({
  scores = [],
  totalScore,
  quietestSpace,
}: {
  scores?: CategoryScore[]
  totalScore: number | null
  quietestSpace?: SpaceQuietness | null
}): WellnessRecommendation {
  const dominant = [...scores]
    .filter((item) => item.category !== 'OVERALL' && byCategory[item.category])
    .sort((a, b) => b.score - a.score)[0]

  // 답변 상세가 없는 화면(개요)에서는 총점만으로 방향을 정한다.
  const base =
    (dominant && byCategory[dominant.category]) ??
    (totalScore !== null && totalScore >= 60 ? byCategory.STRESS : byCategory.REST) ??
    fallback

  const reason = dominant
    ? `${categoryReason[dominant.category] ?? '오늘의 답변'}이(가) 가장 높게 나타났어요.`
    : totalScore !== null
      ? `오늘의 마음 부담도는 ${totalScore}점이에요.`
      : '아직 오늘의 기록이 없어요.'

  const quietHint = quietestSpace
    ? ` 지금은 ${quietestSpace.spaceName}이(가) ${quietnessLabel[quietestSpace.level]} 상태예요.`
    : ''

  return { ...base, body: `${reason}${quietHint}` }
}

const categoryReason: Partial<Record<WellnessCategory, string>> = {
  STRESS: '걱정과 부담',
  TENSION: '몸과 마음의 긴장',
  FATIGUE: '피로',
  REST: '휴식이 부족한 정도',
  MOOD: '감정의 기복',
  FOCUS: '집중의 흐트러짐',
}
