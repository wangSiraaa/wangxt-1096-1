import { getLevelCategory } from '@/types'

const categoryStyles: Record<string, string> = {
  '初级': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '中级': 'bg-blue-50 text-blue-700 border-blue-200',
  '高级': 'bg-purple-50 text-purple-700 border-purple-200',
  '专业级': 'bg-vermilion-50 text-vermilion-700 border-vermilion-200',
}

export default function LevelBadge({ level }: { level: number }) {
  const category = getLevelCategory(level)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${categoryStyles[category]}`}>
      {level}级 · {category}
    </span>
  )
}
