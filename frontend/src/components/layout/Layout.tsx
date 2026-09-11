import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import type { UserRole } from '../../types'

interface LayoutProps {
  role: UserRole
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export function Layout({ role, children, title, subtitle, actions }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        {(title || actions) && (
          <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              {title && <h1 className="text-xl font-semibold text-slate-900">{title}</h1>}
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
