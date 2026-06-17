import { useNavigate } from 'react-router-dom'
import { Building2, User, Gavel } from 'lucide-react'
import type { Role } from '@/types'

const roles: { key: Role; label: string; desc: string; icon: React.ReactNode; color: string; path: string }[] = [
  {
    key: 'exam-center',
    label: '考点管理',
    desc: '发布考级场次、管理报名、发布成绩',
    icon: <Building2 size={40} strokeWidth={1.5} />,
    color: 'from-dai-800 to-dai-900',
    path: '/exam-center',
  },
  {
    key: 'candidate',
    label: '考生入口',
    desc: '浏览场次、报名、上传作品、缴费',
    icon: <User size={40} strokeWidth={1.5} />,
    color: 'from-vermilion-500 to-vermilion-600',
    path: '/candidate',
  },
  {
    key: 'judge',
    label: '评委入口',
    desc: '查看作品、录入成绩',
    icon: <Gavel size={40} strokeWidth={1.5} />,
    color: 'from-ink-800 to-ink-900',
    path: '/judge',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen ink-gradient relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 20% 30%, white 1px, transparent 1px),
                          radial-gradient(circle at 80% 70%, white 1px, transparent 1px),
                          radial-gradient(circle at 50% 50%, white 2px, transparent 2px)`,
        backgroundSize: '100px 100px, 150px 150px, 200px 200px',
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="text-6xl mb-4">🖌️</div>
          <h1 className="font-serif font-black text-5xl text-ink-50 tracking-widest mb-4">
            书法考级
          </h1>
          <p className="font-serif text-ink-200 text-lg tracking-wider">
            报名管理系统
          </p>
          <div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-vermilion-400 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role, idx) => (
            <button
              key={role.key}
              onClick={() => navigate(role.path)}
              className="group relative animate-fade-in-up"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center hover:bg-white/15 hover:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                  {role.icon}
                </div>
                <h2 className="font-serif font-bold text-xl text-ink-50 mb-2 tracking-wider">
                  {role.label}
                </h2>
                <p className="text-sm text-ink-200 leading-relaxed">
                  {role.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-ink-400 text-xs">
            作品未上传不可缴费 · 等级跨度过大提示逐级报考 · 成绩发布后不可撤回
          </p>
        </div>
      </div>
    </div>
  )
}
