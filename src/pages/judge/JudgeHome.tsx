import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, Eye, AlertTriangle, Clock, CheckCircle2, XCircle, User, Star, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useScoreStore } from '@/store/useScoreStore'
import { getLevelName, getScoreResult, isBorderlineScore } from '@/types'
import type { Score } from '@/types'

type TabType = 'pending' | 'review' | 'completed'

export default function JudgeHome() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const { sessions } = useExamStore()
  const { registrations } = useRegistrationStore()
  const { scores, getPendingReviews, completeReview } = useScoreStore()
  
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [reviewJudgeName, setReviewJudgeName] = useState('')
  const [reviewFinalScore, setReviewFinalScore] = useState(60)
  
  const handleExpandReview = (score: Score) => {
    if (expandedReview === score.id) {
      setExpandedReview(null)
    } else {
      setExpandedReview(score.id)
      setReviewJudgeName('')
      setReviewFinalScore(score.score)
    }
  }
  
  const handleQuickReview = (score: Score, approved: boolean) => {
    if (!reviewJudgeName.trim()) return
    completeReview(
      score.reviewRecord!.id,
      reviewFinalScore,
      reviewJudgeName,
      approved
    )
    setExpandedReview(null)
    setReviewJudgeName('')
  }

  const paidRegs = registrations.filter((r) => r.paid)
  const pendingReviews = getPendingReviews()

  const sessionsWithRegs = sessions
    .map((session) => {
      const sessionRegs = paidRegs.filter((r) => r.sessionId === session.id)
      const sessionScores = scores.filter((s) => s.sessionId === session.id)
      const unscoredRegs = sessionRegs.filter(
        (r) => !sessionScores.find((s) => s.registrationId === r.id)
      )
      const completedScores = sessionScores.filter(s => s.reviewStatus !== 'pending')
      return { session, sessionRegs, unscoredRegs, scoredCount: sessionScores.length, completedCount: completedScores.length }
    })
    .filter((s) => s.sessionRegs.length > 0)

  const getRegForScore = (scoreId: string) => {
    const score = scores.find(s => s.id === scoreId)
    return score ? registrations.find(r => r.id === score.registrationId) : null
  }

  const tabs = [
    { key: 'pending' as TabType, label: '待评审', icon: Gavel, count: sessionsWithRegs.reduce((sum, s) => sum + s.unscoredRegs.length, 0) },
    { key: 'review' as TabType, label: '待复核', icon: AlertTriangle, count: pendingReviews.length },
    { key: 'completed' as TabType, label: '已完成', icon: CheckCircle2, count: sessionsWithRegs.reduce((sum, s) => sum + s.completedCount, 0) },
  ]

  return (
    <Layout role="judge">
      <div className="mb-6">
        <h2 className="font-serif font-bold text-2xl text-ink-900">评审工作台</h2>
        <p className="text-sm text-dai-500 mt-1">查看已缴费考生作品，录入成绩及复核</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-ink-200">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-vermilion-500 text-vermilion-600'
                : 'border-transparent text-dai-500 hover:text-ink-700'
            }`}
          >
            <Icon size={16} />
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                key === 'review' ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-dai-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'review' && (
        <div className="space-y-4">
          {pendingReviews.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-ink-200/50">
              <CheckCircle2 className="mx-auto text-green-400 mb-3" size={48} />
              <p className="text-dai-500">暂无待复核的成绩</p>
              <p className="text-sm text-dai-400 mt-1">所有成绩均已完成评审</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((score) => {
                const reg = getRegForScore(score.id)
                const session = sessions.find(s => s.id === score.sessionId)
                const borderline = isBorderlineScore(score.score)
                const isExpanded = expandedReview === score.id
                const finalResult = getScoreResult(reviewFinalScore)
                const finalBorderline = isBorderlineScore(reviewFinalScore)
                
                return (
                  <div key={score.id} className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
                      onClick={() => handleExpandReview(score)}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-500" size={18} />
                        <span className="font-medium text-amber-800">临界线成绩待复核</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-600">
                          {new Date(score.createdAt).toLocaleString()}
                        </span>
                        {isExpanded ? <ChevronUp size={18} className="text-amber-600" /> : <ChevronDown size={18} className="text-amber-600" />}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {reg?.workUploaded && reg?.workImageBase64 ? (
                            <img
                              src={reg.workImageBase64}
                              alt="作品"
                              className="w-14 h-14 object-cover rounded border border-ink-200"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-ink-100 rounded flex items-center justify-center text-dai-400 text-xs">
                              无图
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-ink-900">{score.candidateName}</p>
                              <LevelBadge level={score.appliedLevel} />
                            </div>
                            <p className="text-xs text-dai-500">
                              {session?.examDate} {session?.examTime} · {reg?.candidatePhone}
                            </p>
                            {borderline.isBorderline && (
                              <p className="text-xs text-amber-600 mt-1">
                                <AlertTriangle size={12} className="inline mr-1" />
                                {borderline.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-3xl font-bold text-ink-900">{score.score}</span>
                            <span className={`text-lg font-bold ${
                              score.result === '优秀' ? 'text-amber-600' :
                              score.result === '良好' ? 'text-blue-600' :
                              score.result === '合格' ? 'text-green-600' : 'text-vermilion-600'
                            }`}>
                              {score.result}
                            </span>
                          </div>
                          <p className="text-xs text-dai-500">初评评委：{score.judgeName}</p>
                        </div>
                      </div>
                      {score.reviewRecord && (
                        <div className="mt-4 p-3 bg-ink-50 rounded-lg">
                          <p className="text-sm text-dai-600">
                            <strong>复核原因：</strong>{score.reviewRecord.reason}
                          </p>
                        </div>
                      )}
                      
                      {isExpanded && (
                        <div className="mt-5 p-5 bg-gradient-to-b from-amber-50/50 to-white border border-amber-200 rounded-xl space-y-5 animate-fade-in-up">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-dai-500 mb-1">初始分数</p>
                              <p className="text-2xl font-bold text-ink-900">{score.score} 分 <span className="text-sm font-normal text-dai-400">({score.result})</span></p>
                            </div>
                            <div>
                              <p className="text-xs text-dai-500 mb-1">复核最终分数</p>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={reviewFinalScore}
                                  onChange={(e) => setReviewFinalScore(parseInt(e.target.value))}
                                  className="flex-1 h-2 bg-ink-100 rounded-lg appearance-none cursor-pointer accent-vermilion-500"
                                />
                                <span className="text-2xl font-bold text-ink-900">{reviewFinalScore}</span>
                                <span className={`text-lg font-bold ${
                                  finalResult === '优秀' ? 'text-amber-600' :
                                  finalResult === '良好' ? 'text-blue-600' :
                                  finalResult === '合格' ? 'text-green-600' : 'text-vermilion-600'
                                }`}>
                                  {finalResult}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-dai-400 mt-1">
                                <span>0</span>
                                <span className="text-green-500">60合格</span>
                                <span className="text-blue-500">75良好</span>
                                <span className="text-amber-500">90优秀</span>
                                <span>100</span>
                              </div>
                              {finalBorderline.isBorderline && (
                                <p className="text-xs text-amber-600 mt-2">
                                  <AlertTriangle size={12} className="inline mr-1" />
                                  {finalBorderline.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-ink-800 mb-2">
                              <User size={14} className="inline mr-1" />
                              复核评委姓名
                            </label>
                            <input
                              type="text"
                              value={reviewJudgeName}
                              onChange={(e) => setReviewJudgeName(e.target.value)}
                              placeholder="请输入复核评委姓名"
                              className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/judge/score/${score.registrationId}`) }}
                              className="text-sm text-dai-500 hover:text-ink-700 flex items-center gap-1"
                            >
                              <Eye size={14} />
                              查看详情
                            </button>
                            <div className="flex gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuickReview(score, false) }}
                                disabled={!reviewJudgeName.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-ink-100 hover:bg-ink-200 disabled:bg-ink-50 disabled:cursor-not-allowed text-ink-700 rounded-lg font-medium text-sm transition-colors"
                              >
                                <XCircle size={16} />
                                驳回（保留原成绩）
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuickReview(score, true) }}
                                disabled={!reviewJudgeName.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-ink-200 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                              >
                                <CheckCircle2 size={16} />
                                通过（更新成绩）
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!isExpanded && (
                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            onClick={() => navigate(`/judge/score/${score.registrationId}`)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            <Eye size={14} />
                            查看作品
                          </button>
                          <button
                            onClick={() => handleExpandReview(score)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Clock size={14} />
                            快速办理
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {(activeTab === 'pending' || activeTab === 'completed') && (
        <>
          {sessionsWithRegs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-ink-200/50">
              <Gavel className="mx-auto text-ink-300 mb-3" size={48} />
              <p className="text-dai-500">暂无{activeTab === 'pending' ? '待评审' : '已完成'}的考生</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessionsWithRegs.map(({ session, sessionRegs, unscoredRegs, scoredCount, completedCount }) => {
                const displayRegs = activeTab === 'pending' 
                  ? unscoredRegs 
                  : sessionRegs.filter(r => scores.find(s => s.registrationId === r.id && s.reviewStatus !== 'pending'))
                
                if (displayRegs.length === 0) return null

                return (
                  <div key={session.id} className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
                    <div className="brush-top px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LevelBadge level={session.level} />
                        <span className="text-sm text-dai-500">{session.examDate}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-dai-500">待评审: <strong className="text-ink-800">{unscoredRegs.length}</strong></span>
                        <span className="text-dai-500">已完成: <strong className="text-green-600">{completedCount}</strong></span>
                      </div>
                    </div>

                    <div className="divide-y divide-ink-50">
                      {displayRegs.map((reg) => {
                        const hasScore = scores.find((s) => s.registrationId === reg.id)
                        const hasPendingReview = hasScore?.reviewStatus === 'pending'
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
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-ink-900">{reg.candidateName}</p>
                                  {hasPendingReview && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                      复核中
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-dai-400">报考{reg.appliedLevel}级 · {reg.candidatePhone}</p>
                              </div>
                            </div>

                            {hasScore ? (
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                                  <Eye size={14} /> {hasScore.score}分 ({hasScore.result})
                                </span>
                                <button
                                  onClick={() => navigate(`/judge/score/${reg.id}`)}
                                  className="text-xs text-dai-500 hover:text-ink-700"
                                >
                                  查看详情
                                </button>
                              </div>
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
                )
              })}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
