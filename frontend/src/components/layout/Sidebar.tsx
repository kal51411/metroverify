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
  Award,
  Building2,
  BarChart3,
  Database,
  Code2,
  Smartphone,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import type { UserRole } from '../../types'

interface SidebarProps {
  role: UserRole
}

const businessLinks = [
  { to: '/business', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/business/register', icon: PlusCircle, label: 'Register Instrument' },
  { to: '/business/applications', icon: FileText, label: 'My Applications & Renewals' },
  { to: '/repository', icon: Database, label: 'Digital Certificate Vault' },
  { to: '/architecture', icon: Code2, label: 'System Architecture' },
]

const officerLinks = [
  { to: '/officer', icon: LayoutDashboard, label: 'LMO Operations Hub', end: true },
  { to: '/officer/applications', icon: ClipboardCheck, label: 'Application Queue' },
  { to: '/officer/scheduled', icon: Calendar, label: 'Scheduled Verifications' },
  { to: '/admin', icon: BarChart3, label: 'State Enforcement View' },
  { to: '/gatc', icon: Building2, label: 'GATC Testing Lab Portal' },
  { to: '/repository', icon: Database, label: 'Central Registry Search' },
  { to: '/architecture', icon: Code2, label: 'Technical Docs' },
]

const gatcLinks = [
  { to: '/gatc', icon: Building2, label: 'GATC Lab Dashboard', end: true },
  { to: '/officer/applications', icon: ClipboardCheck, label: 'Assigned Test Queue' },
  { to: '/repository', icon: Database, label: 'Central Records Vault' },
  { to: '/architecture', icon: Code2, label: 'Accreditation Specs' },
]

const adminLinks = [
  { to: '/admin', icon: BarChart3, label: 'Controller Enforcement', end: true },
  { to: '/officer', icon: LayoutDashboard, label: 'LMO Operations' },
  { to: '/gatc', icon: Building2, label: 'GATC Lab Monitoring' },
  { to: '/repository', icon: Database, label: 'Central Registry Search' },
  { to: '/architecture', icon: Code2, label: 'Security & Deployment' },
]

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate()

  let links = businessLinks
  let roleLabel = 'Business Owner / Trader'
  let roleInitial = 'B'
  let roleColor = 'bg-brand-600'

  if (role === 'officer') {
    links = officerLinks
    roleLabel = 'State LMO Officer'
    roleInitial = 'L'
    roleColor = 'bg-violet-600'
  } else if (role === 'gatc') {
    links = gatcLinks
    roleLabel = 'GATC Test Centre Lab'
    roleInitial = 'G'
    roleColor = 'bg-teal-600'
  } else if (role === 'admin') {
    links = adminLinks
    roleLabel = 'State Controller (Admin)'
    roleInitial = 'A'
    roleColor = 'bg-rose-600'
  }

  return (
    <aside className="w-64 shrink-0 bg-navy-900 flex flex-col h-screen sticky top-0 border-r border-white/10 z-30">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2 bg-brand-600 rounded-xl">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">MetroVerify</p>
            <p className="text-white/40 text-[10px]">Legal Metrology Ecosystem</p>
          </div>
        </div>
      </div>

      {/* Role Selector Box */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Active Stakeholder</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">Sec. 24 / Rule 27</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm', roleColor)}>
            {roleInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white/95 text-xs font-semibold truncate">{roleLabel}</p>
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value
                if (r === 'business') navigate('/business')
                else if (r === 'officer') navigate('/officer')
                else if (r === 'gatc') navigate('/gatc')
                else if (r === 'admin') navigate('/admin')
                else if (r === 'public') navigate('/verify')
              }}
              className="bg-transparent text-white/50 text-[11px] hover:text-brand-300 focus:outline-none cursor-pointer w-full"
            >
              <option value="business" className="bg-slate-900 text-white">Switch: Business Owner</option>
              <option value="officer" className="bg-slate-900 text-white">Switch: State LMO Officer</option>
              <option value="gatc" className="bg-slate-900 text-white">Switch: GATC Test Centre</option>
              <option value="admin" className="bg-slate-900 text-white">Switch: State Controller (Admin)</option>
              <option value="public" className="bg-slate-900 text-white">Switch: Public Consumer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-wider">Navigation</p>
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                  : 'text-white/65 hover:text-white hover:bg-white/8'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-white/10">
          <p className="px-3 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-wider">Public &amp; Compliance</p>
          <button
            onClick={() => navigate('/verify')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left"
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>Public Verify (QR Lookup)</span>
          </button>
        </div>
      </nav>

      {/* Switch Role / Exit */}
      <div className="p-3 border-t border-white/10 bg-black/10">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Landing &amp; Role Hub
        </button>
      </div>
    </aside>
  )
}
