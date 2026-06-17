import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExamSession } from '@/types'
import { getLevelCategory } from '@/types'
import { seedSessions } from './seedData'

interface ExamState {
  sessions: ExamSession[]
  addSession: (session: Omit<ExamSession, 'id' | 'levelCategory' | 'registeredCount' | 'createdAt'>) => void
  updateSession: (id: string, updates: Partial<ExamSession>) => void
  deleteSession: (id: string) => void
  incrementRegistered: (sessionId: string) => void
  decrementRegistered: (sessionId: string) => void
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      sessions: seedSessions,
      addSession: (session) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              ...session,
              id: `session-${Date.now()}`,
              levelCategory: getLevelCategory(session.level),
              registeredCount: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),
      incrementRegistered: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, registeredCount: s.registeredCount + 1 }
              : s
          ),
        })),
      decrementRegistered: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, registeredCount: Math.max(0, s.registeredCount - 1) }
              : s
          ),
        })),
    }),
    { name: 'calligraphy-exam-sessions' }
  )
)
