import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Activity, Cpu, ShieldCheck, Sparkles, ArrowUpRight, Scale, Radio, ChevronRight 
} from "lucide-react";

interface HeroV3Props {
  onNavigate: (tab: string) => void;
}

const CUSTOM_EASE = [0.16, 1, 0.3, 1] as const;

export function HeroV3({ onNavigate }: HeroV3Props) {
  const shouldReduceMotion = useReducedMotion();
  const headlineWords = "Automated Metrology Verification Engine for Next-Gen Compliance".split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
        delayChildren: 0.1
      }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: CUSTOM_EASE
      }
    }
  };

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-12 py-24 sm:py-32 lg:py-40 overflow-hidden max-w-[1400px] mx-auto">
      {/* Animated Glowing Grid Background */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(14,165,233,0.15) 0%, transparent 70%), 
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), 
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 48px 48px, 48px 48px"
        }}
      />

      {/* Radial Obsidian Backdrop Ambience */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] lg:w-[850px] h-[350px] sm:h-[450px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" 
      />

      {/* Status Pill */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: CUSTOM_EASE }}
        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 mb-8 sm:mb-10 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-[11px] sm:text-xs text-zinc-300 tracking-wider uppercase">
          MetroVerify v3.0 · SIH Enterprise Prototype
        </span>
      </motion.div>

      {/* Word-by-Word Stagger Headline */}
      <motion.h1
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-xl lg:max-w-4xl font-sans font-semibold text-3xl sm:text-5xl lg:text-6xl text-[#FAFAFA] tracking-[-0.03em] leading-[1.05] mb-6 sm:mb-8"
      >
        {headlineWords.map((word, index) => (
          <motion.span
            key={index}
            variants={wordVariants}
            className="inline-block mr-[0.25em]"
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: CUSTOM_EASE }}
        className="max-w-xl lg:max-w-2xl text-zinc-400 text-base sm:text-lg lg:text-xl font-normal leading-relaxed mb-10 sm:mb-12 tracking-tight px-2"
      >
        Statutory MPE tolerance determinations, live weighbridge sensor telemetry streaming, and automated neural stamping plate verification.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: CUSTOM_EASE }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-20 sm:mb-28"
      >
        <motion.button
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => onNavigate("telemetry")}
          className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-sm transition-all shadow-[0_0_40px_rgba(14,165,233,0.35)] hover:from-cyan-400 hover:to-blue-500"
        >
          <Activity className="w-4 h-4 text-black" />
          <span>Launch IoT Telemetry</span>
          <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>

        <motion.button
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => onNavigate("ai-assistant")}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#111113] border border-white/10 text-[#FAFAFA] font-medium text-sm hover:border-white/20 hover:bg-white/5 transition-all"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>AI Vision OCR Assistant</span>
        </motion.button>
      </motion.div>

      {/* Responsive Feature Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full text-left">
        {[
          { 
            icon: Activity, 
            title: "Live Weighbridge Stream", 
            badge: "2 Hz Telemetry",
            desc: "Continuous load-cell vector monitoring detecting corner imbalance, zero drift, and potentiometer fraud.", 
            link: "telemetry" 
          },
          { 
            icon: Cpu, 
            title: "Neural Plate Extraction", 
            badge: "OCR Stamping",
            desc: "Instant vision parsing of manufacturer stamping plates, model approval marks, and verification intervals.", 
            link: "ai-assistant" 
          },
          { 
            icon: ShieldCheck, 
            title: "Tamper-Evident Ledger", 
            badge: "SHA-256 Ledger",
            desc: "Cryptographically chained immutable audit records certifying every field inspection and load test.", 
            link: "hub" 
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={shouldReduceMotion ? {} : { y: -4 }}
              transition={{ duration: 0.25, ease: CUSTOM_EASE }}
              onClick={() => onNavigate(card.link)}
              className="group p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 uppercase tracking-wider">
                  {card.badge}
                </span>
              </div>

              <h3 className="font-sans font-semibold text-lg text-[#FAFAFA] mb-2 group-hover:text-cyan-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                {card.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
