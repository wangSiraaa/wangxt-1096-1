import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Score } from '@/types'
import { getScoreResult } from '@/types'
import { seedScores } from './seedData'

interface ScoreState {
  scores: Score[]
  addScore: (score: Omit<Score, 'id' | 'result' | 'createdAt'>) => void
  updateScore: (id: string, updates: Partial<Score>) => void
  publishScores: (sessionId: string) => void
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set) => ({
      scores: seedScores,
      addScore: (score) =>
        set((state) => ({
          scores: [
            ...state.scores,
            {
              ...score,
              id: `score-${Date.now()}`,
              result: getScoreResult(score.score),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateScore: (id, updates) =>
        set((state) => ({
          scores: state.scores.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      publishScores: (sessionId) =>
        set((state) => ({
          scores: state.scores.map((s) =>
            s.sessionId === sessionId ? { ...s, published: true } : s
          ),
        })),
    }),
    { name: 'calligraphy-exam-scores' }
  )
)
