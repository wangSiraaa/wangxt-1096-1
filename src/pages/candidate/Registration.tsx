import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, AlertTriangle, CreditCard, Image, CheckCircle2 } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { checkLevelSpan } from '@/types'

export default function Registration() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const { sessions, incrementRegistered } = useExamStore()
  const { addRegistration, setWorkUploaded, setPaid, registrations } = useRegistrationStore()

  const session = sessions.find((s) => s.id === sessionId)

  const existingPendingReg = registrations.find(
    (r) => r.sessionId === sessionId && (r.status === 'pending_upload' || r.status === 'pending_payment')
  )

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [passedLevel, setPassedLevel] = useState(0)
  const [regId, setRegId] = useState<string | null>(existingPendingReg?.id ?? null)
  const [workPreview, setWorkPreview] = useState<string | null>(
    existingPendingReg?.workImageBase64 || null
  )
  const [levelWarning, setLevelWarning] = useState<string | null>(null)
  const [showLevelWarning, setShowLevelWarning] = useState(false)

  const initialStep = existingPendingReg
    ? existingPendingReg.status === 'pending_upload'
      ? 'upload'
      : 'pay'
    : 'form'

  const [step, setStep] = useState<'form' | 'upload' | 'pay' | 'done'>(initialStep)

  useEffect(() => {
    if (existingPendingReg) {
      setName(existingPendingReg.candidateName)
      setPhone(existingPendingReg.candidatePhone)
      setPassedLevel(existingPendingReg.passedLevel)
    }
  }, [existingPendingReg])

  if (!session) {
    return (
      <Layout role="candidate">
        <div className="text-center py-20">
          <p className="text-dai-500">场次不存在</p>
          <button onClick={() => navigate('/candidate')} className="mt-4 text-vermilion-500 text-sm">
            返回场次列表
          </button>
        </div>
      </Layout>
    )
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return

    const check = checkLevelSpan(session.level, passedLevel)
    if (!check.ok) {
      setLevelWarning(check.message)
      setShowLevelWarning(true)
      return
    }

    const newRegId = addRegistration({
      sessionId: session.id,
      candidateName: name,
      candidatePhone: phone,
      appliedLevel: session.level,
      passedLevel,
      workUploaded: false,
      workImageBase64: '',
      paid: false,
      paidAt: '',
      status: 'pending_upload',
    })

    if (!newRegId) {
      alert('您已报名该场次，请勿重复报名')
      return
    }

    incrementRegistered(session.id)
    setRegId(newRegId)
    setStep('upload')
  }

  const handleForceRegister = () => {
    setShowLevelWarning(false)
    const newRegId = addRegistration({
      sessionId: session.id,
      candidateName: name,
      candidatePhone: phone,
      appliedLevel: session.level,
      passedLevel,
      workUploaded: false,
      workImageBase64: '',
      paid: false,
      paidAt: '',
      status: 'pending_upload',
    })

    if (!newRegId) {
      alert('您已报名该场次，请勿重复报名')
      return
    }

    incrementRegistered(session.id)
    setRegId(newRegId)
    setStep('upload')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setWorkPreview(base64)
      if (regId) {
        setWorkUploaded(regId, base64)
        setStep('pay')
      }
    }
    reader.readAsDataURL(file)
  }

  const handlePay = () => {
    if (!regId) return
    setPaid(regId)
    setStep('done')
  }

  return (
    <Layout role="candidate">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/candidate')}
          className="flex items-center gap-1 text-sm text-dai-500 hover:text-ink-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          返回场次列表
        </button>

        <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
          <div className="brush-top px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LevelBadge level={session.level} />
              <span className="text-sm text-dai-500">{session.examDate}</span>
            </div>
            <span className="text-vermilion-600 font-bold text-lg">¥{session.fee}</span>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              {(['form', 'upload', 'pay', 'done'] as const).map((s, i) => {
                const labels = ['填写信息', '上传作品', '确认缴费', '报名完成']
                const isActive = step === s
                const isDone = ['form', 'upload', 'pay', 'done'].indexOf(step) > i
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone ? 'bg-green-500 text-white' : isActive ? 'bg-vermilion-500 text-white' : 'bg-ink-100 text-dai-400'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs ${isActive ? 'text-vermilion-600 font-medium' : isDone ? 'text-green-600' : 'text-dai-400'}`}>
                      {labels[i]}
                    </span>
                    {i < 3 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-green-400' : 'bg-ink-100'}`} />}
                  </div>
                )
              })}
            </div>

            {step === 'form' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">姓名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="请输入您的姓名"
                    className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="请输入手机号"
                    className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">已通过等级（0=未参加过）</label>
                  <select
                    value={passedLevel}
                    onChange={(e) => setPassedLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none"
                  >
                    <option value={0}>未参加过考试</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((lv) => (
                      <option key={lv} value={lv}>{lv}级（已通过）</option>
                    ))}
                  </select>
                </div>

                {levelWarning && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-amber-800">等级跨度提示</p>
                      <p className="text-sm text-amber-700 mt-1">{levelWarning}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-vermilion-500 hover:bg-vermilion-600 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  提交报名
                </button>
              </form>
            )}

            {step === 'upload' && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  📝 报名已提交，请上传您的书法作品照片。作品未上传不可缴费。
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-ink-200 hover:border-vermilion-300 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                >
                  {workPreview ? (
                    <div className="space-y-3">
                      <img src={workPreview} alt="作品预览" className="max-h-64 mx-auto rounded-lg shadow-sm" />
                      <p className="text-sm text-green-600 font-medium">作品已上传 ✓</p>
                      <p className="text-xs text-dai-400">点击可重新上传</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="mx-auto text-ink-300 group-hover:text-vermilion-400 transition-colors" size={48} />
                      <p className="text-dai-500">点击上传作品图片</p>
                      <p className="text-xs text-dai-400">支持 JPG、PNG 格式</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            )}

            {step === 'pay' && (
              <div className="space-y-5">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  作品已上传成功，请完成缴费
                </div>

                {workPreview && (
                  <div className="flex items-center gap-4 bg-ink-50 rounded-lg p-4">
                    <Image size={20} className="text-dai-400 shrink-0" />
                    <img src={workPreview} alt="作品" className="w-16 h-16 object-cover rounded border border-ink-200" />
                    <span className="text-sm text-dai-600">已上传作品</span>
                  </div>
                )}

                <div className="bg-white border border-ink-200 rounded-xl p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-dai-500">报名费用</p>
                      <p className="text-2xl font-bold text-vermilion-600 mt-1">¥{session.fee}</p>
                    </div>
                    <div className="text-right text-sm text-dai-500">
                      <p>{session.level}级 · {session.examDate}</p>
                      <p>{name}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-vermilion-500 hover:bg-vermilion-600 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <CreditCard size={18} />
                  确认缴费 ¥{session.fee}
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={32} />
                </div>
                <h3 className="font-serif font-bold text-xl text-ink-900">报名成功</h3>
                <p className="text-sm text-dai-500">您已成功报名{session.level}级考试</p>
                <div className="pt-4 flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/candidate/my-registrations')}
                    className="px-5 py-2.5 bg-dai-800 hover:bg-dai-900 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    查看我的报名
                  </button>
                  <button
                    onClick={() => navigate('/candidate')}
                    className="px-5 py-2.5 bg-white border border-ink-200 text-dai-600 rounded-lg text-sm font-medium hover:bg-ink-50 transition-colors"
                  >
                    继续浏览
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLevelWarning && levelWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={24} />
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink-900">等级跨度提示</h3>
                  <p className="mt-2 text-sm text-dai-600 leading-relaxed">{levelWarning}</p>
                </div>
              </div>
            </div>
            <div className="bg-ink-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowLevelWarning(false)}
                className="px-4 py-2 text-sm font-medium text-dai-600 bg-white border border-ink-200 rounded-lg hover:bg-ink-100 transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={handleForceRegister}
                className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
              >
                仍然报名
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
