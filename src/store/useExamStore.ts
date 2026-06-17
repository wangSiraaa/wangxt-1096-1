import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExamSession, Venue } from '@/types'
import { getLevelCategory } from '@/types'
import { seedSessions, seedVenues } from './seedData'

interface ExamState {
  sessions: ExamSession[]
  venues: Venue[]
  addVenue: (venue: Omit<Venue, 'id'>) => Venue
  updateVenue: (id: string, updates: Partial<Venue>) => void
  deleteVenue: (id: string) => void
  addSession: (session: Omit<ExamSession, 'id' | 'levelCategory' | 'registeredCount' | 'waitlistCount' | 'createdAt'>) => void
  updateSession: (id: string, updates: Partial<ExamSession>) => void
  deleteSession: (id: string) => void
  incrementRegistered: (sessionId: string) => void
  decrementRegistered: (sessionId: string) => void
  incrementWaitlist: (sessionId: string) => void
  decrementWaitlist: (sessionId: string) => void
  adjustVenue: (sessionId: string, newVenueId: string, reason: string) => { affectedCount: number }
  getAvailableSessions: (level?: number) => ExamSession[]
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      sessions: seedSessions,
      venues: seedVenues,
      addVenue: (venue) => {
        const newVenue: Venue = {
          ...venue,
          id: `venue-${Date.now()}`,
        }
        set((state) => ({
          venues: [...state.venues, newVenue],
        }))
        return newVenue
      },
      updateVenue: (id, updates) =>
        set((state) => ({
          venues: state.venues.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),
      deleteVenue: (id) =>
        set((state) => ({
          venues: state.venues.filter((v) => v.id !== id),
        })),
      addSession: (session) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              ...session,
              id: `session-${Date.now()}`,
              levelCategory: getLevelCategory(session.level),
              registeredCount: 0,
              waitlistCount: 0,
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
      incrementWaitlist: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, waitlistCount: s.waitlistCount + 1 }
              : s
          ),
        })),
      decrementWaitlist: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, waitlistCount: Math.max(0, s.waitlistCount - 1) }
              : s
          ),
        })),
      adjustVenue: (sessionId, newVenueId, reason) => {
        const { sessions, venues } = get()
        const session = sessions.find(s => s.id === sessionId)
        const newVenue = venues.find(v => v.id === newVenueId)
        
        if (!session || !newVenue) return { affectedCount: 0 }
        
        const { useRegistrationStore } = require('./useRegistrationStore')
        const registrationStore = useRegistrationStore.getState()
        
        const affectedRegs = registrationStore.registrations.filter(
          r => r.sessionId === sessionId && r.paid && r.status !== 'completed'
        )
        
        affectedRegs.forEach(reg => {
          registrationStore.createReassignment(reg.id, sessionId, reason)
        })
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  venueId: newVenueId,
                  venue: newVenue,
                  status: 'adjusted',
                }
              : s
          ),
        }))
        
        return { affectedCount: affectedRegs.length }
      },
      getAvailableSessions: (level) => {
        const { sessions } = get()
        return sessions.filter(s => {
          if (s.status !== 'open') return false
          if (level && s.level !== level) return false
          return s.registeredCount < s.maxSlots
        })
      },
    }),
    { name: 'calligraphy-exam-sessions' }
  )
)
