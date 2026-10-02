import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Scale, ShieldCheck, FileCheck, ClipboardList, Activity,
  Database, QrCode, Globe, Wifi, Compass, Award
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { id: "home", label: "OVERVIEW", icon: Compass },
    { id: "applicant", label: t("nav_applicant"), icon: ClipboardList },
    { id: "inspector", label: t("nav_inspector"), icon: ShieldCheck },
    { id: "high_capacity", label: t("nav_high_capacity"), icon: Scale },
    { id: "diagnostics", label: t("nav_diagnostics"), icon: Activity },
    { id: "admin", label: t("nav_admin"), icon: Database },
    { id: "audit", label: t("nav_audit"), icon: FileCheck },
    { id: "certificates", label: "CERTIFICATES", icon: Award },
    { id: "verify", label: t("nav_verify"), icon: QrCode },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#080c14] sticky top-0 z-50">
      {/* Precision Technical Meta Header */}
      <div className="bg-[#05080e] px-4 sm:px-8 py-1.5 text-[11px] font-mono text-slate-400 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider bg-blue-950/80 text-blue-400 border border-blue-800/80 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            LEGAL METROLOGY ACT, 2009
          </span>
          <span className="hidden md:inline text-slate-400 font-sans">
            Maharashtra Enforcement Framework | Rule 2026.4 (July 2026 4th Amendment)
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono tracking-tight">
            <Wifi className="w-3 h-3" />
            <span>[LEDGER: SHA-256 ACTIVE]</span>
          </span>
          <button
            onClick={() => setLanguage(language === "en" ? "mr" : "en")}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] border border-slate-700 font-medium transition"
          >
            <Globe className="w-3 h-3 text-blue-400" />
            <span>{t("btn_switch_lang")}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Platform ID */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setActiveTab("home")}
          >
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white border border-blue-400/40 shadow-sm transition group-hover:bg-blue-500">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-white tracking-tight uppercase">METROVERIFY</span>
                <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-900 text-slate-300 border border-slate-700">v2.0</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wider transition border ${
                    isActive
                      ? "bg-blue-950/60 text-blue-300 border-blue-600/60"
                      : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile/Tablet Tab Selector dropdown */}
          <div className="xl:hidden flex items-center">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 px-3 py-1.5 focus:outline-none focus:border-blue-600"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
