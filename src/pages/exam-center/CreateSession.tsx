import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Layout from '@/components/Layout'
import { useExamStore } from '@/store/useExamStore'

const levels = Array.from({ length: 10 }, (_, i) => i + 1)

export default function CreateSession() {
  const navigate = useNavigate()
  const addSession = useExamStore((s) => s.addSession)
  const [form, setForm] = useState({
    level: 1,
    examDate: '',
    examTime: '09:00',
    maxSlots: 30,
    fee: 200,
    status: 'open' as const,
    createdBy: '考点管理员',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.examDate) return
    addSession(form)
    navigate('/exam-center')
  }

  const update = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Layout role="exam-center">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/exam-center')}
          className="flex items-center gap-1 text-sm text-dai-500 hover:text-ink-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          返回场次列表
        </button>

        <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm">
          <div className="brush-top px-6 py-4">
            <h2 className="font-serif font-bold text-xl text-ink-900">发布新场次</h2>
            <p className="text-sm text-dai-500 mt-1">填写以下信息发布考级场次</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-2">报考等级</label>
              <div className="grid grid-cols-5 gap-2">
                {levels.map((lv) => {
                  const cat = lv <= 3 ? '初级' : lv <= 6 ? '中级' : lv <= 9 ? '高级' : '专业级'
                  const selected = form.level === lv
                  const catColor = lv <= 3
                    ? selected ? 'bg-emerald-500 text-white border-emerald-500' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    : lv <= 6
                    ? selected ? 'bg-blue-500 text-white border-blue-500' : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                    : lv <= 9
                    ? selected ? 'bg-purple-500 text-white border-purple-500' : 'border-purple-200 text-purple-700 hover:bg-purple-50'
                    : selected ? 'bg-vermilion-500 text-white border-vermilion-500' : 'border-vermilion-200 text-vermilion-700 hover:bg-vermilion-50'
                  return (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => update('level', lv)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${catColor}`}
                    >
                      {lv}级
                      <span className="text-xs ml-0.5 opacity-70">{cat}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2">考试日期</label>
                <input
                  type="date"
                  value={form.examDate}
                  onChange={(e) => update('examDate', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2">考试时间</label>
                <input
                  type="time"
                  value={form.examTime}
                  onChange={(e) => update('examTime', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2">最大名额</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.maxSlots}
                  onChange={(e) => update('maxSlots', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2">报名费（元）</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={form.fee}
                  onChange={(e) => update('fee', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-ink-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/exam-center')}
                className="px-5 py-2.5 text-sm font-medium text-dai-600 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-vermilion-500 hover:bg-vermilion-600 text-white rounded-lg font-medium text-sm shadow-sm transition-colors"
              >
                <Save size={16} />
                发布场次
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
