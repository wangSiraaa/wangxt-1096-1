export type LevelCategory = '初级' | '中级' | '高级' | '专业级'

export type SessionStatus = 'open' | 'closed' | 'finished' | 'adjusted' | 'cancelled'

export type RegistrationStatus = 
  | 'pending_upload' 
  | 'pending_payment' 
  | 'paid' 
  | 'pending_reassign' 
  | 'waitlist' 
  | 'scored' 
  | 'pending_review' 
  | 'reviewed' 
  | 'completed'

export type ScoreResult = '优秀' | '良好' | '合格' | '不合格'

export type Role = 'exam-center' | 'candidate' | 'judge' | 'exam'

export type JumpLevelApprovalStatus = 'approved' | 'rejected' | 'pending'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface WorkVersion {
  id: string
  version: number
  workImageBase64: string
  uploadedAt: string
  uploadNote: string
}

export interface Venue {
  id: string
  name: string
  address: string
  capacity: number
  equipment: string[]
  isBackup?: boolean
  description?: string
}

export interface WaitlistEntry {
  id: string
  registrationId: string
  position: number
  joinedAt: string
  expiresAt: string
}

export interface ReassignmentRecord {
  id: string
  registrationId: string
  oldSessionId: string
  newSessionId: string | null
  reason: string
  feeDifference: number
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface ReviewRecord {
  id: string
  scoreId: string
  registrationId: string
  initialScore: number
  finalScore: number | null
  reason: string
  reviewJudgeName: string
  status: ReviewStatus
  createdAt: string
  reviewedAt: string | null
}

export interface TimelineEvent {
  id: string
  type: 'register' | 'upload' | 'payment' | 'waitlist' | 'reassign' | 'score' | 'review' | 'publish' | 'result'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface JumpLevelCheck {
  passed: boolean
  reason: string
  requiredDocuments: string[]
  approvalStatus: JumpLevelApprovalStatus
}

export interface ExamSession {
  id: string
  level: number
  levelCategory: LevelCategory
  examDate: string
  examTime: string
  maxSlots: number
  registeredCount: number
  waitlistSlots: number
  waitlistCount: number
  fee: number
  status: SessionStatus
  venueId: string | null
  venue: Venue | null
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
  jumpLevelCheck: JumpLevelCheck | null
  workVersions: WorkVersion[]
  currentWorkVersion: number
  workUploaded: boolean
  workImageBase64: string
  paid: boolean
  paidAmount: number
  paidAt: string
  status: RegistrationStatus
  canWithdraw: boolean
  waitlistEntry: WaitlistEntry | null
  reassignment: ReassignmentRecord | null
  timeline: TimelineEvent[]
  createdAt: string
  scores?: Score[]
}

export interface Score {
  id: string
  registrationId: string
  sessionId: string
  candidateName: string
  appliedLevel: number
  judgeName: string
  score: number
  isBorderline: boolean
  borderlineReason: string
  result: ScoreResult
  comment: string
  reviewStatus: ReviewStatus
  reviewRecord: ReviewRecord | null
  published: boolean
  createdAt: string
  scoredAt?: string
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

export function checkJumpLevelEligibility(appliedLevel: number, passedLevel: number): JumpLevelCheck {
  const span = appliedLevel - passedLevel
  
  if (span <= 1) {
    return {
      passed: true,
      reason: '正常报考，无需跳级审批',
      requiredDocuments: [],
      approvalStatus: 'approved'
    }
  }
  
  if (span === 2) {
    return {
      passed: true,
      reason: '跨1级报考，需提供近期作品证明',
      requiredDocuments: ['近期获奖证书', '指导老师推荐函'],
      approvalStatus: 'pending'
    }
  }
  
  if (span === 3) {
    return {
      passed: false,
      reason: '跨2级及以上报考，需参加跳级资格考试',
      requiredDocuments: ['过往考级证书', '专业作品3幅', '跳级资格考试成绩单'],
      approvalStatus: 'pending'
    }
  }
  
  return {
    passed: false,
    reason: `跨度${span}级，超出最大允许跳级范围（最多跨2级）`,
    requiredDocuments: [],
    approvalStatus: 'rejected'
  }
}

export function isBorderlineScore(score: number): { isBorderline: boolean; reason: string } {
  const thresholds = [60, 75, 90]
  const tolerance = 3
  
  for (const threshold of thresholds) {
    const diff = Math.abs(score - threshold)
    if (diff <= tolerance && diff > 0) {
      const direction = score >= threshold ? '高于' : '低于'
      const resultText = threshold === 60 ? '合格线' : threshold === 75 ? '良好线' : '优秀线'
      return {
        isBorderline: true,
        reason: `分数${direction}${resultText}${diff}分，属于临界区间，需复核`
      }
    }
  }
  
  return { isBorderline: false, reason: '' }
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
    pending_reassign: '待改派',
    waitlist: '候补考位',
    scored: '已评审',
    pending_review: '待复核',
    reviewed: '已复核',
    completed: '已完成',
  }
  return map[status]
}

export function getSessionStatusText(status: SessionStatus): string {
  const map: Record<SessionStatus, string> = {
    open: '报名中',
    closed: '已截止',
    finished: '已结束',
    adjusted: '场地调整',
    cancelled: '已取消',
  }
  return map[status]
}

export function calculateFeeDifference(oldFee: number, newFee: number): number {
  return newFee - oldFee
}

export function createTimelineEvent(
  type: TimelineEvent['type'],
  title: string,
  description: string,
  metadata?: Record<string, unknown>
): TimelineEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    description,
    timestamp: new Date().toISOString(),
    metadata
  }
}
