import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Registration } from '@/types'
import { seedRegistrations } from './seedData'

interface RegistrationState {
  registrations: Registration[]
  addRegistration: (reg: Omit<Registration, 'id' | 'createdAt' | 'canWithdraw'>) => string | null
  updateRegistration: (id: string, updates: Partial<Registration>) => void
  deleteRegistration: (id: string) => void
  setWorkUploaded: (id: string, imageBase64: string) => void
  setPaid: (id: string) => void
  setStatus: (id: string, status: Registration['status']) => void
  lockWithdraw: (id: string) => void
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      registrations: seedRegistrations,
      addRegistration: (reg) => {
        const existing = get().registrations.find(
          (r) => r.sessionId === reg.sessionId && r.candidateName === reg.candidateName && r.candidatePhone === reg.candidatePhone
        )
        if (existing) return null
        const id = `reg-${Date.now()}`
        set((state) => ({
          registrations: [
            ...state.registrations,
            {
              ...reg,
              id,
              createdAt: new Date().toISOString(),
              canWithdraw: true,
            },
          ],
        }))
        return id
      },
      updateRegistration: (id, updates) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      deleteRegistration: (id) =>
        set((state) => ({
          registrations: state.registrations.filter((r) => r.id !== id),
        })),
      setWorkUploaded: (id, imageBase64) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? { ...r, workUploaded: true, workImageBase64: imageBase64, status: 'pending_payment' as const }
              : r
          ),
        })),
      setPaid: (id) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? { ...r, paid: true, paidAt: new Date().toISOString(), status: 'paid' as const }
              : r
          ),
        })),
      setStatus: (id, status) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        })),
      lockWithdraw: (id) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id ? { ...r, canWithdraw: false } : r
          ),
        })),
    }),
    { name: 'calligraphy-exam-registrations' }
  )
)
