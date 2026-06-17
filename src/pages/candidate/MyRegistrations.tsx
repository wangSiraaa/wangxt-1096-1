import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Image, CreditCard, Trophy, Undo2, AlertTriangle, Eye } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { RegistrationStatusBadge } from '@/components/StatusBadge'
import ConfirmModal from '@/components/ConfirmModal'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useScoreStore } from '@/store/useScoreStore'
import type { Registration } from '@/types'

export default function MyRegistrations() {
  const navigate = useNavigate()
  const { sessions, decrementRegistered } = useExamStore()
  const { registrations, deleteRegistration } = useRegistrationStore()
  const { scores } = useScoreStore()
  const [withdrawId, setWithdrawId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const myRegs = [...registrations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const handleWithdraw = (reg: Registration) => {
    if (!reg.canWithdraw) return
    deleteRegistration(reg.id)
    decrementRegistered(reg.sessionId)
    setWithdrawId(null)
  }

  const getRegScore = (regId: string) => scores.find((s) => s.registrationId === regId && s.published)
  const getSession = (sessionId: string) => sessions.find((s) => s.id === sessionId)

  return (
    <Layout role="candidate">
      <div className="mb-6">
        <h2 className="font-serif font-bold text-2xl text-ink-900">我的报名</h2>
        <p className="text-sm text-dai-500 mt-1">查看报名状态、上传作品、缴费</p>
      </div>

      {myRegs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-ink-200/50">
          <Clock className="mx-auto text-ink-300 mb-3" size={48} />
          <p className="text-dai-500">暂无报名记录</p>
          <button
            onClick={() => navigate('/candidate')}
            className="mt-4 text-vermilion-500 text-sm hover:underline"
          >
            去浏览场次
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myRegs.map((reg) => {
            const session = getSession(reg.sessionId)
            const score = getRegScore(reg.id)
            if (!session) return null

            return (
              <div key={reg.id} className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between border-b border-ink-100">
                  <div className="flex items-center gap-3">
                    <LevelBadge level={reg.appliedLevel} />
                    <RegistrationStatusBadge status={reg.status} />
                  </div>
                  <span className="text-xs text-dai-400">{session.examDate}</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 text-sm">
                      <p><span className="text-dai-500">姓名：</span><span className="font-medium">{reg.candidateName}</span></p>
                      <p><span className="text-dai-500">报考等级：</span>{reg.appliedLevel}级</p>
                      <p><span className="text-dai-500">已通过：</span>{reg.passedLevel === 0 ? '无' : `${reg.passedLevel}级`}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {reg.status === 'pending_upload' && (
                        <button
                          onClick={() => navigate(`/candidate/register/${reg.sessionId}`)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Image size={14} /> 上传作品
                        </button>
                      )}
                      {reg.status === 'pending_payment' && (
                        <button
                          onClick={() => navigate(`/candidate/register/${reg.sessionId}`)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-vermilion-500 hover:bg-vermilion-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <CreditCard size={14} /> 去缴费
                        </button>
                      )}
                      {reg.canWithdraw && reg.status !== 'completed' && (
                        <button
                          onClick={() => setWithdrawId(reg.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-ink-200 text-dai-500 hover:text-vermilion-600 hover:border-vermilion-200 text-xs font-medium rounded-lg transition-colors"
                        >
                          <Undo2 size={14} /> 撤回
                        </button>
                      )}
                      {!reg.canWithdraw && (
                        <span className="flex items-center gap-1 text-xs text-dai-400">
                          <Lock size={12} /> 不可撤回
                        </span>
                      )}
                    </div>
                  </div>

                  {reg.workUploaded && reg.workImageBase64 && (
                    <div className="mt-3 flex items-center gap-2">
                      <img
                        src={reg.workImageBase64}
                        alt="作品"
                        className="w-12 h-12 object-cover rounded border border-ink-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImage(reg.workImageBase64)}
                      />
                      <button
                        onClick={() => setPreviewImage(reg.workImageBase64)}
                        className="flex items-center gap-1 text-xs text-dai-500 hover:text-vermilion-500"
                      >
                        <Eye size={14} /> 查看作品
                      </button>
                    </div>
                  )}

                  {!reg.workUploaded && reg.status === 'pending_upload' && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-xs text-amber-700">
                      <AlertTriangle size={14} />
                      请先上传作品才能缴费
                    </div>
                  )}

                  {score && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy size={16} className="text-green-600" />
                        <span className="font-medium text-green-800 text-sm">成绩已发布</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-green-600">分数</span>
                          <p className="font-bold text-lg text-ink-900">{score.score}分</p>
                        </div>
                        <div>
                          <span className="text-green-600">结果</span>
                          <p className={`font-bold text-lg ${
                            score.result === '优秀' ? 'text-amber-600' :
                            score.result === '良好' ? 'text-blue-600' :
                            score.result === '合格' ? 'text-green-600' : 'text-vermilion-600'
                          }`}>{score.result}</p>
                        </div>
                        <div>
                          <span className="text-green-600">评语</span>
                          <p className="text-dai-600 text-xs mt-0.5">{score.comment || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={!!withdrawId}
        title="撤回报名"
        message="确定要撤回该报名吗？撤回后需要重新报名。"
        confirmLabel="确定撤回"
        variant="warning"
        onConfirm={() => {
          const reg = registrations.find((r) => r.id === withdrawId)
          if (reg) handleWithdraw(reg)
        }}
        onCancel={() => setWithdrawId(null)}
      />

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="max-w-3xl max-h-[80vh] animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="作品大图" className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain" />
          </div>
        </div>
      )}
    </Layout>
  )
}

function Lock({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
