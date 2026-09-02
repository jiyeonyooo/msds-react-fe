import type { StayStage, WellnessCategory, WellnessLevel } from '../types'

export type AdminWellnessLevelCount = {
  level: WellnessLevel
  label: string
  count: number
  percentage: number
}

export type AdminWellnessStageCount = {
  stage: StayStage
  averageScore: number
  count: number
}

export type AdminWellnessCategoryAverage = {
  category: WellnessCategory
  averageScore: number
  answerCount: number
}

export type AdminWellnessDailyTrend = {
  date: string
  count: number
  averageScore: number
}

export type AdminWellnessStatistics = {
  fromDate: string
  toDate: string
  suppressed: boolean
  minimumMembers: number
  totalChecks: number
  uniqueMembers: number
  averageScore: number
  afterStayAverageChange: number
  stageAverages: AdminWellnessStageCount[]
  levelDistribution: AdminWellnessLevelCount[]
  categoryAverages: AdminWellnessCategoryAverage[]
  dailyTrend: AdminWellnessDailyTrend[]
}
