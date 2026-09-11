import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Shield,
  Users,
  ClipboardCheck,
  LogOut,
  Scale,
  Calendar,
  Award
} from 'lucide-react'
import type { UserRole } from '../../types'

interface SidebarProps {
  role: UserRole
}

const businessLinks = [
  { to: '/business', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/business/register', icon: PlusCircle, label: 'Register Instrument' },
  { to: '/business/applications', icon: FileText, label: 'Applications' },
]

const officerLinks = [
  { to: '/officer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/officer/applications', icon: ClipboardCheck, label: 'All Applications' },
  { to: '/officer/scheduled', icon: Calendar, label: 'Scheduled' },
  { to: '/officer/verified', icon: Award, label: 'Verified' },
]

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate()
  const links = role === 'officer' ? officerLinks : businessLinks
  const roleLabel = role === 'officer' ? 'Legal Metrology Officer' : 'Business Owner'
  const roleInitial = role === 'officer' ? 'O' : 'B'
  const roleColor = role === 'officer' ? 'bg-violet-600' : 'bg-brand-600'

  return (
    <aside className="w-60 shrink-0 bg-navy-900 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-brand-500 rounded-lg">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">MetroVerify</p>
            <p className="text-white/40 text-[10px]">Legal Metrology System</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', roleColor)}>
            {roleInitial}
          </div>
          <div className="min-w-0">
            <p className="text-white/90 text-xs font-medium truncate">{roleLabel}</p>
            <p className="text-white/40 text-[10px]">Demo Mode</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/8'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Switch Role */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors duration-100"
        >
          <LogOut className="h-4 w-4" />
          Switch Role
        </button>
      </div>
    </aside>
  )
}
