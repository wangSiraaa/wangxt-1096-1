export type LevelCategory = '初级' | '中级' | '高级' | '专业级'

export type SessionStatus = 'open' | 'closed' | 'finished'

export type RegistrationStatus = 'pending_upload' | 'pending_payment' | 'paid' | 'scored' | 'completed'

export type ScoreResult = '优秀' | '良好' | '合格' | '不合格'

export type Role = 'exam-center' | 'candidate' | 'judge'

export interface ExamSession {
  id: string
  level: number
  levelCategory: LevelCategory
  examDate: string
  examTime: string
  maxSlots: number
  registeredCount: number
  fee: number
  status: SessionStatus
  createdBy: string
  createdAt: string
}

export interface Registration {
  id: string
  sessionId: string
  candidateName: string
  candidatePhone: string
  appliedLevel: number
  passedLevel: number
  workUploaded: boolean
  workImageBase64: string
  paid: boolean
  paidAt: string
  status: RegistrationStatus
  canWithdraw: boolean
  createdAt: string
}

export interface Score {
  id: string
  registrationId: string
  sessionId: string
  candidateName: string
  appliedLevel: number
  judgeName: string
  score: number
  result: ScoreResult
  comment: string
  published: boolean
  createdAt: string
}

export function getLevelCategory(level: number): LevelCategory {
  if (level <= 3) return '初级'
  if (level <= 6) return '中级'
  if (level <= 9) return '高级'
  return '专业级'
}

export function getLevelName(level: number): string {
  return `${level}级（${getLevelCategory(level)}）`
}

export function checkLevelSpan(appliedLevel: number, passedLevel: number): { ok: boolean; message: string } {
  if (passedLevel === 0) {
    if (appliedLevel > 4) {
      return { ok: false, message: `建议逐级报考，请先通过${appliedLevel - 3}级及以下考试` }
    }
    return { ok: true, message: '' }
  }
  const span = Math.abs(appliedLevel - passedLevel)
  if (span > 3) {
    return { ok: false, message: `建议逐级报考，您已通过${passedLevel}级，请先通过${passedLevel + 3}级及以下考试` }
  }
  return { ok: true, message: '' }
}

export function getScoreResult(score: number): ScoreResult {
  if (score >= 90) return '优秀'
  if (score >= 75) return '良好'
  if (score >= 60) return '合格'
  return '不合格'
}

export function getRegistrationStatusText(status: RegistrationStatus): string {
  const map: Record<RegistrationStatus, string> = {
    pending_upload: '待上传作品',
    pending_payment: '待缴费',
    paid: '已缴费',
    scored: '已评审',
    completed: '已完成',
  }
  return map[status]
}

export function getSessionStatusText(status: SessionStatus): string {
  const map: Record<SessionStatus, string> = {
    open: '报名中',
    closed: '已截止',
    finished: '已结束',
  }
  return map[status]
}
