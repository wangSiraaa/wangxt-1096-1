import type { RegistrationStatus, SessionStatus } from '@/types'
import { getRegistrationStatusText, getSessionStatusText } from '@/types'

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
  finished: 'bg-dai-100 text-dai-700',
  pending_upload: 'bg-amber-100 text-amber-800',
  pending_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-blue-100 text-blue-800',
  scored: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {getSessionStatusText(status)}
    </span>
  )
}

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {getRegistrationStatusText(status)}
    </span>
  )
}
