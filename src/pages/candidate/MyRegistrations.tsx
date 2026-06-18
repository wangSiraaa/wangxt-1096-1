import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, Image, CreditCard, Trophy, Undo2, AlertTriangle, Eye, 
  ChevronRight, CheckCircle2, XCircle, FileText, MapPin, 
  Calendar, UserCheck, GitCompare, RefreshCw, Star 
} from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { RegistrationStatusBadge } from '@/components/StatusBadge'
import ConfirmModal from '@/components/ConfirmModal'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useScoreStore } from '@/store/useScoreStore'
import { getScoreResult, getLevelName, getRegistrationStatusText } from '@/types'
import type { Registration, TimelineEvent } from '@/types'

const TimelineIcon = ({ type }: { type: TimelineEvent['type'] }) => {
  const icons = {
    register: FileText,
    upload: Image,
    payment: CreditCard,
    waitlist: Clock,
    reassign: RefreshCw,
    score: Star,
    review: AlertTriangle,
    publish: Eye,
    result: Trophy,
  }
  const Icon = icons[type] || Clock
  const colors = {
    register: 'text-blue-500 bg-blue-100',
    upload: 'text-green-500 bg-green-100',
    payment: 'text-vermilion-500 bg-vermilion-100',
    waitlist: 'text-amber-500 bg-amber-100',
    reassign: 'text-orange-500 bg-orange-100',
    score: 'text-purple-500 bg-purple-100',
    review: 'text-red-500 bg-red-100',
    publish: 'text-indigo-500 bg-indigo-100',
    result: 'text-emerald-500 bg-emerald-100',
  }
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[type]}`}>
      <Icon size={18} />
    </div>
  )
}

export default function MyRegistrations() {
  const navigate = useNavigate()
  const { sessions, decrementRegistered, venues } = useExamStore()
  const { registrations, deleteRegistration } = useRegistrationStore()
  const { scores, getReviewsByRegistrationId } = useScoreStore()
  const [withdrawId, setWithdrawId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [expandedReg, setExpandedReg] = useState<string | null>(null)
  const [showVersionCompare, setShowVersionCompare] = useState(false)
  const [compareReg, setCompareReg] = useState<Registration | null>(null)

  const myRegs = [...registrations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const handleWithdraw = (reg: Registration) => {
    if (!reg.canWithdraw) return
    deleteRegistration(reg.id)
    decrementRegistered(reg.sessionId)
    setWithdrawId(null)
  }

  const getRegScore = (regId: string) => scores.find((s) => s.registrationId === regId && s.published)
  const getSession = (sessionId: string) => sessions.find((s) => s.id === sessionId)
  const getVenue = (venueId?: string) => venues.find(v => v.id === venueId)

  const getTimelineEvents = (reg: Registration): TimelineEvent[] => {
    const events: TimelineEvent[] = reg.timeline || []
    const session = getSession(reg.sessionId)
    const score = getRegScore(reg.id)
    const reviews = getReviewsByRegistrationId(reg.id)

    if (score && !events.some(e => e.type === 'result')) {
      events.push({
        id: `result-${reg.id}`,
        type: 'result',
        title: '成绩发布',
        description: `${score.score}分 · ${score.result}`,
        timestamp: score.scoredAt || new Date().toISOString(),
      })
    }

    reviews.forEach((review) => {
      if (!events.some(e => e.id === `review-${review.id}`)) {
        events.push({
          id: `review-${review.id}`,
          type: 'review',
          title: review.status === 'approved' ? '复核通过' : review.status === 'rejected' ? '复核不通过' : '待复核',
          description: review.reason,
          timestamp: review.createdAt,
        })
      }
    })

    return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  return (
    <Layout role="candidate">
      <div className="mb-6">
        <h2 className="font-serif font-bold text-2xl text-ink-900">我的报名</h2>
        <p className="text-sm text-dai-500 mt-1">查看报名状态、作品管理、缴费记录及成绩</p>
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
            const venue = session?.venueId ? getVenue(session.venueId) : null
            const score = getRegScore(reg.id)
            const reviews = getReviewsByRegistrationId(reg.id)
            const timeline = getTimelineEvents(reg)
            const isExpanded = expandedReg === reg.id

            if (!session) return null

            return (
              <div key={reg.id} className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
                <div 
                  className="px-5 py-4 flex items-center justify-between border-b border-ink-100 cursor-pointer hover:bg-ink-50/50 transition-colors"
                  onClick={() => setExpandedReg(isExpanded ? null : reg.id)}
                >
                  <div className="flex items-center gap-4">
                    <LevelBadge level={reg.appliedLevel} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-ink-900">{getLevelName(reg.appliedLevel)}</h3>
                        <RegistrationStatusBadge status={reg.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-dai-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {session.examDate} {session.examTime}
                        </span>
                        {venue && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {venue.name}
                          </span>
                        )}
                        {reg.workVersions.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Image size={12} />
                            {reg.workVersions.length}个版本
                          </span>
                        )}
                        {reviews.length > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {reviews.length}次复核
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {score && (
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          score.result === '优秀' ? 'text-amber-600' :
                          score.result === '良好' ? 'text-blue-600' :
                          score.result === '合格' ? 'text-green-600' : 'text-vermilion-600'
                        }`}>
                          {score.score}
                        </p>
                        <p className="text-xs text-dai-500">{score.result}</p>
                      </div>
                    )}
                    {reg.waitlistEntry && (
                      <div className="text-center px-3 py-1 bg-amber-100 rounded-lg">
                        <p className="text-xs text-amber-600">候补</p>
                        <p className="text-sm font-bold text-amber-700">#{reg.waitlistEntry.position}</p>
                      </div>
                    )}
                    <ChevronRight 
                      size={20} 
                      className={`text-dai-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-ink-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
                      <div className="space-y-4">
                        <div className="bg-ink-50 rounded-xl p-4">
                          <h4 className="font-medium text-ink-800 text-sm mb-3">报名信息</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-dai-500">考生姓名</span>
                              <span className="font-medium text-ink-800">{reg.candidateName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dai-500">联系电话</span>
                              <span className="text-ink-800">{reg.candidatePhone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dai-500">报考等级</span>
                              <span className="font-medium text-ink-800">{reg.appliedLevel}级</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dai-500">已通过等级</span>
                              <span className="text-ink-800">{reg.passedLevel === 0 ? '无' : `${reg.passedLevel}级`}</span>
                            </div>
                            {reg.jumpLevelCheck && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-700 font-medium">跳级报考</p>
                                <p className="text-xs text-blue-600 mt-1">{reg.jumpLevelCheck.reason}</p>
                              </div>
                            )}
                            {reg.reassignment && (
                              <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-xs text-orange-700 font-medium">场地改派</p>
                                <p className="text-xs text-orange-600 mt-1">{reg.reassignment.reason}</p>
                                {reg.reassignment.feeDifference !== 0 && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    费用差额：{reg.reassignment.feeDifference > 0 ? '+' : ''}¥{reg.reassignment.feeDifference}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {reg.workVersions.length > 0 && (
                          <div className="bg-ink-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-ink-800 text-sm">作品版本</h4>
                              {reg.workVersions.length >= 2 && (
                                <button
                                  onClick={() => { setCompareReg(reg); setShowVersionCompare(true) }}
                                  className="flex items-center gap-1 text-xs text-vermilion-600 hover:text-vermilion-700"
                                >
                                  <GitCompare size={12} />
                                  版本比对
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {reg.workVersions.map((v) => (
                                <div
                                  key={v.id}
                                  className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                    reg.currentWorkVersion === v.version
                                      ? 'border-vermilion-500'
                                      : 'border-ink-200 hover:border-ink-300'
                                  }`}
                                  onClick={() => setPreviewImage(v.workImageBase64)}
                                >
                                  <img src={v.workImageBase64} alt={`v${v.version}`} className="w-full h-16 object-cover" />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                                    v{v.version}
                                  </div>
                                  {reg.currentWorkVersion === v.version && (
                                    <div className="absolute top-0 right-0 bg-vermilion-500 text-white text-xs px-1.5 py-0.5 rounded-bl">
                                      当前
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-ink-50 rounded-xl p-4">
                          <h4 className="font-medium text-ink-800 text-sm mb-3">缴费信息</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-dai-500">报名费用</span>
                              <span className="text-ink-800">¥{session.fee}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dai-500">支付状态</span>
                              <span className={`font-medium ${reg.paid ? 'text-green-600' : 'text-amber-600'}`}>
                                {reg.paid ? '已支付' : '待支付'}
                              </span>
                            </div>
                            {reg.paid && reg.paidAt && (
                              <div className="flex justify-between">
                                <span className="text-dai-500">支付时间</span>
                                <span className="text-ink-800">{new Date(reg.paidAt).toLocaleString()}</span>
                              </div>
                            )}
                            {reg.paidAmount && (
                              <div className="flex justify-between">
                                <span className="text-dai-500">支付金额</span>
                                <span className="font-medium text-ink-800">¥{reg.paidAmount}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {reg.status === 'pending_upload' && (
                            <button
                              onClick={() => navigate(`/candidate/register/${reg.sessionId}?phone=${encodeURIComponent(reg.candidatePhone)}`)}
                              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <Image size={14} /> 上传作品
                            </button>
                          )}
                          {reg.status === 'pending_payment' && (
                            <button
                              onClick={() => navigate(`/candidate/register/${reg.sessionId}?phone=${encodeURIComponent(reg.candidatePhone)}`)}
                              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-vermilion-500 hover:bg-vermilion-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <CreditCard size={14} /> 去缴费
                            </button>
                          )}
                          {reg.status === 'pending_reassign' && (
                            <button
                              onClick={() => navigate('/exam')}
                              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <RefreshCw size={14} /> 处理改派
                            </button>
                          )}
                          {reg.canWithdraw && reg.status !== 'completed' && (
                            <button
                              onClick={() => setWithdrawId(reg.id)}
                              className="flex items-center justify-center gap-1 px-4 py-2.5 bg-white border border-ink-200 text-dai-500 hover:text-vermilion-600 hover:border-vermilion-200 text-sm font-medium rounded-lg transition-colors"
                            >
                              <Undo2 size={14} /> 撤回
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-ink-800 text-sm mb-4 flex items-center gap-2">
                          <Clock size={16} className="text-vermilion-500" />
                          流程时间轴
                        </h4>
                        <div className="relative">
                          {timeline.map((event, idx) => (
                            <div key={event.id} className="flex gap-4 mb-6 last:mb-0">
                              <div className="flex flex-col items-center">
                                <TimelineIcon type={event.type} />
                                {idx < timeline.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-ink-200 mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pt-2">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-ink-800 text-sm">{event.title}</p>
                                  <span className="text-xs text-dai-400">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-dai-600 mt-1">{event.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      {showVersionCompare && compareReg && compareReg.workVersions.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-ink-200">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  {compareReg.candidateName} - 作品版本比对
                </h3>
                <button onClick={() => { setShowVersionCompare(false); setCompareReg(null) }} className="text-dai-400 hover:text-ink-600">
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {compareReg.workVersions.slice(-2).map((v, idx) => (
                  <div key={v.id}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-ink-800">版本 v{v.version}</p>
                      <p className="text-xs text-dai-400">
                        {new Date(v.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="border border-ink-200 rounded-lg overflow-hidden">
                      <img
                        src={v.workImageBase64}
                        alt={`版本 v${v.version}`}
                        className="w-full h-80 object-contain bg-ink-50"
                      />
                    </div>
                    {v.uploadNote && (
                      <p className="text-xs text-dai-500 mt-2 italic">{v.uploadNote}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
