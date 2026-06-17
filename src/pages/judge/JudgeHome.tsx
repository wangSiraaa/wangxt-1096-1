import { useNavigate } from 'react-router-dom'
import { Gavel, Eye } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useScoreStore } from '@/store/useScoreStore'

export default function JudgeHome() {
  const navigate = useNavigate()
  const { sessions } = useExamStore()
  const { registrations } = useRegistrationStore()
  const { scores } = useScoreStore()

  const paidRegs = registrations.filter((r) => r.paid)

  const sessionsWithRegs = sessions
    .map((session) => {
      const sessionRegs = paidRegs.filter((r) => r.sessionId === session.id)
      const sessionScores = scores.filter((s) => s.sessionId === session.id)
      const unscoredRegs = sessionRegs.filter(
        (r) => !sessionScores.find((s) => s.registrationId === r.id)
      )
      return { session, sessionRegs, unscoredRegs, scoredCount: sessionScores.length }
    })
    .filter((s) => s.sessionRegs.length > 0)

  return (
    <Layout role="judge">
      <div className="mb-6">
        <h2 className="font-serif font-bold text-2xl text-ink-900">评审工作台</h2>
        <p className="text-sm text-dai-500 mt-1">查看已缴费考生作品，录入成绩</p>
      </div>

      {sessionsWithRegs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-ink-200/50">
          <Gavel className="mx-auto text-ink-300 mb-3" size={48} />
          <p className="text-dai-500">暂无待评审的考生</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessionsWithRegs.map(({ session, sessionRegs, unscoredRegs, scoredCount }) => (
            <div key={session.id} className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
              <div className="brush-top px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LevelBadge level={session.level} />
                  <span className="text-sm text-dai-500">{session.examDate}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-dai-500">待评审: <strong className="text-ink-800">{unscoredRegs.length}</strong></span>
                  <span className="text-dai-500">已评审: <strong className="text-green-600">{scoredCount}</strong></span>
                </div>
              </div>

              <div className="divide-y divide-ink-50">
                {sessionRegs.map((reg) => {
                  const hasScore = scores.find((s) => s.registrationId === reg.id)
                  return (
                    <div key={reg.id} className="px-5 py-3 flex items-center justify-between hover:bg-ink-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {reg.workUploaded && reg.workImageBase64 ? (
                          <img
                            src={reg.workImageBase64}
                            alt="作品"
                            className="w-10 h-10 object-cover rounded border border-ink-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-ink-100 rounded flex items-center justify-center text-dai-400 text-xs">
                            无图
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-ink-900">{reg.candidateName}</p>
                          <p className="text-xs text-dai-400">报考{reg.appliedLevel}级 · {reg.candidatePhone}</p>
                        </div>
                      </div>

                      {hasScore ? (
                        <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                          <Eye size={14} /> 已评分: {hasScore.score}分 ({hasScore.result})
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/judge/score/${reg.id}`)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-dai-800 hover:bg-dai-900 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Gavel size={14} />
                          录入成绩
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
