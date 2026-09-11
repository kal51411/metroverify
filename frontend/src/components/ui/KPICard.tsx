import clsx from 'clsx'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: string
  trendUp?: boolean
  subtitle?: string
}

export function KPICard({ title, value, icon: Icon, iconColor = 'text-brand-600', iconBg = 'bg-brand-50', trend, trendUp, subtitle }: KPICardProps) {
  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <p className={clsx('mt-2 text-xs font-medium', trendUp ? 'text-green-600' : 'text-red-500')}>
              {trend}
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', iconBg)}>
          <Icon className={clsx('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}
