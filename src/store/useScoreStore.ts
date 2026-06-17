import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Score, ReviewRecord } from '@/types'
import { getScoreResult, isBorderlineScore, createTimelineEvent } from '@/types'
import { seedScores } from './seedData'

interface ScoreState {
  scores: Score[]
  addScore: (score: Omit<Score, 'id' | 'result' | 'isBorderline' | 'borderlineReason' | 'reviewStatus' | 'reviewRecord' | 'createdAt'>) => Score
  updateScore: (id: string, updates: Partial<Score>) => void
  requestReview: (scoreId: string, reason: string) => ReviewRecord | null
  completeReview: (reviewId: string, finalScore: number, reviewJudgeName: string, approved: boolean) => void
  publishScores: (sessionId: string) => { publishedCount: number; skippedCount: number }
  getPendingReviews: () => Score[]
  getBorderlineScores: (sessionId?: string) => Score[]
  getReviewsByRegistrationId: (registrationId: string) => ReviewRecord[]
  getReviewsByScoreId: (scoreId: string) => ReviewRecord[]
  getPublishableScores: (sessionId: string) => Score[]
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      scores: seedScores,
      addScore: (scoreData) => {
        const { isBorderline, reason } = isBorderlineScore(scoreData.score)
        const reviewStatus = isBorderline ? 'pending' : 'approved'
        
        const newScore: Score = {
          ...scoreData,
          id: `score-${Date.now()}`,
          result: getScoreResult(scoreData.score),
          isBorderline,
          borderlineReason: reason,
          reviewStatus,
          reviewRecord: null,
          createdAt: new Date().toISOString(),
        }
        
        const { useRegistrationStore } = require('./useRegistrationStore')
        const registrationStore = useRegistrationStore.getState()
        
        if (isBorderline) {
          registrationStore.addTimelineEvent(scoreData.registrationId, {
            type: 'score',
            title: '成绩录入（临界线）',
            description: `初评分数：${scoreData.score}分，${reason}`
          })
          registrationStore.setStatus(scoreData.registrationId, 'pending_review')
        } else {
          registrationStore.addTimelineEvent(scoreData.registrationId, {
            type: 'score',
            title: '成绩录入',
            description: `初评分数：${scoreData.score}分，结果：${newScore.result}`
          })
          registrationStore.setStatus(scoreData.registrationId, 'scored')
        }
        
        set((state) => ({
          scores: [...state.scores, newScore],
        }))
        
        return newScore
      },
      updateScore: (id, updates) =>
        set((state) => ({
          scores: state.scores.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      requestReview: (scoreId, reason) => {
        const score = get().scores.find(s => s.id === scoreId)
        if (!score) return null
        
        const reviewRecord: ReviewRecord = {
          id: `review-${Date.now()}`,
          scoreId,
          registrationId: score.registrationId,
          initialScore: score.score,
          finalScore: null,
          reason,
          reviewJudgeName: '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          reviewedAt: null,
        }
        
        const { useRegistrationStore } = require('./useRegistrationStore')
        const registrationStore = useRegistrationStore.getState()
        
        registrationStore.addTimelineEvent(score.registrationId, {
          type: 'review',
          title: '发起复核',
          description: `复核原因：${reason}`
        })
        registrationStore.setStatus(score.registrationId, 'pending_review')
        
        set((state) => ({
          scores: state.scores.map((s) =>
            s.id === scoreId
              ? {
                  ...s,
                  reviewStatus: 'pending',
                  reviewRecord,
                }
              : s
          ),
        }))
        
        return reviewRecord
      },
      completeReview: (reviewId, finalScore, reviewJudgeName, approved) => {
        const score = get().scores.find(s => s.reviewRecord?.id === reviewId)
        if (!score || !score.reviewRecord) return
        
        const { useRegistrationStore } = require('./useRegistrationStore')
        const registrationStore = useRegistrationStore.getState()
        
        const newResult = getScoreResult(finalScore)
        const newBorderline = isBorderlineScore(finalScore)
        
        registrationStore.addTimelineEvent(score.registrationId, {
          type: 'review',
          title: '复核完成',
          description: `复核结果：${approved ? '通过' : '驳回'}，最终分数：${finalScore}分，结果：${newResult}`
        })
        
        if (approved) {
          registrationStore.setStatus(score.registrationId, 'reviewed')
        } else {
          registrationStore.setStatus(score.registrationId, 'scored')
        }
        
        set((state) => ({
          scores: state.scores.map((s) =>
            s.id === score.id
              ? {
                  ...s,
                  score: approved ? finalScore : s.score,
                  result: approved ? newResult : s.result,
                  isBorderline: approved ? newBorderline.isBorderline : s.isBorderline,
                  borderlineReason: approved ? newBorderline.reason : s.borderlineReason,
                  reviewStatus: approved ? 'approved' : 'rejected',
                  reviewRecord: {
                    ...s.reviewRecord!,
                    finalScore,
                    reviewJudgeName,
                    status: approved ? 'approved' : 'rejected',
                    reviewedAt: new Date().toISOString(),
                  },
                }
              : s
          ),
        }))
      },
      publishScores: (sessionId) => {
        const { useRegistrationStore } = require('./useRegistrationStore')
        const registrationStore = useRegistrationStore.getState()
        const { useExamStore } = require('./useExamStore')
        const examStore = useExamStore.getState()
        
        const sessionScores = get().scores.filter(
          s => s.sessionId === sessionId && s.reviewStatus !== 'pending'
        )
        const skippedCount = get().scores.filter(
          s => s.sessionId === sessionId && s.reviewStatus === 'pending'
        ).length
        
        sessionScores.forEach(score => {
          registrationStore.addTimelineEvent(score.registrationId, {
            type: 'publish',
            title: '成绩发布',
            description: `最终成绩：${score.score}分，结果：${score.result}`
          })
          registrationStore.setStatus(score.registrationId, 'completed')
          registrationStore.lockWithdraw(score.registrationId)
        })
        
        set((state) => ({
          scores: state.scores.map((s) =>
            s.sessionId === sessionId && s.reviewStatus !== 'pending'
              ? { ...s, published: true }
              : s
          ),
        }))
        
        if (sessionScores.length > 0 && skippedCount === 0) {
          examStore.updateSession(sessionId, { status: 'finished' })
        }
        
        return { publishedCount: sessionScores.length, skippedCount }
      },
      getPublishableScores: (sessionId) => {
        return get().scores.filter(
          s => s.sessionId === sessionId && s.reviewStatus !== 'pending'
        )
      },
      getPendingReviews: () => {
        return get().scores.filter(s => s.reviewStatus === 'pending')
      },
      getBorderlineScores: (sessionId) => {
        const scores = get().scores.filter(s => s.isBorderline)
        if (sessionId) {
          return scores.filter(s => s.sessionId === sessionId)
        }
        return scores
      },
      getReviewsByRegistrationId: (registrationId) => {
        return get().scores
          .filter(s => s.registrationId === registrationId && s.reviewRecord)
          .map(s => s.reviewRecord!)
      },
      getReviewsByScoreId: (scoreId) => {
        const score = get().scores.find(s => s.id === scoreId)
        return score?.reviewRecord ? [score.reviewRecord] : []
      },
    }),
    { name: 'calligraphy-exam-scores' }
  )
)
