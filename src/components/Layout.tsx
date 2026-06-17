import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Building2, User, Gavel } from 'lucide-react'
import type { Role } from '@/types'

interface LayoutProps {
  children: React.ReactNode
  role: Role
}

const navItems: Record<Role, { label: string; icon: React.ReactNode; path: string }[]> = {
  'exam-center': [
    { label: '场次管理', icon: <Building2 size={18} />, path: '/exam-center' },
    { label: '成绩发布', icon: <Gavel size={18} />, path: '/exam-center/scores' },
  ],
  candidate: [
    { label: '浏览场次', icon: <Home size={18} />, path: '/candidate' },
    { label: '我的报名', icon: <User size={18} />, path: '/candidate/my-registrations' },
  ],
  judge: [
    { label: '待评审', icon: <Gavel size={18} />, path: '/judge' },
  ],
}

const roleLabels: Record<Role, string> = {
  'exam-center': '考点管理',
  candidate: '考生',
  judge: '评委',
}

export default function Layout({ children, role }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const items = navItems[role]

  return (
    <div className="min-h-screen ink-bg">
      <header className="ink-gradient text-ink-50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🖌️</span>
            <h1 className="font-serif font-bold text-lg tracking-wider">书法考级</h1>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-200 bg-white/10 px-3 py-1 rounded-full">
              {roleLabels[role]}
            </span>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-ink-300 hover:text-white transition-colors"
            >
              切换角色
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white/80 backdrop-blur-sm border-b border-ink-200/50 sticky top-14 z-40">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-vermilion-500 text-vermilion-600'
                    : 'border-transparent text-dai-600 hover:text-ink-900 hover:border-ink-300'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
