import React from "react";
import { motion } from "framer-motion";
import { Scale, Navigation } from "lucide-react";

interface NavbarV3Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenGeoModal?: () => void;
}

export function NavbarV3({ activeTab, setActiveTab, onOpenGeoModal }: NavbarV3Props) {
  const navItems = [
    { id: "home", label: "Overview" },
    { id: "telemetry", label: "IoT Telemetry" },
    { id: "ai-assistant", label: "AI Vision OCR" },
    { id: "applicant", label: "Applicant Portal" },
    { id: "inspector", label: "Inspector Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => setActiveTab("home")} className="flex items-center gap-3 group text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            <Scale className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-[#FAFAFA] tracking-tight block">MetroVerify</span>
            <span className="font-mono text-[10px] text-cyan-400 tracking-wider uppercase block">v3.0 Enterprise</span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#111113] p-1.5 rounded-2xl border border-white/[0.08]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "text-[#FAFAFA]" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white/[0.08] border border-white/[0.08] rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {onOpenGeoModal && (
            <button
              onClick={onOpenGeoModal}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 animate-pulse" />
              <span>Geo Verify</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Encrypted Ledger Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
