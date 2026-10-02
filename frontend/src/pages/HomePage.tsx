import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Shield, Award, Activity } from "lucide-react";
import { ScaleVisualization } from "../components/ScaleVisualization";
import { LiveMPEDemo } from "../components/MPEDemo";

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

// ── ANIMATION VARIANTS ──────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.9, ease: "easeOut" as const, delay }
  })
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

// ── SECTION WRAPPER ─────────────────────────────────────────────
const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = "", id }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  return (
    <section ref={ref} id={id} className={className}>
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
      >
        {children}
      </motion.div>
    </section>
  );
};

// ── ANNOTATION LINE ─────────────────────────────────────────────
const Annotation: React.FC<{ label: string; value: string; delay?: number }> = ({ label, value, delay = 0 }) => (
  <motion.div
    variants={fadeUp}
    custom={delay}
    className="flex items-center gap-3"
  >
    <div className="font-mono text-[10px] text-ash uppercase tracking-widest w-24 text-right">{label}</div>
    <div className="flex items-center gap-2 flex-1">
      <motion.div
        className="h-px bg-amber flex-1 max-w-12 opacity-60"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      />
      <span className="font-mono font-bold text-warm text-sm">{value}</span>
    </div>
  </motion.div>
);

// ── NUMBER TICKER ───────────────────────────────────────────────
const NumberTicker: React.FC<{ value: number; decimals?: number; suffix?: string; className?: string }> = ({
  value, decimals = 3, suffix = "", className = ""
}) => {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start: number;
    const duration = 1400;
    const startVal = value - 0.15;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(startVal + (value - startVal) * ease);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {displayed.toFixed(decimals)}{suffix}
    </span>
  );
};

// ── SCROLL PROGRESS BAR ─────────────────────────────────────────
const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-px bg-amber z-50 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

