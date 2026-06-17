import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Registration, WorkVersion, WaitlistEntry, ReassignmentRecord, TimelineEvent } from '@/types'
import { checkJumpLevelEligibility, createTimelineEvent, calculateFeeDifference } from '@/types'
import { seedRegistrations } from './seedData'

interface RegistrationState {
  registrations: Registration[]
  addRegistration: (reg: Omit<Registration, 'id' | 'createdAt' | 'canWithdraw' | 'workVersions' | 'currentWorkVersion' | 'jumpLevelCheck' | 'paidAmount' | 'waitlistEntry' | 'reassignment' | 'timeline'>) => string | null
  updateRegistration: (id: string, updates: Partial<Registration>) => void
  deleteRegistration: (id: string) => void
  addWorkVersion: (id: string, imageBase64: string, note?: string) => WorkVersion
  setCurrentWorkVersion: (id: string, version: number) => void
  compareWorkVersions: (id: string, version1: number, version2: number) => { version1: WorkVersion; version2: WorkVersion } | null
  setPaid: (id: string, amount: number) => void
  setStatus: (id: string, status: Registration['status']) => void
  lockWithdraw: (id: string) => void
  addToWaitlist: (id: string) => WaitlistEntry | null
  removeFromWaitlist: (id: string) => void
  promoteFromWaitlist: (id: string, newSessionId: string) => Registration | null
  createReassignment: (id: string, oldSessionId: string, reason: string, newSessionId?: string) => ReassignmentRecord | null
  acceptReassignment: (id: string, newSessionId: string, newFee: number) => void
  rejectReassignment: (id: string) => void
  addTimelineEvent: (id: string, event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void
  approveJumpLevel: (id: string) => void
  rejectJumpLevel: (id: string, reason: string) => void
  getWaitlistBySession: (sessionId: string) => Registration[]
  getReassignmentsBySession: (sessionId: string) => Registration[]
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
        
        const jumpLevelCheck = checkJumpLevelEligibility(reg.appliedLevel, reg.passedLevel)
        
        const timeline: TimelineEvent[] = [
          createTimelineEvent('register', '提交报名', `${reg.candidateName} 提交了 ${reg.appliedLevel} 级考试报名`)
        ]
        
        if (!jumpLevelCheck.passed && jumpLevelCheck.approvalStatus === 'pending') {
          timeline.push(
            createTimelineEvent('register', '跳级待审核', jumpLevelCheck.reason)
          )
        }
        
        const id = `reg-${Date.now()}`
        set((state) => ({
          registrations: [
            ...state.registrations,
            {
              ...reg,
              id,
              jumpLevelCheck,
              workVersions: [],
              currentWorkVersion: 0,
              paidAmount: 0,
              canWithdraw: true,
              waitlistEntry: null,
              reassignment: null,
              timeline,
              createdAt: new Date().toISOString(),
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
      addWorkVersion: (id, imageBase64, note = '') => {
        const reg = get().registrations.find(r => r.id === id)
        if (!reg) throw new Error('Registration not found')
        
        const newVersion: WorkVersion = {
          id: `work-${Date.now()}`,
          version: reg.workVersions.length + 1,
          workImageBase64: imageBase64,
          uploadedAt: new Date().toISOString(),
          uploadNote: note,
        }
        
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  workUploaded: true,
                  workImageBase64: imageBase64,
                  workVersions: [...r.workVersions, newVersion],
                  currentWorkVersion: newVersion.version,
                  status: 'pending_payment',
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('upload', `上传作品 v${newVersion.version}`, note || '上传新作品版本'),
                  ],
                }
              : r
          ),
        }))
        
        return newVersion
      },
      setCurrentWorkVersion: (id, version) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  currentWorkVersion: version,
                  workImageBase64: r.workVersions.find(w => w.version === version)?.workImageBase64 || r.workImageBase64,
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('upload', '切换作品版本', `切换到作品版本 v${version}`)
                  ],
                }
              : r
          ),
        })),
      compareWorkVersions: (id, version1, version2) => {
        const reg = get().registrations.find(r => r.id === id)
        if (!reg) return null
        
        const v1 = reg.workVersions.find(w => w.version === version1)
        const v2 = reg.workVersions.find(w => w.version === version2)
        
        if (!v1 || !v2) return null
        
        return { version1: v1, version2: v2 }
      },
      setPaid: (id, amount) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  paid: true,
                  paidAmount: amount,
                  paidAt: new Date().toISOString(),
                  status: 'paid',
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('payment', '缴费完成', `已缴纳报名费 ¥${amount}`)
                  ],
                }
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
      addToWaitlist: (id) => {
        const reg = get().registrations.find(r => r.id === id)
        if (!reg) return null
        
        const sessionRegs = get().registrations.filter(r => r.sessionId === reg.sessionId && r.waitlistEntry)
        const position = sessionRegs.length + 1
        
        const waitlistEntry: WaitlistEntry = {
          id: `waitlist-${Date.now()}`,
          registrationId: id,
          position,
          joinedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'waitlist',
                  waitlistEntry,
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('waitlist', '加入候补队列', `当前候补位次：第 ${position} 位`)
                  ],
                }
              : r
          ),
        }))
        
        return waitlistEntry
      },
      removeFromWaitlist: (id) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: r.paid ? 'paid' : 'pending_payment',
                  waitlistEntry: null,
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('waitlist', '退出候补队列', '已退出候补队列')
                  ],
                }
              : r
          ),
        })),
      promoteFromWaitlist: (id, newSessionId) => {
        const reg = get().registrations.find(r => r.id === id)
        if (!reg) return null
        
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  sessionId: newSessionId,
                  status: 'paid',
                  waitlistEntry: null,
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('waitlist', '候补成功', '候补成功，已分配正式考位')
                  ],
                }
              : r
          ),
        }))
        
        return { ...reg, sessionId: newSessionId, status: 'paid', waitlistEntry: null } as Registration
      },
      createReassignment: (id, oldSessionId, reason, newSessionId) => {
        const reg = get().registrations.find(r => r.id === id)
        if (!reg) return null
        
        const reassignment: ReassignmentRecord = {
          id: `reassign-${Date.now()}`,
          registrationId: id,
          oldSessionId,
          newSessionId: newSessionId || null,
          reason,
          feeDifference: 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'pending_reassign',
                  reassignment,
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('reassign', '场地调整待改派', reason)
                  ],
                }
              : r
          ),
        }))
        
        return reassignment
      },
      acceptReassignment: (id, newSessionId, newFee) =>
        set((state) => {
          const reg = state.registrations.find(r => r.id === id)
          if (!reg || !reg.reassignment) return state
          
          const feeDiff = calculateFeeDifference(reg.paidAmount, newFee)
          
          return {
            registrations: state.registrations.map((r) =>
              r.id === id
                ? {
                    ...r,
                    sessionId: newSessionId,
                    status: 'paid',
                    reassignment: {
                      ...r.reassignment!,
                      newSessionId,
                      feeDifference: feeDiff,
                      status: 'accepted',
                    },
                    timeline: [
                      ...r.timeline,
                      createTimelineEvent('reassign', '接受改派', `已改派至新场次，费用差额：${feeDiff >= 0 ? '需补缴' : '可退还'} ¥${Math.abs(feeDiff)}`)
                    ],
                  }
                : r
            ),
          }
        }),
      rejectReassignment: (id) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'waitlist',
                  reassignment: null,
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('reassign', '拒绝改派', '已拒绝改派，转入候补队列')
                  ],
                }
              : r
          ),
        })),
      addTimelineEvent: (id, event) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  timeline: [...r.timeline, createTimelineEvent(event.type, event.title, event.description, event.metadata)],
                }
              : r
          ),
        })),
      approveJumpLevel: (id) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id && r.jumpLevelCheck
              ? {
                  ...r,
                  jumpLevelCheck: {
                    ...r.jumpLevelCheck,
                    approvalStatus: 'approved',
                    passed: true,
                  },
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('register', '跳级申请已批准', '跳级报考申请已通过审核')
                  ],
                }
              : r
          ),
        })),
      rejectJumpLevel: (id, reason) =>
        set((state) => ({
          registrations: state.registrations.map((r) =>
            r.id === id && r.jumpLevelCheck
              ? {
                  ...r,
                  jumpLevelCheck: {
                    ...r.jumpLevelCheck,
                    approvalStatus: 'rejected',
                    passed: false,
                    reason,
                  },
                  timeline: [
                    ...r.timeline,
                    createTimelineEvent('register', '跳级申请被拒绝', reason)
                  ],
                }
              : r
          ),
        })),
      getWaitlistBySession: (sessionId) => {
        return get().registrations.filter(r => r.sessionId === sessionId && r.status === 'waitlist')
      },
      getReassignmentsBySession: (sessionId) => {
        return get().registrations.filter(r => r.reassignment?.oldSessionId === sessionId && r.status === 'pending_reassign')
      },
    }),
    { name: 'calligraphy-exam-registrations' }
  )
)
