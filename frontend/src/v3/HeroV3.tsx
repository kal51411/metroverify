import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Activity, Cpu, ShieldCheck, Sparkles, ArrowUpRight, Radio, Scale, Shield 
} from "lucide-react";

interface HeroV3Props {
  onNavigate: (tab: string) => void;
}

const CUSTOM_EASE = [0.16, 1, 0.3, 1] as const;

export function HeroV3({ onNavigate }: HeroV3Props) {
  const shouldReduceMotion = useReducedMotion();
  const headlineWords = "Automated Metrology Verification Engine for Next-Gen Statutory Compliance".split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
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
        duration: 0.55,
        ease: CUSTOM_EASE
      }
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 lg:px-12 py-32 overflow-hidden max-w-[1400px] mx-auto">
      {/* Radial Obsidian Backdrop Ambience */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[400px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" 
      />

      {/* Verified Status Tag */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: CUSTOM_EASE }}
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-10 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-xs text-zinc-400 tracking-wider uppercase">
          MetroVerify v3.0 · SIH Enterprise Architecture
        </span>
      </motion.div>

      {/* Word-by-Word Stagger Headline */}
      <motion.h1
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl font-display font-semibold text-4xl sm:text-6xl lg:text-7xl text-[#FAFAFA] tracking-tight leading-[1.05] mb-10"
      >
        {headlineWords.map((word, index) => (
          <motion.span
            key={index}
            variants={wordVariants}
            className="inline-block mr-[0.28em] will-change-transform"
          >
            {word}
          </motion.span>
        ))}
      </motion.h1>

      {/* Body Copy */}
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45, ease: CUSTOM_EASE }}
        className="max-w-2xl text-zinc-400 text-lg sm:text-xl font-normal leading-relaxed mb-16 tracking-tight"
      >
        Statutory MPE tolerance determination, real-time IoT load-cell telemetry streaming, and neural vision plate parsing engineered for precision regulatory enforcement.
      </motion.p>

      {/* CTAs with Glow and Micro-lift */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: CUSTOM_EASE }}
        className="flex flex-wrap items-center justify-center gap-5 mb-28"
      >
        <motion.button
          whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => onNavigate("telemetry")}
          className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-cyan-500 text-black font-semibold text-sm transition-all shadow-[0_0_35px_rgba(14,165,233,0.35)] hover:bg-cyan-400"
        >
          <Activity className="w-4 h-4" />
          <span>Launch IoT Telemetry</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>

        <motion.button
          whileHover={shouldReduceMotion ? {} : { y: -2 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          onClick={() => onNavigate("ai-assistant")}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#111113] border border-white/[0.08] text-[#FAFAFA] font-semibold text-sm hover:border-white/[0.22] hover:bg-white/[0.04] transition-all"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>AI Vision OCR Assistor</span>
        </motion.button>
      </motion.div>

      {/* Animated Feature Grid with Custom Hover Lift & Border Glow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
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
            badge: "96.4% OCR Confidence",
            desc: "Instant vision parsing of manufacturer stamping plates, model approval marks, and verification intervals.", 
            link: "ai-assistant" 
          },
          { 
            icon: ShieldCheck, 
            title: "Cryptographic Audit Ledger", 
            badge: "SHA-256 Chained",
            desc: "Immutable tamper-evident hash trail chaining every inspection, payment, and test measurement step.", 
            link: "audit" 
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={shouldReduceMotion ? {} : { y: -4 }}
              transition={{ duration: 0.25, ease: CUSTOM_EASE }}
              onClick={() => onNavigate(card.link)}
              className="group p-8 rounded-3xl bg-[#111113] border border-white/[0.08] hover:border-white/[0.18] transition-all cursor-pointer relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/[0.03] rounded-full blur-2xl group-hover:bg-cyan-500/[0.08] transition-colors" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-500/30 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-400 uppercase tracking-wider">
                  {card.badge}
                </span>
              </div>

              <h3 className="font-display font-semibold text-lg text-[#FAFAFA] mb-2 group-hover:text-cyan-300 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans font-normal">
                {card.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
