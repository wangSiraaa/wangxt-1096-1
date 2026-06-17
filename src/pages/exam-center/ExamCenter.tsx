import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Users, DollarSign, Trash2, XCircle } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { SessionStatusBadge } from '@/components/StatusBadge'
import ConfirmModal from '@/components/ConfirmModal'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import type { ExamSession } from '@/types'

export default function ExamCenter() {
  const navigate = useNavigate()
  const { sessions, updateSession, deleteSession } = useExamStore()
  const { registrations } = useRegistrationStore()
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [showClose, setShowClose] = useState<string | null>(null)

  const sorted = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const getRegCount = (sid: string) =>
    registrations.filter((r) => r.sessionId === sid).length

  const handleClose = (id: string) => {
    updateSession(id, { status: 'closed' })
    setShowClose(null)
  }

  const handleDelete = (id: string) => {
    deleteSession(id)
    setShowDelete(null)
  }

  return (
    <Layout role="exam-center">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif font-bold text-2xl text-ink-900">场次管理</h2>
          <p className="text-sm text-dai-500 mt-1">管理考级场次，查看报名情况</p>
        </div>
        <button
          onClick={() => navigate('/exam-center/create')}
          className="flex items-center gap-2 px-5 py-2.5 bg-vermilion-500 hover:bg-vermilion-600 text-white rounded-lg font-medium text-sm shadow-sm transition-colors"
        >
          <Plus size={18} />
          发布场次
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-ink-200/50">
          <Calendar className="mx-auto text-ink-300 mb-3" size={48} />
          <p className="text-dai-500">暂无场次，请点击"发布场次"创建</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              regCount={getRegCount(session.id)}
              onClose={() => setShowClose(session.id)}
              onDelete={() => setShowDelete(session.id)}
              onReopen={() => updateSession(session.id, { status: 'open' })}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!showClose}
        title="截止报名"
        message="确定要截止该场次的报名吗？截止后考生将无法再报名。"
        confirmLabel="确定截止"
        variant="warning"
        onConfirm={() => showClose && handleClose(showClose)}
        onCancel={() => setShowClose(null)}
      />

      <ConfirmModal
        open={!!showDelete}
        title="删除场次"
        message="确定要删除该场次吗？相关报名数据也将被删除，此操作不可撤销。"
        confirmLabel="确定删除"
        variant="danger"
        onConfirm={() => showDelete && handleDelete(showDelete)}
        onCancel={() => setShowDelete(null)}
      />
    </Layout>
  )
}

function SessionCard({
  session,
  regCount,
  onClose,
  onDelete,
  onReopen,
}: {
  session: ExamSession
  regCount: number
  onClose: () => void
  onDelete: () => void
  onReopen: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <LevelBadge level={session.level} />
            <SessionStatusBadge status={session.status} />
          </div>
          <div className="flex items-center gap-1">
            {session.status === 'open' && (
              <button
                onClick={onClose}
                className="p-1.5 text-dai-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="截止报名"
              >
                <XCircle size={18} />
              </button>
            )}
            {session.status === 'closed' && (
              <button
                onClick={onReopen}
                className="text-xs text-dai-500 hover:text-green-600 px-2 py-1 rounded hover:bg-green-50 transition-colors"
              >
                重新开放
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-1.5 text-dai-400 hover:text-vermilion-500 hover:bg-vermilion-50 rounded-lg transition-colors"
              title="删除场次"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-dai-600">
            <Calendar size={16} className="text-dai-400" />
            <span>{session.examDate} {session.examTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-dai-600">
            <Users size={16} className="text-dai-400" />
            <span>{regCount}/{session.maxSlots} 人</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-dai-600">
            <DollarSign size={16} className="text-dai-400" />
            <span className="font-semibold text-vermilion-600">¥{session.fee}</span>
          </div>
        </div>

        {session.maxSlots > 0 && (
          <div className="mt-3">
            <div className="w-full bg-ink-100 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-dai-600 to-vermilion-400 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (regCount / session.maxSlots) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
