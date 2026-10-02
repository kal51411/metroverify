import React, { useEffect, useRef, useState } from "react";

interface ScaleVisualizationProps {
  /** 0–1 normalized load fraction (0=empty, 1=max capacity) */
  loadFraction?: number;
  /** Measured indication value to display */
  indication?: number | null;
  /** Unit label */
  unit?: string;
  /** Whether a weight is placed on the platform */
  hasWeight?: boolean;
  /** Weight label text */
  weightLabel?: string;
  /** Whether to animate needle */
  animate?: boolean;
  /** Size: 'sm' | 'md' | 'lg' */
  size?: "sm" | "md" | "lg";
  /** Interactive: needle follows mouse horizontal position */
  interactive?: boolean;
  className?: string;
}

const SIZE = {
  sm: { w: 280, h: 220 },
  md: { w: 420, h: 320 },
  lg: { w: 600, h: 460 },
};

export const ScaleVisualization: React.FC<ScaleVisualizationProps> = ({
  loadFraction = 0,
  indication = null,
  unit = "kg",
  hasWeight = false,
  weightLabel = "50 kg",
  animate = true,
  size = "md",
  interactive = false,
  className = "",
}) => {
  const [dialAngle, setDialAngle] = useState(-55);
  const [platformOffset, setPlatformOffset] = useState(0);
  const [mouseX, setMouseX] = useState(0.5);
  const svgRef = useRef<SVGSVGElement>(null);
  const { w, h } = SIZE[size];

  // Scale factors
  const scale = w / 420;
  const cx = w / 2;

  useEffect(() => {
    if (interactive) return;
    const targetAngle = -55 + loadFraction * 110;
    const targetOffset = hasWeight ? 4 * scale : 0;

    if (animate) {
      let start: number;
      const duration = 1200;
      const startAngle = -55;
      const startOffset = 0;

      const frame = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDialAngle(startAngle + (targetAngle - startAngle) * ease);
        setPlatformOffset(startOffset + (targetOffset - startOffset) * ease);
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    } else {
      setDialAngle(targetAngle);
      setPlatformOffset(targetOffset);
    }
  }, [loadFraction, hasWeight, animate, interactive, scale]);

  useEffect(() => {
    if (!interactive) return;
    const angle = -55 + mouseX * 110;
    setDialAngle(angle);
    setPlatformOffset(mouseX > 0.15 ? 4 * scale : 0);
  }, [mouseX, interactive, scale]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setMouseX((e.clientX - rect.left) / rect.width);
  };

  // ── SVG coordinate helpers ───────────────────────────────────
  const baseY = h - 30 * scale;         // ground level
  const bodyHeight = 150 * scale;       // main body height
  const bodyWidth = 160 * scale;        // main body width
  const platformW = 220 * scale;        // platform width
  const platformH = 12 * scale;         // platform thickness
  const platformY = baseY - bodyHeight - platformH; // platform top Y
  const platformCenterY = platformY + platformH / 2 + platformOffset;
  const dialCY = baseY - bodyHeight / 2;  // dial center Y
  const dialR = 55 * scale;             // dial radius

  // Needle endpoint
  const needleRad = (dialAngle * Math.PI) / 180;
  const needleLen = dialR * 0.75;
  const needleX = cx + Math.sin(needleRad) * needleLen;
  const needleY = dialCY - Math.cos(needleRad) * needleLen;

  // Dial tick marks
  const ticks = Array.from({ length: 21 }, (_, i) => i);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={`${className} ${interactive ? "cursor-none" : ""} select-none`}
      onMouseMove={handleMouseMove}
      style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.6))" }}
    >
      <defs>
        {/* Main body gradient */}
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="30%" stopColor="#2a2a2a" />
          <stop offset="70%" stopColor="#242424" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>

        {/* Platform gradient */}
        <linearGradient id="platformGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d3d3d" />
          <stop offset="40%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>

        {/* Dial face gradient */}
        <radialGradient id="dialGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#222222" />
          <stop offset="60%" stopColor="#141414" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>

        {/* Weight gradient */}
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#555555" />
          <stop offset="50%" stopColor="#333333" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>

        {/* Amber glow for pass state */}
        <radialGradient id="passGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(22,163,74,0.3)" />
          <stop offset="100%" stopColor="rgba(22,163,74,0)" />
        </radialGradient>

        {/* Column gradient */}
        <linearGradient id="columnGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#2d2d2d" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>

        <filter id="innerShadow">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="3" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* ── GROUND ── */}
      <rect
        x={cx - 100 * scale}
        y={baseY}
        width={200 * scale}
        height={4 * scale}
        fill="#1a1a1a"
        rx={2 * scale}
      />
      <rect
        x={cx - 80 * scale}
        y={baseY + 3 * scale}
        width={160 * scale}
        height={2 * scale}
        fill="#111111"
        rx={1 * scale}
      />

      {/* ── LEVELING FEET ── */}
      {[-60, 60].map((dx) => (
        <g key={dx}>
          <rect
            x={cx + dx * scale - 6 * scale}
            y={baseY - 6 * scale}
            width={12 * scale}
            height={8 * scale}
            fill="#222"
            rx={2 * scale}
          />
          <rect
            x={cx + dx * scale - 4 * scale}
            y={baseY - 2 * scale}
            width={8 * scale}
            height={4 * scale}
            fill="#333"
          />
        </g>
      ))}

      {/* ── MAIN COLUMN ── */}
      <rect
        x={cx - 12 * scale}
        y={baseY - bodyHeight}
        width={24 * scale}
        height={bodyHeight}
        fill="url(#columnGrad)"
        rx={2 * scale}
      />

      {/* ── MAIN BODY BOX ── */}
      <rect
        x={cx - bodyWidth / 2}
        y={baseY - bodyHeight}
        width={bodyWidth}
        height={bodyHeight}
        fill="url(#bodyGrad)"
        rx={4 * scale}
      />
      {/* Body top edge highlight */}
      <rect
        x={cx - bodyWidth / 2}
        y={baseY - bodyHeight}
        width={bodyWidth}
        height={2 * scale}
        fill="#3d3d3d"
        rx={2 * scale}
      />
      {/* Body border */}
      <rect
        x={cx - bodyWidth / 2}
        y={baseY - bodyHeight}
        width={bodyWidth}
        height={bodyHeight}
        fill="none"
        stroke="#2d2d2d"
        strokeWidth={1 * scale}
        rx={4 * scale}
      />

      {/* ── DIAL WINDOW ── */}
      <circle
        cx={cx}
        cy={dialCY}
        r={dialR + 6 * scale}
        fill="#0f0f0f"
        stroke="#2a2a2a"
        strokeWidth={1.5 * scale}
      />
      <circle
        cx={cx}
        cy={dialCY}
        r={dialR}
        fill="url(#dialGrad)"
        stroke="#333"
        strokeWidth={0.5 * scale}
      />

      {/* ── DIAL TICKS ── */}
      {ticks.map((i) => {
        const angle = -55 + (i / 20) * 110;
        const rad = (angle * Math.PI) / 180;
        const isMajor = i % 5 === 0;
        const outer = dialR - 2 * scale;
        const inner = outer - (isMajor ? 10 : 5) * scale;
        const x1 = cx + Math.sin(rad) * outer;
        const y1 = dialCY - Math.cos(rad) * outer;
        const x2 = cx + Math.sin(rad) * inner;
        const y2 = dialCY - Math.cos(rad) * inner;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isMajor ? "#888" : "#444"}
            strokeWidth={isMajor ? 1.5 * scale : 0.8 * scale}
          />
        );
      })}

      {/* ── DIAL ZONE COLORS ── */}
      {/* Red zone (high) */}
      <path
        d={(() => {
          const startAngle = 40;
          const endAngle = 55;
          const r = dialR - 4 * scale;
          const r2 = dialR - 14 * scale;
          const a1r = (startAngle * Math.PI) / 180;
          const a2r = (endAngle * Math.PI) / 180;
          const x1o = cx + Math.sin(a1r) * r; const y1o = dialCY - Math.cos(a1r) * r;
          const x2o = cx + Math.sin(a2r) * r; const y2o = dialCY - Math.cos(a2r) * r;
          const x1i = cx + Math.sin(a1r) * r2; const y1i = dialCY - Math.cos(a1r) * r2;
          const x2i = cx + Math.sin(a2r) * r2; const y2i = dialCY - Math.cos(a2r) * r2;
          return `M${x1o},${y1o} A${r},${r} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${r2},${r2} 0 0,0 ${x1i},${y1i} Z`;
        })()}
        fill="rgba(220,38,38,0.35)"
      />

      {/* Green zone (center) */}
      <path
        d={(() => {
          const startAngle = -8;
          const endAngle = 8;
          const r = dialR - 4 * scale;
          const r2 = dialR - 14 * scale;
          const a1r = (startAngle * Math.PI) / 180;
          const a2r = (endAngle * Math.PI) / 180;
          const x1o = cx + Math.sin(a1r) * r; const y1o = dialCY - Math.cos(a1r) * r;
          const x2o = cx + Math.sin(a2r) * r; const y2o = dialCY - Math.cos(a2r) * r;
          const x1i = cx + Math.sin(a1r) * r2; const y1i = dialCY - Math.cos(a1r) * r2;
          const x2i = cx + Math.sin(a2r) * r2; const y2i = dialCY - Math.cos(a2r) * r2;
          return `M${x1o},${y1o} A${r},${r} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${r2},${r2} 0 0,0 ${x1i},${y1i} Z`;
        })()}
        fill="rgba(22,163,74,0.25)"
      />

      {/* ── NEEDLE ── */}
      <line
        x1={cx} y1={dialCY}
        x2={needleX} y2={needleY}
        stroke="#d97706"
        strokeWidth={2.5 * scale}
        strokeLinecap="round"
      />
      {/* Needle pivot */}
      <circle cx={cx} cy={dialCY} r={5 * scale} fill="#1a1a1a" stroke="#d97706" strokeWidth={1.5 * scale} />
      <circle cx={cx} cy={dialCY} r={2 * scale} fill="#d97706" />

      {/* ── INDICATOR WINDOW ── */}
      <rect
        x={cx - 28 * scale}
        y={dialCY + dialR + 8 * scale}
        width={56 * scale}
        height={18 * scale}
        fill="#0a0a0a"
        stroke="#3a3a3a"
        strokeWidth={1 * scale}
        rx={2 * scale}
      />
      {indication !== null && (
        <text
          x={cx}
          y={dialCY + dialR + 20 * scale}
          textAnchor="middle"
          fill="#d97706"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={9 * scale}
          fontWeight="700"
        >
          {indication.toFixed(3)} {unit}
        </text>
      )}

      {/* ── BRAND LABEL ── */}
      <text
        x={cx}
        y={dialCY - dialR - 14 * scale}
        textAnchor="middle"
        fill="#444"
        fontFamily="'Inter', sans-serif"
        fontSize={7 * scale}
        letterSpacing={2}
      >
        METROVERIFY
      </text>

      {/* ── COLUMN SUPPORT ARMS ── */}
      {[-1, 1].map((side) => (
        <line
          key={side}
          x1={cx + side * 12 * scale}
          y1={baseY - bodyHeight}
          x2={cx + side * platformW / 2}
          y2={platformCenterY + platformH / 2}
          stroke="#2d2d2d"
          strokeWidth={3 * scale}
          strokeLinecap="round"
        />
      ))}

      {/* ── PLATFORM ── */}
      {/* Platform shadow */}
      <ellipse
        cx={cx}
        cy={platformCenterY + platformH / 2 + 4 * scale}
        rx={platformW / 2 - 4 * scale}
        ry={4 * scale}
        fill="rgba(0,0,0,0.4)"
      />
      {/* Platform body */}
      <rect
        x={cx - platformW / 2}
        y={platformCenterY - platformH / 2}
        width={platformW}
        height={platformH}
        fill="url(#platformGrad)"
        rx={3 * scale}
      />
      {/* Platform top surface */}
      <rect
        x={cx - platformW / 2 + 2 * scale}
        y={platformCenterY - platformH / 2}
        width={platformW - 4 * scale}
        height={3 * scale}
        fill="#484848"
        rx={2 * scale}
      />
      {/* Platform edge lines */}
      {[-1, 0, 1].map((i) => (
        <line
          key={i}
          x1={cx + i * 60 * scale}
          y1={platformCenterY - platformH / 2}
          x2={cx + i * 60 * scale}
          y2={platformCenterY + platformH / 2}
          stroke="#333"
          strokeWidth={0.5 * scale}
        />
      ))}
      {/* Platform border */}
      <rect
        x={cx - platformW / 2}
        y={platformCenterY - platformH / 2}
        width={platformW}
        height={platformH}
        fill="none"
        stroke="#333"
        strokeWidth={1 * scale}
        rx={3 * scale}
      />

      {/* ── STANDARD WEIGHT ── */}
      {hasWeight && (
        <g>
          {/* Weight shadow */}
          <ellipse
            cx={cx}
            cy={platformCenterY - platformH / 2 + 2 * scale}
            rx={28 * scale}
            ry={6 * scale}
            fill="rgba(0,0,0,0.5)"
          />
          {/* Weight body */}
          <rect
            x={cx - 24 * scale}
            y={platformCenterY - platformH / 2 - 44 * scale}
            width={48 * scale}
            height={44 * scale}
            fill="url(#weightGrad)"
            rx={3 * scale}
          />
          {/* Weight top */}
          <rect
            x={cx - 24 * scale}
            y={platformCenterY - platformH / 2 - 44 * scale}
            width={48 * scale}
            height={6 * scale}
            fill="#555"
            rx={3 * scale}
          />
          {/* Weight handle */}
          <rect
            x={cx - 8 * scale}
            y={platformCenterY - platformH / 2 - 56 * scale}
            width={16 * scale}
            height={14 * scale}
            fill="#3d3d3d"
            rx={3 * scale}
          />
          {/* Weight label */}
          <text
            x={cx}
            y={platformCenterY - platformH / 2 - 18 * scale}
            textAnchor="middle"
            fill="#888"
            fontFamily="'JetBrains Mono', monospace"
            fontSize={9 * scale}
            fontWeight="600"
          >
            {weightLabel}
          </text>
          {/* M stamp */}
          <text
            x={cx}
            y={platformCenterY - platformH / 2 - 30 * scale}
            textAnchor="middle"
            fill="#666"
            fontFamily="'Playfair Display', serif"
            fontSize={11 * scale}
            fontStyle="italic"
          >
            M
          </text>
        </g>
      )}

      {/* ── LEVEL BUBBLE ── */}
      <circle
        cx={cx - bodyWidth / 2 + 16 * scale}
        cy={baseY - 18 * scale}
        r={7 * scale}
        fill="#0a0a0a"
        stroke="#333"
        strokeWidth={1 * scale}
      />
      <circle
        cx={cx - bodyWidth / 2 + 16 * scale}
        cy={baseY - 18 * scale}
        r={2.5 * scale}
        fill="#16a34a"
        opacity={0.8}
      />
      {/* Level label */}
      <text
        x={cx - bodyWidth / 2 + 28 * scale}
        y={baseY - 15 * scale}
        fill="#444"
        fontFamily="'Inter', sans-serif"
        fontSize={6 * scale}
      >
        LEVEL
      </text>
    </svg>
  );
};
