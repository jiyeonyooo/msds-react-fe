import type {
  HourlyQuietness,
  QuietnessSummary,
  SpaceQuietness,
  WellnessCheckDetail,
  WellnessCheckResult,
  WellnessHistory,
  WellnessQuestion,
  WellnessTrendPoint,
} from './types'

const options = [
  { value: 0, label: '전혀 그렇지 않다' },
  { value: 1, label: '그렇지 않은 편이다' },
  { value: 2, label: '보통이다' },
  { value: 3, label: '그런 편이다' },
  { value: 4, label: '매우 그렇다' },
]
const rows = [
  ['STRESS', '지금 해야 할 일이나 걱정 때문에 마음이 무겁게 느껴진다.'],
  ['STRESS', '사소한 일에도 쉽게 예민해지거나 짜증이 난다.'],
  ['TENSION', '몸이나 마음에 긴장이 남아 있다고 느낀다.'],
  ['FATIGUE', '충분히 쉬어도 피로가 남아 있는 것 같다.'],
  ['FATIGUE', '일상적인 활동을 하기에도 에너지가 부족하다고 느낀다.'],
  ['REST', '지금 마음이 편안하고 안정되어 있다고 느낀다.'],
  ['REST', '현재 충분히 쉬고 있다는 느낌이 든다.'],
  ['MOOD', '오늘 전반적인 기분이 긍정적이다.'],
  ['FOCUS', '여러 생각이 떠올라 마음을 편하게 쉬기 어렵다.'],
  ['OVERALL', '지금 당장 잠시 멈추고 쉬고 싶다는 생각이 든다.'],
] as const
export const demoQuestions: WellnessQuestion[] = rows.map(([category, content], index) => ({
  questionId: index + 1,
  category,
  content,
  displayOrder: index + 1,
  options,
}))
export const demoResult: WellnessCheckResult = {
  checkId: 103,
  totalScore: 42,
  level: 'NORMAL',
  levelLabel: '보통',
  message: '조금 지쳐 있을 수 있어요. 잠시 일상에서 벗어나 쉬어가는 시간을 가져보세요.',
  saved: true,
}
export const demoHistory: WellnessHistory[] = [
  {
    checkId: 103,
    totalScore: 42,
    level: 'NORMAL',
    stayStage: 'DURING_STAY',
    checkedAt: '2026-09-01T08:42:00',
  },
  {
    checkId: 102,
    totalScore: 45,
    level: 'NORMAL',
    stayStage: 'DURING_STAY',
    checkedAt: '2026-08-30T21:16:00',
  },
  {
    checkId: 101,
    totalScore: 82,
    level: 'VERY_TIRED',
    stayStage: 'BEFORE_STAY',
    checkedAt: '2026-08-28T14:08:00',
  },
]
export const demoTrend: WellnessTrendPoint[] = [...demoHistory].reverse()
export const demoDetail: WellnessCheckDetail = {
  ...demoResult,
  reservationId: 1,
  stayStage: 'DURING_STAY',
  checkedAt: demoHistory[0].checkedAt,
  answers: demoQuestions.map((question, index) => ({
    questionId: question.questionId,
    category: question.category,
    content: question.content,
    answerValue: [2, 3, 2, 2, 2, 3, 3, 3, 2, 2][index],
    convertedValue: [2, 3, 2, 2, 2, 1, 1, 1, 2, 2][index],
  })),
}
export const demoQuietnessSummary: QuietnessSummary = {
  guesthouseId: 1,
  averageDecibel: 34.8,
  level: 'VERY_QUIET',
  measuredSpaceCount: 4,
  latestMeasuredAt: '2026-09-01T08:44:00',
}
export const demoSpaces: SpaceQuietness[] = [
  {
    spaceId: 1,
    spaceName: '명상실',
    spaceType: 'MEDITATION_ROOM',
    decibel: 28.6,
    level: 'VERY_QUIET',
    measuredAt: '2026-09-01T08:44:00',
  },
  {
    spaceId: 2,
    spaceName: '객실 A',
    spaceType: 'ROOM',
    decibel: 31.2,
    level: 'VERY_QUIET',
    measuredAt: '2026-09-01T08:44:00',
  },
  {
    spaceId: 3,
    spaceName: '정원',
    spaceType: 'COMMON_AREA',
    decibel: 36.4,
    level: 'QUIET',
    measuredAt: '2026-09-01T08:44:00',
  },
  {
    spaceId: 4,
    spaceName: '라운지',
    spaceType: 'LOUNGE',
    decibel: 43.1,
    level: 'NORMAL',
    measuredAt: '2026-09-01T08:44:00',
  },
]
export const demoHourly: HourlyQuietness[] = [29, 31, 34, 33, 27, 25, 28].map((value, index) => ({
  hourStart: `2026-09-01T0${index}:00:00`,
  averageDecibel: value,
  minimumDecibel: value - 2,
  maximumDecibel: value + 2,
  level: value < 32 ? 'VERY_QUIET' : 'QUIET',
  sampleCount: 6,
}))
