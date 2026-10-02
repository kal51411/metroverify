import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { Menu, X, ChevronDown } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const PRIMARY_NAV = [
  { id: "home", label: "Overview" },
  { id: "inspector", label: "Inspections" },
  { id: "certificates", label: "Certificates" },
  { id: "verify", label: "Verify" },
];

const SECONDARY_NAV = [
  { id: "applicant", label: "Applications" },
  { id: "high_capacity", label: "High-Capacity" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "admin", label: "Standards" },
  { id: "audit", label: "Audit Ledger" },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { language, setLanguage } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-iron">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-3 group"
          >
            {/* Amber square mark */}
            <div className="w-7 h-7 bg-amber flex items-center justify-center shrink-0">
              <div className="w-3 h-3 bg-black" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
            </div>
            <span className="font-display font-bold text-lg text-warm tracking-tight group-hover:text-amber transition-colors">
              MetroVerify
            </span>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {PRIMARY_NAV.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === id ? "text-warm" : "text-ash hover:text-fog"
                }`}
              >
                {label}
                {activeTab === id && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-px bg-amber"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            ))}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors ${
                  SECONDARY_NAV.some(n => n.id === activeTab) ? "text-warm" : "text-ash hover:text-fog"
                }`}
              >
                More
                <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-1 w-48 bg-onyx border border-iron py-1 z-50"
                  >
                    {SECONDARY_NAV.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => { setActiveTab(id); setMoreOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          activeTab === id ? "text-amber bg-amber/5" : "text-ash hover:text-fog hover:bg-white/3"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "mr" : "en")}
              className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-ash hover:text-fog transition-colors"
            >
              {language === "en" ? "मराठी" : "English"}
            </button>

            {/* Verify CTA */}
            <button
              onClick={() => setActiveTab("verify")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber text-black font-mono text-xs font-bold hover:bg-amber-light transition-colors"
            >
              Verify Certificate
            </button>

            {/* Mobile menu */}
            <button
              className="md:hidden p-1 text-ash hover:text-fog"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-iron bg-black"
          >
            <div className="px-6 py-4 space-y-1">
              {[...PRIMARY_NAV, ...SECONDARY_NAV].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileOpen(false); }}
                  className={`w-full text-left px-3 py-3 text-sm border-b border-iron/50 transition-colors ${
                    activeTab === id ? "text-amber" : "text-ash hover:text-fog"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="pt-3">
                <button
                  onClick={() => setLanguage(language === "en" ? "mr" : "en")}
                  className="font-mono text-xs text-ash"
                >
                  {language === "en" ? "मराठी" : "English"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
