import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const btnStyles = {
    danger: 'bg-vermilion-500 hover:bg-vermilion-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    primary: 'bg-dai-800 hover:bg-dai-900 text-white',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in-up">
        <div className="p-6">
          <div className="flex items-start gap-3">
            {variant === 'warning' && (
              <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={24} />
            )}
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900">{title}</h3>
              <p className="mt-2 text-sm text-dai-600 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="bg-ink-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-dai-600 bg-white border border-ink-200 rounded-lg hover:bg-ink-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${btnStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
