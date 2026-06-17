import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, AlertTriangle, CreditCard, Image, CheckCircle2, FileText, Clock, ChevronRight, X, GitCompare } from 'lucide-react'
import Layout from '@/components/Layout'
import LevelBadge from '@/components/LevelBadge'
import { useExamStore } from '@/store/useExamStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { checkLevelSpan, checkJumpLevelEligibility, getRegistrationStatusText } from '@/types'
import type { WorkVersion } from '@/types'
import ConfirmModal from '@/components/ConfirmModal'

export default function Registration() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const { sessions, incrementRegistered, venues } = useExamStore()
  const { addRegistration, addWorkVersion, setPaid, registrations, setCurrentWorkVersion, compareWorkVersions } = useRegistrationStore()

  const session = sessions.find((s) => s.id === sessionId)
  const venue = session?.venueId ? venues.find(v => v.id === session.venueId) : null

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
  const [jumpLevelInfo, setJumpLevelInfo] = useState<ReturnType<typeof checkJumpLevelEligibility> | null>(null)
  const [showWorkVersions, setShowWorkVersions] = useState(false)
  const [showVersionCompare, setShowVersionCompare] = useState(false)
  const [compareVersions, setCompareVersions] = useState<{v1: number; v2: number} | null>(null)
  const [uploadNote, setUploadNote] = useState('')
  const [showUploadNote, setShowUploadNote] = useState(false)

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
      setWorkPreview(existingPendingReg.workImageBase64 || null)
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
    const jumpCheck = checkJumpLevelEligibility(session.level, passedLevel)
    setJumpLevelInfo(jumpCheck)

    if (!check.ok) {
      setLevelWarning(check.message)
      setShowLevelWarning(true)
      return
    }

    if (!jumpCheck.passed && jumpCheck.approvalStatus === 'rejected') {
      setLevelWarning(jumpCheck.reason)
      setShowLevelWarning(true)
      return
    }

    if (session.registeredCount >= session.maxSlots) {
      if (session.waitlistCount < session.waitlistSlots) {
        setLevelWarning('该场次名额已满，可加入候补队列等待空缺')
        setShowLevelWarning(true)
        return
      }
      setLevelWarning('该场次名额已满，候补队列也已满，请选择其他场次')
      setShowLevelWarning(true)
      return
    }

    submitRegistration(false)
  }

  const submitRegistration = (addToWaitlist: boolean) => {
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
      status: addToWaitlist ? 'waitlist' : 'pending_upload',
    })

    if (!newRegId) {
      alert('您已报名该场次，请勿重复报名')
      return
    }

    if (!addToWaitlist) {
      incrementRegistered(session.id)
    } else {
      useExamStore.getState().incrementWaitlist(session.id)
    }

    setRegId(newRegId)
    setShowLevelWarning(false)
    
    if (addToWaitlist) {
      useRegistrationStore.getState().addToWaitlist(newRegId)
      navigate('/candidate/my-registrations')
    } else {
      setStep('upload')
    }
  }

  const handleForceRegister = () => {
    submitRegistration(false)
  }

  const handleJoinWaitlist = () => {
    submitRegistration(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setWorkPreview(base64)
      if (regId) {
        setShowUploadNote(true)
      }
    }
    reader.readAsDataURL(file)
  }

  const confirmUploadWithNote = () => {
    if (regId && workPreview) {
      addWorkVersion(regId, workPreview, uploadNote)
      setUploadNote('')
      setShowUploadNote(false)
      setStep('pay')
    }
  }

  const handleSwitchVersion = (version: number) => {
    if (regId) {
      setCurrentWorkVersion(regId, version)
      const reg = registrations.find(r => r.id === regId)
      if (reg) {
        const v = reg.workVersions.find(w => w.version === version)
        if (v) {
          setWorkPreview(v.workImageBase64)
        }
      }
    }
  }

  const handleCompareVersions = (v1: number, v2: number) => {
    if (regId) {
      const result = compareWorkVersions(regId, v1, v2)
      if (result) {
        setCompareVersions({ v1, v2 })
        setShowVersionCompare(true)
      }
    }
  }

  const handlePay = () => {
    if (!regId) return
    setPaid(regId, session.fee)
    setStep('done')
  }

  const currentReg = regId ? registrations.find(r => r.id === regId) : null
  const workVersions = currentReg?.workVersions || []

  return (
    <Layout role="candidate">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/candidate')}
          className="flex items-center gap-1 text-sm text-dai-500 hover:text-ink-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          返回场次列表
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm overflow-hidden">
              <div className="brush-top px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LevelBadge level={session.level} />
                  <span className="text-sm text-dai-500">{session.examDate} {session.examTime}</span>
                </div>
                <span className="text-vermilion-600 font-bold text-lg">¥{session.fee}</span>
              </div>

              {venue && (
                <div className="px-6 py-3 bg-ink-50 border-b border-ink-200/50 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-dai-400" />
                    <span className="text-dai-600">考场：{venue.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-dai-400" />
                    <span className="text-dai-600">地址：{venue.address}</span>
                  </div>
                </div>
              )}

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

                    {jumpLevelInfo && jumpLevelInfo.approvalStatus === 'pending' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                          <div>
                            <p className="text-sm font-medium text-amber-800">跳级报考提示</p>
                            <p className="text-sm text-amber-700 mt-1">{jumpLevelInfo.reason}</p>
                            {jumpLevelInfo.requiredDocuments.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-amber-600 font-medium">需提供以下材料：</p>
                                <ul className="text-xs text-amber-600 mt-1 space-y-1">
                                  {jumpLevelInfo.requiredDocuments.map((doc, idx) => (
                                    <li key={idx} className="flex items-center gap-1">
                                      <ChevronRight size={12} />
                                      {doc}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {levelWarning && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="text-sm font-medium text-amber-800">等级跨度提示</p>
                          <p className="text-sm text-amber-700 mt-1">{levelWarning}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dai-500">
                        剩余名额：{session.maxSlots - session.registeredCount} / {session.maxSlots}
                      </span>
                      {session.waitlistSlots > 0 && (
                        <span className="text-dai-400">
                          候补名额：{session.waitlistSlots - session.waitlistCount} / {session.waitlistSlots}
                        </span>
                      )}
                    </div>

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
                      📝 报名已提交，请上传您的书法作品照片。支持多版本上传，可比对不同版本差异。
                    </div>

                    {workVersions.length > 0 && (
                      <div className="border border-ink-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-ink-50 border-b border-ink-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-ink-800">作品版本历史</span>
                          <button
                            onClick={() => setShowWorkVersions(!showWorkVersions)}
                            className="text-xs text-vermilion-600 hover:text-vermilion-700"
                          >
                            {showWorkVersions ? '收起' : '展开'}
                          </button>
                        </div>
                        {showWorkVersions && (
                          <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                            {workVersions.map((v: WorkVersion) => (
                              <div
                                key={v.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  currentReg?.currentWorkVersion === v.version
                                    ? 'border-vermilion-300 bg-vermilion-50'
                                    : 'border-ink-200 hover:bg-ink-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-ink-100 rounded flex items-center justify-center text-sm font-bold text-dai-600">
                                    v{v.version}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-ink-800">
                                      版本 {v.version}
                                      {currentReg?.currentWorkVersion === v.version && (
                                        <span className="ml-2 text-xs text-green-600">(当前使用)</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-dai-500">
                                      {new Date(v.uploadedAt).toLocaleString()}
                                    </p>
                                    {v.uploadNote && (
                                      <p className="text-xs text-dai-400 mt-1">{v.uploadNote}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {workVersions.length >= 2 && v.version < workVersions.length && (
                                    <button
                                      onClick={() => handleCompareVersions(v.version, v.version + 1)}
                                      className="p-1.5 text-dai-400 hover:text-vermilion-600 hover:bg-vermilion-50 rounded transition-colors"
                                      title="比对版本"
                                    >
                                      <GitCompare size={16} />
                                    </button>
                                  )}
                                  {currentReg?.currentWorkVersion !== v.version && (
                                    <button
                                      onClick={() => handleSwitchVersion(v.version)}
                                      className="text-xs px-3 py-1 bg-ink-100 hover:bg-ink-200 text-dai-600 rounded transition-colors"
                                    >
                                      切换
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-ink-200 hover:border-vermilion-300 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                    >
                      {workPreview ? (
                        <div className="space-y-3">
                          <img src={workPreview} alt="作品预览" className="max-h-64 mx-auto rounded-lg shadow-sm" />
                          <p className="text-sm text-green-600 font-medium">
                            {workVersions.length > 0 ? `版本 ${currentReg?.currentWorkVersion} 已上传 ✓` : '作品已上传 ✓'}
                          </p>
                          <p className="text-xs text-dai-400">点击可重新上传新版本</p>
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

                    {currentReg && currentReg.status === 'pending_payment' && (
                      <button
                        onClick={() => setStep('pay')}
                        className="w-full py-3 bg-vermilion-500 hover:bg-vermilion-600 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        继续缴费
                      </button>
                    )}
                  </div>
                )}

                {step === 'pay' && (
                  <div className="space-y-5">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      作品已上传成功，请完成缴费
                    </div>

                    {workVersions.length > 0 && (
                      <div className="flex items-center gap-4 bg-ink-50 rounded-lg p-4">
                        <Image size={20} className="text-dai-400 shrink-0" />
                        <img src={workPreview || ''} alt="作品" className="w-16 h-16 object-cover rounded border border-ink-200" />
                        <div className="flex-1">
                          <span className="text-sm text-dai-600">已上传作品</span>
                          <p className="text-xs text-dai-400">共 {workVersions.length} 个版本，当前使用 v{currentReg?.currentWorkVersion}</p>
                        </div>
                        <button
                          onClick={() => setStep('upload')}
                          className="text-xs text-vermilion-600 hover:text-vermilion-700"
                        >
                          管理版本
                        </button>
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
                      {venue && (
                        <div className="mt-4 pt-4 border-t border-ink-100 text-sm text-dai-500">
                          <p>考场：{venue.name}</p>
                          <p>地址：{venue.address}</p>
                        </div>
                      )}
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
                    {currentReg?.waitlistEntry && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-sm mx-auto">
                        <p className="text-sm text-amber-800">
                          📋 您当前处于候补队列第 {currentReg.waitlistEntry.position} 位
                        </p>
                      </div>
                    )}
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

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm p-5">
              <h4 className="font-serif font-bold text-ink-900 mb-3">报名须知</h4>
              <ul className="space-y-2 text-sm text-dai-600">
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  请确保上传的作品清晰可辨
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  支持多版本上传，考前可更新作品
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  名额满时可加入候补队列
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  场地调整会自动通知改派
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vermilion-500">•</span>
                  临界分数自动进入复核流程
                </li>
              </ul>
            </div>

            {currentReg && currentReg.timeline.length > 0 && (
              <div className="bg-white rounded-xl border border-ink-200/50 shadow-sm p-5">
                <h4 className="font-serif font-bold text-ink-900 mb-4">报名进度</h4>
                <div className="space-y-3">
                  {currentReg.timeline.slice(-5).reverse().map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-vermilion-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800">{event.title}</p>
                        <p className="text-xs text-dai-500 mt-0.5">{event.description}</p>
                        <p className="text-xs text-dai-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLevelWarning && levelWarning && (
        <ConfirmModal
          open={showLevelWarning}
          title={session.registeredCount >= session.maxSlots ? '名额已满' : '等级跨度提示'}
          message={levelWarning}
          confirmLabel={session.registeredCount >= session.maxSlots && session.waitlistCount < session.waitlistSlots ? '加入候补' : '仍然报名'}
          cancelLabel="重新选择"
          variant={session.registeredCount >= session.maxSlots ? 'warning' : 'warning'}
          onConfirm={session.registeredCount >= session.maxSlots && session.waitlistCount < session.waitlistSlots ? handleJoinWaitlist : handleForceRegister}
          onCancel={() => setShowLevelWarning(false)}
        />
      )}

      {showUploadNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-ink-900">上传说明</h3>
                <button onClick={() => setShowUploadNote(false)} className="text-dai-400 hover:text-ink-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-dai-600 mb-4">请填写本次上传的说明（可选）</p>
              <textarea
                value={uploadNote}
                onChange={(e) => setUploadNote(e.target.value)}
                placeholder="例如：修改了落款、调整了章法等"
                rows={3}
                className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-vermilion-300 focus:border-vermilion-400 outline-none resize-none"
              />
            </div>
            <div className="bg-ink-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadNote(false)}
                className="px-4 py-2 text-sm font-medium text-dai-600 bg-white border border-ink-200 rounded-lg hover:bg-ink-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmUploadWithNote}
                className="px-4 py-2 text-sm font-medium bg-vermilion-500 hover:bg-vermilion-600 text-white rounded-lg transition-colors"
              >
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}

      {showVersionCompare && compareVersions && currentReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-ink-200">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  版本比对：v{compareVersions.v1} → v{compareVersions.v2}
                </h3>
                <button onClick={() => { setShowVersionCompare(false); setCompareVersions(null) }} className="text-dai-400 hover:text-ink-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-ink-800 mb-3 text-center">版本 v{compareVersions.v1}</p>
                  <div className="border border-ink-200 rounded-lg overflow-hidden">
                    <img
                      src={currentReg.workVersions.find(w => w.version === compareVersions.v1)?.workImageBase64 || ''}
                      alt={`版本 v${compareVersions.v1}`}
                      className="w-full h-64 object-contain bg-ink-50"
                    />
                  </div>
                  <p className="text-xs text-dai-500 mt-2 text-center">
                    {currentReg.workVersions.find(w => w.version === compareVersions.v1)?.uploadNote || '无说明'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-800 mb-3 text-center">版本 v{compareVersions.v2}</p>
                  <div className="border border-ink-200 rounded-lg overflow-hidden">
                    <img
                      src={currentReg.workVersions.find(w => w.version === compareVersions.v2)?.workImageBase64 || ''}
                      alt={`版本 v${compareVersions.v2}`}
                      className="w-full h-64 object-contain bg-ink-50"
                    />
                  </div>
                  <p className="text-xs text-dai-500 mt-2 text-center">
                    {currentReg.workVersions.find(w => w.version === compareVersions.v2)?.uploadNote || '无说明'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
