import { useState } from 'react'
import { Send, Lock, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import ConfirmModal from '@/components/ConfirmModal'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useScoreStore } from '@/store/useScoreStore'
import { getLevelName, isBorderlineScore } from '@/types'

export default function ScorePublish() {
  const { sessions } = useExamStore()
  const { registrations } = useRegistrationStore()
  const { scores, publishScores, getPublishableScores } = useScoreStore()
  const [showPublish, setShowPublish] = useState<string | null>(null)
  const [published, setPublished] = useState<{ sessionId: string; count: number; skipped: number } | null>(null)

  const sessionsWithScores = sessions
    .map((session) => {
      const sessionRegs = registrations.filter((r) => r.sessionId === session.id && r.paid)
      const sessionScores = scores.filter((s) => s.sessionId === session.id)
      const hasUnscored = sessionRegs.some(
        (r) => !sessionScores.find((s) => s.registrationId === r.id)
      )
      const pendingReviewScores = sessionScores.filter((s) => s.reviewStatus === 'pending')
      const hasPendingReview = pendingReviewScores.length > 0
      const allPublished = sessionScores.length > 0 && sessionScores.every((s) => s.published)
      return {
        session,
        regCount: sessionRegs.length,
        scoredCount: sessionScores.length,
        hasUnscored,
        hasPendingReview,
        pendingReviewCount: pendingReviewScores.length,
        allPublished,
        scores: sessionScores,
      }
    })
    .filter((s) => s.regCount > 0)

  const handlePublish = (sessionId: string) => {
    const result = publishScores(sessionId)
    setShowPublish(null)
    setPublished({ sessionId, count: result.publishedCount, skipped: result.skippedCount })
    setTimeout(() => setPublished(null), 4000)
  }

  return (
    <Layout role="exam-center">
      <div className="mb-6">
        <h2 className="font-serif font-bold text-2xl text-ink-900">成绩发布</h2>
        <p className="text-sm text-dai-500 mt-1">发布后考生可查看成绩，报名不可撤回</p>
      </div>

      {sessionsWithScores.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-ink-200/50">
          <CheckCircle2 className="mx-auto text-ink-300 mb-3" size={48} />
          <p className="text-dai-500">暂无可发布的成绩数据</p>
          <p className="text-sm text-dai-400 mt-1">请等待评委录入成绩</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessionsWithScores.map(({ session, regCount, scoredCount, hasUnscored, hasPendingReview, pendingReviewCount, allPublished, scores: sessionScores }) => (
            <div key={session.id} className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
              <div className="brush-top px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LevelBadge level={session.level} />
                  <span className="text-sm text-dai-500">{session.examDate}</span>
                </div>
                {allPublished ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <Lock size={14} />
                    已发布
                  </span>
                ) : (
                  <button
                    onClick={() => setShowPublish(session.id)}
                    disabled={hasUnscored || hasPendingReview || scoredCount === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-vermilion-500 hover:bg-vermilion-600 disabled:bg-ink-200 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Send size={14} />
                    发布成绩
                  </button>
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <span className="text-dai-500">已缴费: <strong className="text-ink-800">{regCount}</strong> 人</span>
                  <span className="text-dai-500">已评审: <strong className="text-ink-800">{scoredCount}</strong> 人</span>
                  {hasUnscored && (
                    <span className="text-amber-600">
                      <AlertTriangle size={12} className="inline mr-1" />
                      还有未评审的考生
                    </span>
                  )}
                  {hasPendingReview && (
                    <span className="text-amber-600">
                      <Clock size={12} className="inline mr-1" />
                      还有 <strong>{pendingReviewCount}</strong> 份成绩待复核
                    </span>
                  )}
                </div>

                {sessionScores.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ink-100">
                          <th className="text-left py-2 px-3 text-dai-500 font-medium">考生</th>
                          <th className="text-left py-2 px-3 text-dai-500 font-medium">等级</th>
                          <th className="text-left py-2 px-3 text-dai-500 font-medium">分数</th>
                          <th className="text-left py-2 px-3 text-dai-500 font-medium">结果</th>
                          <th className="text-left py-2 px-3 text-dai-500 font-medium">评委</th>
                          <th className="text-left py-2 px-3 text-dai-500 font-medium">复核状态</th>
                          <th className="text-left py-2 px-3 text-dai-500 font-medium">发布状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionScores.map((sc) => (
                          <tr key={sc.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                            <td className="py-2.5 px-3 font-medium">{sc.candidateName}</td>
                            <td className="py-2.5 px-3">{getLevelName(sc.appliedLevel)}</td>
                            <td className="py-2.5 px-3 font-semibold">
                              <div className="flex items-center gap-1">
                                {sc.score}分
                                {isBorderlineScore(sc.score).isBorderline && (
                                  <span className="text-amber-500" title="临界线分数">
                                    <AlertTriangle size={12} />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                sc.result === '优秀' ? 'bg-amber-100 text-amber-800' :
                                sc.result === '良好' ? 'bg-blue-100 text-blue-800' :
                                sc.result === '合格' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {sc.result}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-dai-500">{sc.judgeName}</td>
                            <td className="py-2.5 px-3">
                              {sc.reviewStatus === 'pending' ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
                                  <Clock size={12} />
                                  待复核
                                </span>
                              ) : sc.reviewStatus === 'approved' && sc.reviewRecord ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                                  <CheckCircle2 size={12} />
                                  已复核通过
                                </span>
                              ) : sc.reviewStatus === 'approved' ? (
                                <span className="inline-flex items-center gap-1 text-dai-400 text-xs">
                                  无需复核
                                </span>
                              ) : sc.reviewStatus === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 text-dai-400 text-xs">
                                  <CheckCircle2 size={12} />
                                  复核驳回
                                </span>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3">
                              {sc.published ? (
                                <span className="text-green-600 flex items-center gap-1 text-xs">
                                  <CheckCircle2 size={14} /> 已发布
                                </span>
                              ) : sc.reviewStatus === 'pending' ? (
                                <span className="text-dai-400 text-xs">暂不发布</span>
                              ) : (
                                <span className="text-amber-600 text-xs">待发布</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!showPublish}
        title="发布成绩"
        message="成绩发布后，考生将可查看成绩，且报名不可撤回。请确认所有成绩已录入完毕。"
        confirmLabel="确认发布"
        variant="danger"
        onConfirm={() => showPublish && handlePublish(showPublish)}
        onCancel={() => setShowPublish(null)}
      />

      {published && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 size={18} />
          <div>
            <p className="font-medium">成绩已发布成功</p>
            <p className="text-xs text-green-100 mt-0.5">
              已发布 {published.count} 份成绩
              {published.skipped > 0 && `，跳过 ${published.skipped} 份待复核成绩`}
            </p>
          </div>
        </div>
      )}
    </Layout>
  )
}