// ── MAIN HOMEPAGE ──────────────────────────────────────────────
export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [heroWeightPlaced, setHeroWeightPlaced] = useState(false);
  const [heroIndication, setHeroIndication] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  }, []);

  const handlePlaceWeight = () => {
    setHeroWeightPlaced(true);
    setTimeout(() => setHeroIndication(50.042), 900);
  };

  return (
    <div className="relative">
      <ScrollProgress />

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  HERO                                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <motion.div
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-center overflow-hidden -mt-8"
        onMouseMove={handleHeroMouseMove}
        style={{ opacity: heroOpacity, y: heroY }}
      >
        {/* Ambient light from top-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at ${mousePos.x * 100}% ${mousePos.y * 60}%, rgba(217,119,6,0.06) 0%, transparent 70%)`,
            transition: "background 0.3s ease",
          }}
        />

        {/* Subtle hairline grid */}
        <div className="absolute inset-0 hairline-grid opacity-40 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-screen">
          {/* ── LEFT: Editorial Typography ── */}
          <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20 pt-24 pb-16 space-y-8">
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-px h-8 bg-amber" />
                <span className="font-mono text-xs text-amber uppercase tracking-widest">
                  Legal Metrology Act, 2009
                </span>
              </div>
            </motion.div>

            <motion.h1
              className="font-display text-6xl sm:text-7xl xl:text-8xl font-black text-warm leading-[0.9] tracking-tight"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.span variants={fadeUp} custom={0.1} className="block">
                PRECISION
              </motion.span>
              <motion.span variants={fadeUp} custom={0.2} className="block italic text-ash">
                YOU CAN
              </motion.span>
              <motion.span variants={fadeUp} custom={0.3} className="block gradient-text-amber">
                VERIFY.
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={0.5}
              initial="hidden"
              animate="visible"
              className="text-base text-silver leading-relaxed max-w-md"
            >
              Deterministic metrological inspection. Automated error evaluation against statutory MPE limits.
              Tamper-proof cryptographic certificates. From measurement to verified certificate — in one system.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={0.65}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-4 pt-2"
            >
              <button
                onClick={() => onNavigate("inspector")}
                className="btn-amber flex items-center gap-3 px-8 py-4 bg-amber text-black font-mono text-xs font-bold tracking-wider"
              >
                OPEN INSPECTOR WORKSTATION
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("verify")}
                className="flex items-center gap-3 px-8 py-4 bg-transparent border border-iron text-fog font-mono text-xs tracking-wider hover:border-amber hover:text-amber transition-colors"
              >
                VERIFY A CERTIFICATE
              </button>
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex items-center gap-3 text-steel pt-8"
            >
              <ChevronDown className="w-4 h-4 animate-bounce" />
              <span className="font-mono text-xs">Scroll to see how verification works</span>
            </motion.div>
          </div>

          {/* ── RIGHT: Instrument Visualization ── */}
          <div className="relative flex items-center justify-center px-8 py-16 lg:py-0">
            {/* Soft amber glow behind scale */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-96 h-96 rounded-full bg-amber-glow blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <ScaleVisualization
                size="lg"
                loadFraction={heroWeightPlaced ? 0.167 : 0}
                indication={heroIndication}
                hasWeight={heroWeightPlaced}
                weightLabel="50 kg"
                animate={true}
                interactive={false}
              />

              {/* Interactive prompt */}
              <AnimatePresence>
                {!heroWeightPlaced ? (
                  <motion.button
                    key="place"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={handlePlaceWeight}
                    className="font-mono text-xs text-amber border border-amber/30 px-5 py-2.5 hover:bg-amber/10 transition-colors"
                  >
                    → Place 50 kg standard weight
                  </motion.button>
                ) : heroIndication === null ? (
                  <motion.div
                    key="measuring"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-xs text-silver flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-amber rounded-full dot-pulse" />
                    Measuring…
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-1"
                  >
                    <div className="font-mono text-2xl font-bold text-pass">50.042 kg</div>
                    <div className="font-mono text-xs text-ash">Indication recorded · Error +0.042 kg · Within MPE</div>
                    <button
                      onClick={() => { setHeroWeightPlaced(false); setHeroIndication(null); }}
                      className="font-mono text-xs text-steel hover:text-amber transition-colors mt-2"
                    >
                      Reset
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  SECTION 1 — THE INSTRUMENT                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Section
        id="s-instrument"
        className="py-32 px-8 md:px-16 border-t border-iron"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <motion.div variants={fadeUp} custom={0}>
              <div className="font-mono text-xs text-amber uppercase tracking-widest mb-4">01 / The Instrument</div>
              <h2 className="font-display text-5xl xl:text-6xl font-bold text-warm leading-tight">
                Every verification begins with the instrument.
              </h2>
            </motion.div>
            <motion.p variants={fadeUp} custom={0.15} className="text-silver text-base leading-relaxed max-w-lg">
              Before any measurement is taken, the instrument's metrological identity is confirmed.
              Manufacturer, model, serial number, accuracy class, capacity range —
              each attribute is recorded and locked into the inspection record.
            </motion.p>

            {/* Engineering annotations */}
            <div className="space-y-3 pt-4">
              <motion.div variants={fadeUp} custom={0}>
                <div className="font-mono text-[10px] text-steel uppercase tracking-widest mb-3">INSTRUMENT SPECIFICATION</div>
              </motion.div>
              <Annotation label="TYPE" value="Electronic Platform Scale" delay={0.1} />
              <Annotation label="CLASS" value="Class III — Industrial Trade" delay={0.2} />
              <Annotation label="MAX" value="300 kg" delay={0.3} />
              <Annotation label="MIN" value="1 kg" delay={0.4} />
              <Annotation label="e" value="100 g (0.100 kg)" delay={0.5} />
              <Annotation label="MODEL APVL" value="WM / MH / 2023 / 00124" delay={0.6} />
            </div>
          </div>

          <motion.div variants={fadeUp} custom={0.2} className="flex justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 rounded-full bg-amber-glow blur-3xl opacity-40" />
            </div>
            <ScaleVisualization size="lg" loadFraction={0} hasWeight={false} animate={false} className="relative z-10" />
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  SECTION 2 — MEASURE                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Section className="py-32 px-8 md:px-16 bg-charcoal border-t border-iron">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div variants={fadeUp} custom={0.1} className="flex justify-center relative order-2 lg:order-1">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 rounded-full bg-amber-glow blur-3xl opacity-30" />
            </div>
            <ScaleVisualization
              size="lg"
              loadFraction={0.167}
              indication={50.042}
              hasWeight={true}
              weightLabel="50 kg"
              animate={true}
              className="relative z-10"
            />
          </motion.div>

          <div className="space-y-8 order-1 lg:order-2">
            <motion.div variants={fadeUp} custom={0}>
              <div className="font-mono text-xs text-amber uppercase tracking-widest mb-4">02 / Measurement</div>
              <h2 className="font-display text-5xl xl:text-6xl font-bold text-warm leading-tight">
                Place the standard weight. Read the indication.
              </h2>
            </motion.div>
            <motion.p variants={fadeUp} custom={0.15} className="text-silver text-base leading-relaxed max-w-lg">
              Calibrated standard weights — traceable to national standards — are applied to
              the instrument platform. The displayed indication is recorded against the known standard value.
            </motion.p>

            {/* Live measurement display */}
            <motion.div variants={fadeUp} custom={0.25} className="bg-black border border-iron p-6 space-y-4">
              <div className="font-mono text-[10px] text-ash uppercase tracking-widest">MEASUREMENT RECORD</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "STANDARD VALUE", value: "50.000", unit: "kg", color: "text-fog" },
                  { label: "INDICATION", value: "50.042", unit: "kg", color: "text-warm" },
                  { label: "ERROR", value: "+0.042", unit: "kg", color: "text-amber-light" },
                  { label: "LOAD POINT", value: "500 × e", unit: "", color: "text-fog" },
                ].map(({ label, value, unit, color }) => (
                  <div key={label}>
                    <div className="font-mono text-[9px] text-steel uppercase tracking-wider mb-1">{label}</div>
                    <div className={`font-mono font-bold text-xl ${color}`}>
                      {value}<span className="text-sm text-ash ml-1">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-iron">
                <div className="font-mono text-[9px] text-ash">
                  Measurement recorded in inspection ledger · SHA-256 hash computed
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  SECTION 3 — LIVE MPE DEMO                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Section className="py-32 px-8 md:px-16 border-t border-iron">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
            <div className="lg:col-span-2 space-y-6">
              <motion.div variants={fadeUp} custom={0}>
                <div className="font-mono text-xs text-amber uppercase tracking-widest mb-4">03 / Verification</div>
                <h2 className="font-display text-5xl xl:text-6xl font-bold text-warm leading-tight">
                  Within tolerance, or beyond it?
                </h2>
              </motion.div>
              <motion.p variants={fadeUp} custom={0.15} className="text-silver text-base leading-relaxed">
                The Maximum Permissible Error — defined in Schedule I of the Legal Metrology Rules 2011 —
                is the decisive threshold. Exceed it, and verification fails.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.25} className="space-y-3 border-l-2 border-amber pl-4">
                <div className="font-mono text-xs text-ash leading-relaxed">
                  This demonstration uses the actual MetroVerify rules engine.
                  The calculation is real. The result is the same calculation used in statutory inspections.
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeUp} custom={0.2} className="lg:col-span-3">
              <LiveMPEDemo />
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  SECTION 4 — REPEATABILITY                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Section className="py-32 px-8 md:px-16 bg-charcoal border-t border-iron">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            <div className="space-y-8">
              <motion.div variants={fadeUp} custom={0}>
                <div className="font-mono text-xs text-amber uppercase tracking-widest mb-4">04 / Repeatability</div>
                <h2 className="font-display text-5xl font-bold text-warm leading-tight">
                  The same load, three times.
                </h2>
              </motion.div>
              <motion.p variants={fadeUp} custom={0.15} className="text-silver leading-relaxed">
                The same standard weight is applied three times consecutively.
                The range of the readings must not exceed the MPE at that load point.
                Repeatability reveals instrument drift, instability, and creep.
              </motion.p>
            </div>

            {/* Repeatability visualization */}
            <motion.div variants={fadeUp} custom={0.2} className="space-y-6">
              <div className="bg-black border border-iron p-6 space-y-6">
                <div className="font-mono text-[10px] text-ash uppercase tracking-widest">Test Load: 150 kg (½ Max)</div>

                {/* Three readings */}
                {[
                  { run: "Run 01", value: 150.040, bar: 0.4 },
                  { run: "Run 02", value: 150.042, bar: 0.6 },
                  { run: "Run 03", value: 150.041, bar: 0.5 },
                ].map(({ run, value, bar }, i) => (
                  <motion.div
                    key={run}
                    variants={fadeUp}
                    custom={0.1 * i}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-steel">{run}</span>
                      <span className="font-mono font-bold text-warm">
                        <NumberTicker value={value} decimals={3} suffix=" kg" />
                      </span>
                    </div>
                    <div className="relative h-1 bg-iron">
                      <motion.div
                        className="absolute left-0 top-0 h-1 bg-amber"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${bar * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 * i, ease: "easeOut" as const }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </motion.div>
                ))}

                <div className="border-t border-iron pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-[9px] text-steel uppercase tracking-wider">Range</div>
                    <div className="font-mono font-bold text-lg text-warm">0.002 kg</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-steel uppercase tracking-wider">MPE Limit</div>
                    <div className="font-mono font-bold text-lg text-amber-light">0.100 kg</div>
                  </div>
                </div>
                <div className="bg-passBg border border-pass/30 px-4 py-3 font-mono text-pass text-sm font-bold">
                  ✓ REPEATABILITY — PASS
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  SECTION 5 — CERTIFICATE                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Section className="py-32 px-8 md:px-16 border-t border-iron">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
            <div className="lg:col-span-2 space-y-8">
              <motion.div variants={fadeUp} custom={0}>
                <div className="font-mono text-xs text-amber uppercase tracking-widest mb-4">05 / Certificate</div>
                <h2 className="font-display text-5xl font-bold text-warm leading-tight">
                  From measurement to verified certificate.
                </h2>
              </motion.div>
              <motion.p variants={fadeUp} custom={0.15} className="text-silver leading-relaxed">
                Upon successful completion of all test sequences, a Schedule IX verification
                certificate is generated. It carries a unique certificate number, SHA-256 cryptographic hash,
                and a QR code for public verification.
              </motion.p>

              {/* Flow diagram */}
              <motion.div variants={fadeUp} custom={0.25} className="space-y-0">
                {[
                  { step: "Inspection completed", status: "done" },
                  { step: "MPE evaluation passed", status: "done" },
                  { step: "Certificate generated", status: "done" },
                  { step: "SHA-256 hash computed", status: "done" },
                  { step: "QR code issued", status: "done" },
                  { step: "Public verification active", status: "active" },
                ].map(({ step, status }, i) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border mt-1 ${status === "active" ? "bg-amber border-amber" : "bg-pass border-pass"}`} />
                      {i < 5 && <div className="w-px flex-1 bg-iron my-1" style={{ height: "20px" }} />}
                    </div>
                    <div className={`font-mono text-xs pb-3 ${status === "active" ? "text-amber" : "text-silver"}`}>{step}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Certificate preview */}
            <motion.div variants={fadeUp} custom={0.3} className="lg:col-span-3">
              <div className="cert-paper relative overflow-hidden">
                {/* Certificate header */}
                <div className="border-b border-[#3a3530] px-8 py-6">
                  <div className="font-mono text-[9px] text-[#666] uppercase tracking-widest mb-2">
                    System-generated certificate · Legal Metrology Act, 2009
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] text-[#888] uppercase tracking-widest mb-1">VERIFICATION CERTIFICATE</div>
                      <div className="font-display font-bold text-2xl text-[#f0ede8]">LM-CERT-2026-0001</div>
                    </div>
                    <div className="w-14 h-14 bg-[#111] border border-[#333] flex items-center justify-center">
                      {/* QR pattern simplified */}
                      <svg viewBox="0 0 32 32" width="40" height="40">
                        {[0,8,16,24].map(x => [0,8,16,24].map(y => (
                          Math.random() > 0.5 && (
                            <rect key={`${x}${y}`} x={x} y={y} width={6} height={6} fill="#666" />
                          )
                        )))}
                        <rect x="0" y="0" width="12" height="12" fill="none" stroke="#888" strokeWidth="2"/>
                        <rect x="20" y="0" width="12" height="12" fill="none" stroke="#888" strokeWidth="2"/>
                        <rect x="0" y="20" width="12" height="12" fill="none" stroke="#888" strokeWidth="2"/>
                        <rect x="4" y="4" width="4" height="4" fill="#d97706"/>
                        <rect x="24" y="4" width="4" height="4" fill="#d97706"/>
                        <rect x="4" y="24" width="4" height="4" fill="#d97706"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Certificate body */}
                <div className="px-8 py-6 grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: "INSTRUMENT", value: "Electronic Platform Scale" },
                    { label: "ACCURACY CLASS", value: "Class III" },
                    { label: "SERIAL NUMBER", value: "EPS-MH-2023-8842" },
                    { label: "MAX CAPACITY", value: "300 kg" },
                    { label: "RESULT", value: "PASS", pass: true },
                    { label: "INTERVAL", value: "12 months" },
                    { label: "VERIFIED ON", value: "02 Oct 2026" },
                    { label: "VALID UNTIL", value: "01 Oct 2027" },
                  ].map(({ label, value, pass }) => (
                    <div key={label}>
                      <div className="font-mono text-[9px] text-[#555] uppercase tracking-wider mb-0.5">{label}</div>
                      <div className={`font-mono text-sm font-medium ${pass ? "text-pass font-bold" : "text-[#d0cdc8]"}`}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Crypto footer */}
                <div className="border-t border-[#2a2824] px-8 py-4 bg-[#141210]">
                  <div className="font-mono text-[8px] text-[#444] uppercase tracking-widest mb-1">SHA-256</div>
                  <div className="font-mono text-[10px] text-[#555] break-all">
                    a3f7b2e9d1c4...8a2f1d9c3e7b
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  SECTION 6 — ENTER THE SYSTEM                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Section className="py-32 px-8 md:px-16 bg-charcoal border-t border-iron">
        <div className="max-w-5xl mx-auto text-center space-y-16">
          <motion.div variants={fadeUp} custom={0} className="space-y-4">
            <div className="font-mono text-xs text-amber uppercase tracking-widest">06 / The System</div>
            <h2 className="font-display text-5xl xl:text-6xl font-black text-warm leading-tight">
              The complete metrological workflow.<br />
              <span className="italic font-normal text-silver">In one platform.</span>
            </h2>
          </motion.div>

          {/* System portals grid */}
          <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-iron">
            {[
              {
                tab: "applicant",
                label: "Applications",
                desc: "Submit instruments for statutory verification under the Legal Metrology Act. Track status from submission to certificate.",
                number: "01",
                icon: "📋",
              },
              {
                tab: "inspector",
                label: "Inspector Workspace",
                desc: "Execute the full inspection test sequence. Record measurements. Evaluate against MPE tables. Issue certificates.",
                number: "02",
                icon: "🔬",
                featured: true,
              },
              {
                tab: "certificates",
                label: "Certificate Ledger",
                desc: "All issued Schedule IX certificates with SHA-256 cryptographic integrity hashes. Searchable, printable, verifiable.",
                number: "03",
                icon: "📜",
              },
              {
                tab: "high_capacity",
                label: "High-Capacity Calculator",
                desc: "2026 weighbridge 1/2·Max, 1/3·Max, 1/5·Max substitution test planner. Fully rule-compliant.",
                number: "04",
                icon: "⚖️",
              },
              {
                tab: "audit",
                label: "Audit Ledger",
                desc: "SHA-256 hash-chained append-only event log. Every inspection, certificate, and verification action recorded immutably.",
                number: "05",
                icon: "🔗",
              },
              {
                tab: "verify",
                label: "Public Verification",
                desc: "Anyone can verify a certificate by ID or QR code. No login required. Cryptographic hash verification included.",
                number: "06",
                icon: "✓",
                cta: true,
              },
            ].map(({ tab, label, desc, number, featured, cta }) => (
              <motion.button
                key={tab}
                variants={fadeUp}
                onClick={() => onNavigate(tab)}
                className={`relative text-left p-8 group transition-colors ${
                  featured
                    ? "bg-amber/10 hover:bg-amber/15"
                    : "bg-charcoal hover:bg-black"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-4xl font-bold text-iron group-hover:text-steel transition-colors">{number}</span>
                    {featured && <span className="font-mono text-[9px] text-amber border border-amber/30 px-2 py-0.5">FEATURED</span>}
                  </div>
                  <div>
                    <div className={`font-display font-bold text-xl mb-2 transition-colors ${featured ? "text-amber" : "text-warm group-hover:text-amber"}`}>
                      {label}
                    </div>
                    <p className="text-silver text-sm leading-relaxed">{desc}</p>
                  </div>
                  <div className={`font-mono text-xs flex items-center gap-2 ${featured ? "text-amber" : "text-ash group-hover:text-amber"} transition-colors`}>
                    {cta ? "Open verification →" : "Open →"}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  FOOTER STRIP                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Section className="py-16 px-8 md:px-16 border-t border-iron">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} custom={0} className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Shield, label: "Rules Engine", desc: "MPE evaluation per Legal Metrology (General) Rules 2011 — Classes I, II, III, IIII" },
              { icon: Award, label: "Cryptographic Audit", desc: "SHA-256 hash-chained audit ledger. Every action is signed, ordered, and verifiable." },
              { icon: Activity, label: "Live Diagnostics", desc: "Signal stability analysis, creep evaluation, and measurement uncertainty estimation." },
            ].map(({ icon: Icon, label, desc }) => (
              <motion.div key={label} variants={fadeUp} className="flex gap-4">
                <div className="w-8 h-8 border border-iron flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-amber" />
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold text-fog uppercase tracking-wider">{label}</div>
                  <p className="text-steel text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} custom={0.3} className="mt-12 pt-8 border-t border-iron flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-display font-bold text-warm">METROVERIFY</div>
              <div className="font-mono text-xs text-steel mt-0.5">Digital Legal Metrology Platform · v2.0</div>
            </div>
            <div className="font-mono text-[11px] text-steel text-right leading-relaxed">
              <div>Legal Metrology Act, 2009 · Maharashtra Rules 2011 · Amendment 2026</div>
              <div className="mt-0.5 text-[#333]">Hackathon prototype — not an official government portal</div>
            </div>
          </motion.div>
        </div>
      </Section>
    </div>
  );
};
