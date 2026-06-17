import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Star } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useExamStore } from '@/store/useExamStore'
import { useScoreStore } from '@/store/useScoreStore'
import { getScoreResult, getLevelName } from '@/types'

export default function ScoreEntry() {
  const { registrationId } = useParams<{ registrationId: string }>()
  const navigate = useNavigate()
  const { registrations, setStatus } = useRegistrationStore()
  const { sessions } = useExamStore()
  const { addScore, scores } = useScoreStore()

  const reg = registrations.find((r) => r.id === registrationId)
  const session = reg ? sessions.find((s) => s.id === reg.sessionId) : null
  const existingScore = reg ? scores.find((s) => s.registrationId === reg.id) : null

  const [scoreValue, setScoreValue] = useState(existingScore?.score ?? 0)
  const [comment, setComment] = useState(existingScore?.comment ?? '')
  const [judgeName] = useState('评委老师')

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
      setStatus(reg.id, 'scored')
    }

    navigate('/judge')
  }

  const result = getScoreResult(scoreValue)
  const resultColor =
    result === '优秀' ? 'text-amber-600' :
    result === '良好' ? 'text-blue-600' :
    result === '合格' ? 'text-green-600' : 'text-vermilion-600'

  return (
    <Layout role="judge">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/judge')}
          className="flex items-center gap-1 text-sm text-dai-500 hover:text-ink-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          返回评审列表
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
            <div className="brush-top px-5 py-3">
              <h3 className="font-serif font-bold text-ink-900">考生作品</h3>
            </div>
            <div className="p-5">
              <div className="mb-4 space-y-2 text-sm">
                <p><span className="text-dai-500">考生：</span><span className="font-medium">{reg.candidateName}</span></p>
                <p><span className="text-dai-500">报考：</span>{getLevelName(reg.appliedLevel)}</p>
                <div className="flex items-center gap-2">
                  <LevelBadge level={reg.appliedLevel} />
                </div>
              </div>

              {reg.workUploaded && reg.workImageBase64 ? (
                <div className="rounded-lg overflow-hidden border border-ink-200">
                  <img
                    src={reg.workImageBase64}
                    alt="考生作品"
                    className="w-full object-contain max-h-[500px] bg-ink-50"
                  />
                </div>
              ) : (
                <div className="bg-ink-50 rounded-lg p-12 text-center">
                  <p className="text-dai-400">考生未上传作品</p>
                </div>
              )}
            </div>
          </div>

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
                  <span className="text-3xl font-bold text-ink-900">{scoreValue}</span>
                  <span className={`text-lg font-bold ${resultColor}`}>{result}</span>
                </div>
                <div className="flex justify-between text-xs text-dai-400 mt-1">
                  <span>0</span>
                  <span>60 合格</span>
                  <span>75 良好</span>
                  <span>90 优秀</span>
                  <span>100</span>
                </div>
              </div>

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

              <div className="bg-ink-50 rounded-lg p-4 text-sm space-y-1">
                <p className="text-dai-500">评委：<span className="text-ink-800 font-medium">{judgeName}</span></p>
                <p className="text-dai-500">考生：<span className="text-ink-800">{reg.candidateName}</span></p>
                <p className="text-dai-500">等级：<span className="text-ink-800">{getLevelName(reg.appliedLevel)}</span></p>
              </div>

              <button
                type="submit"
                disabled={scoreValue <= 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-vermilion-500 hover:bg-vermilion-600 disabled:bg-ink-200 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
              >
                <Save size={16} />
                {existingScore ? '更新成绩' : '提交成绩'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
