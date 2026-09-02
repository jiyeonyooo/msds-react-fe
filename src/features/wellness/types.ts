export type ApiEnvelope<T> = { code: string; message: string; data: T }

export type WellnessCategory =
  'STRESS' | 'TENSION' | 'FATIGUE' | 'REST' | 'MOOD' | 'FOCUS' | 'OVERALL'

export type WellnessLevel = 'VERY_RELAXED' | 'RELAXED' | 'NORMAL' | 'TIRED' | 'VERY_TIRED'
export type StayStage = 'GENERAL' | 'BEFORE_STAY' | 'DURING_STAY' | 'AFTER_STAY'

export type WellnessQuestionOption = { value: number; label: string }
export type WellnessQuestion = {
  questionId: number
  category: WellnessCategory
  content: string
  displayOrder: number
  options: WellnessQuestionOption[]
}

export type WellnessCheckRequest = {
  reservationId: number | null
  stayStage: StayStage
  answers: { questionId: number; value: number }[]
}

export type WellnessCheckResult = {
  checkId: number | null
  totalScore: number
  level: WellnessLevel
  levelLabel: string
  message: string
  saved: boolean
}

export type WellnessAnswerDetail = {
  questionId: number
  category: WellnessCategory
  content: string
  answerValue: number
  convertedValue: number
}

export type WellnessCheckDetail = Omit<WellnessCheckResult, 'saved'> & {
  reservationId: number | null
  stayStage: StayStage
  checkedAt: string
  answers: WellnessAnswerDetail[]
}

export type WellnessHistory = {
  checkId: number
  totalScore: number
  level: WellnessLevel
  stayStage: StayStage
  checkedAt: string
}

export type WellnessTrendPoint = {
  checkId: number
  totalScore: number
  level: WellnessLevel
  checkedAt: string
}

export type QuietnessLevel = 'VERY_QUIET' | 'QUIET' | 'NORMAL' | 'LOUD' | 'VERY_LOUD' | 'UNKNOWN'
export type QuietSpaceType =
  'ROOM' | 'LOUNGE' | 'MEDITATION_ROOM' | 'COMMON_AREA' | 'FACILITY' | 'OTHER'

export type QuietnessSummary = {
  guesthouseId: number
  averageDecibel: number
  level: QuietnessLevel
  measuredSpaceCount: number
  latestMeasuredAt: string | null
}

export type SpaceQuietness = {
  spaceId: number
  spaceName: string
  spaceType: QuietSpaceType
  decibel: number
  level: QuietnessLevel
  measuredAt: string
}

export type QuietSpaceRecommendation = SpaceQuietness & { guesthouseId: number }

export type HourlyQuietness = {
  hourStart: string
  averageDecibel: number
  minimumDecibel: number
  maximumDecibel: number
  level: QuietnessLevel
  sampleCount: number
}

export type ResultRouteState = {
  result?: WellnessCheckResult
  answers?: WellnessCheckRequest['answers']
  questions?: WellnessQuestion[]
}
