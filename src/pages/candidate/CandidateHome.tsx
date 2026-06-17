import { useNavigate } from 'react-router-dom'
import { Calendar, Users, DollarSign, ArrowRight } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { SessionStatusBadge } from '@/components/StatusBadge'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'

export default function CandidateHome() {
  const navigate = useNavigate()
  const { sessions } = useExamStore()
  const { registrations } = useRegistrationStore()

  const openSessions = sessions
    .filter((s) => s.status === 'open')
    .sort((a, b) => a.examDate.localeCompare(b.examDate))

  return (
    <Layout role="candidate">
      <div className="mb-6">
        <h2 className="font-serif font-bold text-2xl text-ink-900">考级场次</h2>
        <p className="text-sm text-dai-500 mt-1">选择场次报名，上传作品后缴费</p>
      </div>

      {openSessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-ink-200/50">
          <Calendar className="mx-auto text-ink-300 mb-3" size={48} />
          <p className="text-dai-500">暂无可报名的场次</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {openSessions.map((session) => {
            const regCount = registrations.filter((r) => r.sessionId === session.id).length
            const isFull = regCount >= session.maxSlots
            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-ink-200/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="brush-top px-5 py-3 flex items-center justify-between">
                  <LevelBadge level={session.level} />
                  <SessionStatusBadge status={session.status} />
                </div>
                <div className="p-5">
                  <div className="space-y-2.5 text-sm text-dai-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-dai-400" />
                      <span>{session.examDate} {session.examTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-dai-400" />
                      <span>{regCount}/{session.maxSlots} 人</span>
                      {isFull && <span className="text-vermilion-500 font-medium">已满</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={15} className="text-dai-400" />
                      <span className="text-vermilion-600 font-bold text-lg">¥{session.fee}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/candidate/register/${session.id}`)}
                    disabled={isFull}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-dai-800 hover:bg-dai-900 disabled:bg-ink-200 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {isFull ? '名额已满' : '立即报名'}
                    {!isFull && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
