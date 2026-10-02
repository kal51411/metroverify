import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Scale, ShieldCheck, FileCheck, ClipboardList, Activity,
  Database, QrCode, Globe, CheckCircle2, Wifi
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { id: "applicant", label: t("nav_applicant"), icon: ClipboardList },
    { id: "inspector", label: t("nav_inspector"), icon: ShieldCheck },
    { id: "high_capacity", label: t("nav_high_capacity"), icon: Scale },
    { id: "diagnostics", label: t("nav_diagnostics"), icon: Activity },
    { id: "admin", label: t("nav_admin"), icon: Database },
    { id: "audit", label: t("nav_audit"), icon: FileCheck },
    { id: "verify", label: t("nav_verify"), icon: QrCode },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0f172a] sticky top-0 z-50">
      {/* Top Compliance Bar */}
      <div className="bg-slate-900 px-4 py-1.5 text-xs text-slate-400 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800">
            MAHARASHTRA LEGAL METROLOGY FRAMEWORK
          </span>
          <span className="hidden sm:inline text-slate-400">
            Legal Metrology Act, 2009 & General Rules 2011 (Amended 2025/2026)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Wifi className="w-3 h-3" />
            <span>SYNCED (LEDGER ONLINE)</span>
          </span>
          <button
            onClick={() => setLanguage(language === "en" ? "mr" : "en")}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-medium transition"
          >
            <Globe className="w-3 h-3 text-blue-400" />
            <span>{t("btn_switch_lang")}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("applicant")}>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">MetroVerify</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">v2.0</span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">Digital Legal Metrology & Audit Ledger</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs whitespace-nowrap transition ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
