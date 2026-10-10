import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Navigation, Menu, X, Shield, Activity, Sparkles, User, LogOut } from "lucide-react";

interface NavbarV3Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenGeoModal?: () => void;
  currentUser?: { username: string; role: string } | null;
  onLogout?: () => void;
}

export function NavbarV3({ activeTab, setActiveTab, onOpenGeoModal, currentUser, onLogout }: NavbarV3Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Overview" },
    { id: "telemetry", label: "IoT Telemetry" },
    { id: "ai-assistant", label: "AI Vision OCR" },
    { id: "admin-analytics", label: "Analytics" },
    { id: "applicant", label: "Applicant Portal" },
    { id: "inspector", label: "Inspector Portal" },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-bold shadow-[0_0_25px_rgba(14,165,233,0.35)] group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="font-sans font-semibold text-lg text-[#FAFAFA] tracking-[-0.03em] leading-tight block">
              MetroVerify
            </span>
            <span className="font-mono text-[10px] text-cyan-400 tracking-wider uppercase block">
              v3 Enterprise
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#111113] p-1.5 rounded-full border border-white/5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-4 py-2 rounded-full text-xs font-medium tracking-tight transition-colors ${
                  isActive ? "text-[#FAFAFA]" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktopActiveTabPill"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {onOpenGeoModal && (
            <button
              onClick={onOpenGeoModal}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(14,165,233,0.15)]"
            >
              <Navigation className="w-3.5 h-3.5 animate-pulse" />
              <span>Geo Verify</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <button
                onClick={() => handleNavClick("auth")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-mono"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[100px]">{currentUser.username}</span>
                <span className="text-[10px] text-zinc-500 uppercase">({currentUser.role})</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick("auth")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#FAFAFA] hover:bg-white/10 transition-all"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          {onOpenGeoModal && (
            <button
              onClick={onOpenGeoModal}
              className="p-2.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              title="Geo Verify"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-2xl bg-[#111113] border border-white/10 text-zinc-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="sm:hidden border-b border-white/10 bg-[#0A0A0B]/95 backdrop-blur-2xl px-6 py-6 space-y-3"
          >
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              {currentUser ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-xs">
                      {currentUser.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-[#FAFAFA] font-medium">{currentUser.username}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">{currentUser.role}</div>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick("auth")}
                  className="w-full py-3 rounded-2xl bg-cyan-500 text-black font-semibold text-sm text-center shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                >
                  Sign In to Dashboard
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
