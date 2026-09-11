import clsx from 'clsx'
import type { ApplicationStatus } from '../../types'

type BadgeVariant = ApplicationStatus | 'PASS' | 'FAIL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRING' | 'EXPIRED' | 'HIGH' | 'NORMAL' | 'LOW'

const variantMap: Record<string, string> = {
  DRAFT:            'bg-slate-100 text-slate-600',
  SUBMITTED:        'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  UNDER_REVIEW:     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  APPROVED:         'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  REJECTED:         'bg-red-50 text-red-700 ring-1 ring-red-200',
  SCHEDULED:        'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  UNDER_INSPECTION: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  VERIFIED:         'bg-green-50 text-green-700 ring-1 ring-green-200',
  FAILED:           'bg-red-50 text-red-700 ring-1 ring-red-200',
  EXPIRED:          'bg-slate-100 text-slate-500',
  PASS:             'bg-green-50 text-green-700 ring-1 ring-green-200',
  FAIL:             'bg-red-50 text-red-700 ring-1 ring-red-200',
  ACTIVE:           'bg-green-50 text-green-700',
  EXPIRING_SOON:    'bg-amber-50 text-amber-700',
  EXPIRING:         'bg-orange-50 text-orange-700',
  HIGH:             'bg-red-50 text-red-600',
  NORMAL:           'bg-slate-100 text-slate-600',
  LOW:              'bg-green-50 text-green-600',
}

const labelMap: Record<string, string> = {
  UNDER_REVIEW:     'Under Review',
  UNDER_INSPECTION: 'Under Inspection',
  EXPIRING_SOON:    'Expiring Soon',
}

interface Props {
  status: BadgeVariant | string
  className?: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, className, size = 'sm' }: Props) {
  const cls = variantMap[status] ?? 'bg-slate-100 text-slate-600'
  const label = labelMap[status] ?? status.replace(/_/g, ' ')
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        cls,
        className
      )}
    >
      {label}
    </span>
  )
}
