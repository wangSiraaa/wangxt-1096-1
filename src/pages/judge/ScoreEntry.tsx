import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Star, AlertTriangle, Eye, GitCompare, Clock, CheckCircle2, XCircle, User, FileText } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useExamStore } from '@/store/useExamStore'
import { useScoreStore } from '@/store/useScoreStore'
import { getScoreResult, getLevelName, isBorderlineScore } from '@/types'
import type { WorkVersion } from '@/types'

export default function ScoreEntry() {
  const { registrationId } = useParams<{ registrationId: string }>()
  const navigate = useNavigate()
  const { registrations, setStatus } = useRegistrationStore()
  const { sessions, venues } = useExamStore()
  const { addScore, scores, requestReview, getPendingReviews, getReviewsByScoreId } = useScoreStore()

  const reg = registrations.find((r) => r.id === registrationId)
  const session = reg ? sessions.find((s) => s.id === reg.sessionId) : null
  const venue = session?.venueId ? venues.find(v => v.id === session.venueId) : null
  const existingScore = reg ? scores.find((s) => s.registrationId === reg.id) : null
  const reviews = existingScore ? getReviewsByScoreId(existingScore.id) : []

  const [scoreValue, setScoreValue] = useState(existingScore?.score ?? 0)
  const [comment, setComment] = useState(existingScore?.comment ?? '')
  const [judgeName] = useState('评委老师')
  const [showVersionCompare, setShowVersionCompare] = useState(false)
  const [compareVersions, setCompareVersions] = useState<{v1: WorkVersion; v2: WorkVersion} | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewReason, setReviewReason] = useState('')
  const [showReviewProcessModal, setShowReviewProcessModal] = useState(false)
  const [reviewJudgeName, setReviewJudgeName] = useState('')
  const [reviewFinalScore, setReviewFinalScore] = useState(0)
  const [pendingReview, setPendingReview] = useState<typeof reviews[0] | null>(null)

  const borderlineCheck = useMemo(() => isBorderlineScore(scoreValue), [scoreValue])
  const workVersions = reg?.workVersions || []

  if (!reg || !session) {
    return (
      <Layout role="judge">
        <div className="text-center py-20">
          <p className="text-dai-500">报名记录不存在</p>
          <button onClick={() => navigate('/judge')} className="mt-4 text-vermilion-500 text-sm">
            返回列表
          </button>
        </div>
      </Layout>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (scoreValue <= 0) return

    if (existingScore) {
      useScoreStore.getState().updateScore(existingScore.id, {
        score: scoreValue,
        result: getScoreResult(scoreValue),
        comment,
        judgeName,
      })
    } else {
      addScore({
        registrationId: reg.id,
        sessionId: session.id,
        candidateName: reg.candidateName,
        appliedLevel: reg.appliedLevel,
        judgeName,
        score: scoreValue,
        comment,
        published: false,
      })
      setStatus(reg.id, borderlineCheck.isBorderline ? 'pending_review' : 'scored')
    }

    if (borderlineCheck.isBorderline) {
      setShowReviewModal(true)
    } else {
      navigate('/judge')
    }
  }

  const handleRequestReview = () => {
    if (!existingScore || !reviewReason) return
    requestReview(existingScore.id, reviewReason)
    setShowReviewModal(false)
    setReviewReason('')
    navigate('/judge')
  }

  const handleCompareVersions = (v1: number, v2: number) => {
    const version1 = workVersions.find(w => w.version === v1)
    const version2 = workVersions.find(w => w.version === v2)
    if (version1 && version2) {
      setCompareVersions({ v1: version1, v2: version2 })
      setShowVersionCompare(true)
    }
  }

  const handleOpenReviewProcess = (review: typeof reviews[0]) => {
    setPendingReview(review)
    setReviewJudgeName('')
    setReviewFinalScore(review.initialScore)
    setShowReviewProcessModal(true)
  }

  const handleCompleteReview = (approved: boolean) => {
    if (!pendingReview || !reviewJudgeName.trim()) return
    useScoreStore.getState().completeReview(
      pendingReview.id,
      reviewFinalScore,
      reviewJudgeName,
      approved
    )
    setShowReviewProcessModal(false)
    setPendingReview(null)
    setReviewJudgeName('')
  }

  const result = getScoreResult(scoreValue)
  const resultColor =
    result === '优秀' ? 'text-amber-600' :
    result === '良好' ? 'text-blue-600' :
    result === '合格' ? 'text-green-600' : 'text-vermilion-600'

  const currentWorkVersion = reg.currentWorkVersion 
    ? workVersions.find(w => w.version === reg.currentWorkVersion)
    : workVersions[workVersions.length - 1]

  return (
    <Layout role="judge">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/judge')}
          className="flex items-center gap-1 text-sm text-dai-500 hover:text-ink-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          返回评审列表
        </button>

        {borderlineCheck.isBorderline && scoreValue > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="font-medium text-amber-800">⚠️ 临界线分数提醒</h4>
              <p className="text-sm text-amber-700 mt-1">{borderlineCheck.reason}</p>
              <p className="text-xs text-amber-600 mt-2">
                该分数接近合格线上下3分区间，系统建议发起复核流程。
              </p>
            </div>
          </div>
        )}

        {reg.status === 'pending_review' && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-start gap-4">
            <Clock className="text-orange-500 shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="font-medium text-orange-800">⏳ 待复核状态</h4>
              <p className="text-sm text-orange-700 mt-1">该考生成绩已进入复核流程</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
              <div className="brush-top px-5 py-3 flex items-center justify-between">
                <h3 className="font-serif font-bold text-ink-900">考生作品</h3>
                {workVersions.length > 0 && (
                  <span className="text-xs text-dai-500">
                    共 {workVersions.length} 个版本，当前 v{currentWorkVersion?.version}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-dai-500">考生信息</p>
                    <p className="font-medium text-ink-800">{reg.candidateName}</p>
                    <p className="text-dai-400 text-xs">{reg.candidatePhone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-dai-500">考试信息</p>
                    <div className="flex items-center gap-2">
                      <LevelBadge level={reg.appliedLevel} />
                      <span className="font-medium text-ink-800">{getLevelName(reg.appliedLevel)}</span>
                    </div>
                    <p className="text-dai-400 text-xs">{session.examDate} {session.examTime}</p>
                  </div>
                </div>

                {venue && (
                  <div className="mb-4 p-3 bg-ink-50 rounded-lg text-sm flex items-center gap-2">
                    <User size={14} className="text-dai-400" />
                    <span className="text-dai-600">考场：{venue.name} · {venue.address}</span>
                  </div>
                )}

                {reg.jumpLevelCheck && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="font-medium text-blue-800">📋 跳级报考</p>
                    <p className="text-blue-700 mt-1 text-xs">
                      从 {reg.passedLevel} 级跳至 {reg.appliedLevel} 级，{reg.jumpLevelCheck.approvalStatus === 'approved' ? '已通过审核' : '待审核'}
                    </p>
                  </div>
                )}

                {currentWorkVersion?.workImageBase64 ? (
                  <div className="rounded-lg overflow-hidden border border-ink-200">
                    <img
                      src={currentWorkVersion.workImageBase64}
                      alt="考生作品"
                      className="w-full object-contain max-h-[500px] bg-ink-50"
                    />
                  </div>
                ) : (
                  <div className="bg-ink-50 rounded-lg p-12 text-center">
                    <p className="text-dai-400">考生未上传作品</p>
                  </div>
                )}

                {currentWorkVersion?.uploadNote && (
                  <p className="mt-2 text-sm text-dai-500 italic">
                    作者说明：{currentWorkVersion.uploadNote}
                  </p>
                )}
              </div>
            </div>

            {workVersions.length > 1 && (
              <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-ink-50 border-b border-ink-200">
                  <h4 className="font-medium text-ink-800 text-sm">作品版本历史</h4>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {workVersions.map((v) => (
                      <div
                        key={v.id}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          currentWorkVersion?.version === v.version
                            ? 'border-vermilion-500'
                            : 'border-ink-200 hover:border-ink-300'
                        }`}
                      >
                        <img src={v.workImageBase64} alt={`版本${v.version}`} className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {v.version < workVersions.length && (
                            <button
                              onClick={() => handleCompareVersions(v.version, v.version + 1)}
                              className="p-2 bg-white rounded-full text-ink-800 hover:bg-ink-100"
                              title="对比下一版本"
                            >
                              <GitCompare size={14} />
                            </button>
                          )}
                          <Eye size={14} className="text-white" />
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          v{v.version}
                        </div>
                        {currentWorkVersion?.version === v.version && (
                          <div className="absolute top-1 right-1 bg-vermilion-500 text-white text-xs px-1.5 py-0.5 rounded">
                            当前
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-orange-50 border-b border-orange-200">
                  <h4 className="font-medium text-orange-800 text-sm flex items-center gap-2">
                    <Clock size={14} />
                    复核记录 ({reviews.length})
                  </h4>
                </div>
                <div className="divide-y divide-ink-100">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              review.status === 'approved' ? 'bg-green-100 text-green-700' :
                              review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {review.status === 'approved' ? '复核通过' :
                               review.status === 'rejected' ? '复核不通过' : '待复核'}
                            </span>
                            <span className="text-xs text-dai-400">
                              {new Date(review.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-ink-700"><strong>复核原因：</strong>{review.reason}</p>
                          {review.reviewedAt && (
                            <div className="mt-2 text-sm text-dai-600">
                              <p><strong>复核评委：</strong>{review.reviewJudgeName}</p>
                              <p><strong>最终成绩：</strong>{review.finalScore} 分 ({getScoreResult(review.finalScore ?? 0)})</p>
                            </div>
                          )}
                        </div>
                        {review.status === 'approved' ? (
                          <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                        ) : review.status === 'rejected' ? (
                          <XCircle className="text-red-500 shrink-0" size={20} />
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenReviewProcess(review)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              办理复核
                            </button>
                            <Clock className="text-amber-500 shrink-0" size={20} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
              <div className="brush-top px-5 py-3">
                <h3 className="font-serif font-bold text-ink-900">成绩录入</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-3">
                    <Star size={14} className="inline mr-1" />
                    评分（0-100）
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreValue}
                    onChange={(e) => setScoreValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-ink-100 rounded-lg appearance-none cursor-pointer accent-vermilion-500"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-4xl font-bold text-ink-900">{scoreValue}</span>
                    <span className={`text-xl font-bold ${resultColor}`}>{result}</span>
                  </div>
                  <div className="flex justify-between text-xs text-dai-400 mt-1">
                    <span>0</span>
                    <span className="text-green-500 font-medium">60 合格</span>
                    <span className="text-blue-500 font-medium">75 良好</span>
                    <span className="text-amber-500 font-medium">90 优秀</span>
                    <span>100</span>
                  </div>
                </div>

                {borderlineCheck.isBorderline && scoreValue > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700">
                      <AlertTriangle size={12} className="inline mr-1" />
                      {borderlineCheck.reason}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">评语</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="请输入评语..."
                    className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none resize-none"
                  />
                </div>

                <div className="bg-ink-50 rounded-lg p-4 text-sm space-y-2">
                  <p className="text-dai-500 flex items-center gap-2">
                    <User size={14} />
                    评委：<span className="text-ink-800 font-medium">{judgeName}</span>
                  </p>
                  <p className="text-dai-500 flex items-center gap-2">
                    <FileText size={14} />
                    考生：<span className="text-ink-800">{reg.candidateName}</span>
                  </p>
                  <p className="text-dai-500 flex items-center gap-2">
                    <Star size={14} />
                    等级：<span className="text-ink-800">{getLevelName(reg.appliedLevel)}</span>
                  </p>
                  {workVersions.length > 0 && (
                    <p className="text-dai-500 flex items-center gap-2">
                      <Eye size={14} />
                      作品：<span className="text-ink-800">v{currentWorkVersion?.version}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={scoreValue <= 0}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-vermilion-500 hover:bg-vermilion-600 disabled:bg-ink-200 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Save size={16} />
                  {existingScore ? '更新成绩' : '提交成绩'}
                </button>

                {existingScore && !reviews.some(r => r.status === 'pending') && (
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <Clock size={16} />
                    发起复核
                  </button>
                )}
              </form>
            </div>

            <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm p-5">
              <h4 className="font-serif font-bold text-ink-900 mb-3 text-sm">评审说明</h4>
              <ul className="space-y-2 text-xs text-dai-600">
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  60分以下：不合格
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  60-74分：合格
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  75-89分：良好
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  90分以上：优秀
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  临界线（±3分）自动触发复核
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showVersionCompare && compareVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full mx-4 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-ink-200">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  版本比对：v{compareVersions.v1.version} → v{compareVersions.v2.version}
                </h3>
                <button onClick={() => { setShowVersionCompare(false); setCompareVersions(null) }} className="text-dai-400 hover:text-ink-600">
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-ink-800">版本 v{compareVersions.v1.version}</p>
                    <p className="text-xs text-dai-400">
                      {new Date(compareVersions.v1.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="border border-ink-200 rounded-lg overflow-hidden">
                    <img
                      src={compareVersions.v1.workImageBase64}
                      alt={`版本 v${compareVersions.v1.version}`}
                      className="w-full h-80 object-contain bg-ink-50"
                    />
                  </div>
                  {compareVersions.v1.uploadNote && (
                    <p className="text-xs text-dai-500 mt-2 italic">{compareVersions.v1.uploadNote}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-ink-800">版本 v{compareVersions.v2.version}</p>
                    <p className="text-xs text-dai-400">
                      {new Date(compareVersions.v2.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="border border-ink-200 rounded-lg overflow-hidden">
                    <img
                      src={compareVersions.v2.workImageBase64}
                      alt={`版本 v${compareVersions.v2.version}`}
                      className="w-full h-80 object-contain bg-ink-50"
                    />
                  </div>
                  {compareVersions.v2.uploadNote && (
                    <p className="text-xs text-dai-500 mt-2 italic">{compareVersions.v2.uploadNote}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">发起成绩复核</h3>
              <p className="text-sm text-dai-500 mb-4">
                考生：{reg.candidateName} · 当前分数：{scoreValue} 分
              </p>
              {borderlineCheck.isBorderline && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-700">
                    <AlertTriangle size={12} className="inline mr-1" />
                    {borderlineCheck.reason}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">复核原因</label>
                  <textarea
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="请填写复核原因..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => { setShowReviewModal(false); setReviewReason(''); navigate('/judge') }}
                  className="px-4 py-2 text-sm font-medium text-dai-600 bg-white border border-ink-200 rounded-lg hover:bg-ink-100 transition-colors"
                >
                  暂不复核
                </button>
                <button
                  onClick={handleRequestReview}
                  disabled={!reviewReason.trim()}
                  className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-ink-200 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  确认发起复核
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewProcessModal && pendingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-ink-200">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  办理成绩复核
                </h3>
                <button
                  onClick={() => { setShowReviewProcessModal(false); setPendingReview(null) }}
                  className="text-dai-400 hover:text-ink-600"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-dai-500">考生</p>
                    <p className="font-medium text-ink-800">{reg.candidateName}</p>
                  </div>
                  <div>
                    <p className="text-dai-500">报考等级</p>
                    <p className="font-medium text-ink-800">{getLevelName(reg.appliedLevel)}</p>
                  </div>
                  <div>
                    <p className="text-dai-500">初始分数</p>
                    <p className="font-bold text-ink-800 text-lg">{pendingReview.initialScore} 分</p>
                  </div>
                  <div>
                    <p className="text-dai-500">复核原因</p>
                    <p className="font-medium text-ink-800">{pendingReview.reason}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2">
                  复核评委姓名
                </label>
                <input
                  type="text"
                  value={reviewJudgeName}
                  onChange={(e) => setReviewJudgeName(e.target.value)}
                  placeholder="请输入复核评委姓名"
                  className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2">
                  最终成绩（0-100）
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={reviewFinalScore}
                  onChange={(e) => setReviewFinalScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-ink-100 rounded-lg appearance-none cursor-pointer accent-vermilion-500"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-3xl font-bold text-ink-900">{reviewFinalScore}</span>
                  <span className={`text-lg font-bold ${
                    getScoreResult(reviewFinalScore) === '优秀' ? 'text-amber-600' :
                    getScoreResult(reviewFinalScore) === '良好' ? 'text-blue-600' :
                    getScoreResult(reviewFinalScore) === '合格' ? 'text-green-600' : 'text-vermilion-600'
                  }`}>
                    {getScoreResult(reviewFinalScore)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-dai-400 mt-1">
                  <span>0</span>
                  <span className="text-green-500 font-medium">60 合格</span>
                  <span className="text-blue-500 font-medium">75 良好</span>
                  <span className="text-amber-500 font-medium">90 优秀</span>
                  <span>100</span>
                </div>
              </div>

              {isBorderlineScore(reviewFinalScore).isBorderline && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    <AlertTriangle size={12} className="inline mr-1" />
                    {isBorderlineScore(reviewFinalScore).reason}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleCompleteReview(false)}
                  disabled={!reviewJudgeName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-ink-100 hover:bg-ink-200 disabled:bg-ink-50 disabled:cursor-not-allowed text-ink-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <XCircle size={16} />
                  驳回（保留原成绩）
                </button>
                <button
                  onClick={() => handleCompleteReview(true)}
                  disabled={!reviewJudgeName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-ink-200 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <CheckCircle2 size={16} />
                  通过（更新成绩）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
