# METROVERIFY V2 — DESIGN SYSTEM

## Creative Direction

MetroVerify is a premium digital infrastructure platform for legal-metrology inspection, certification, and audit.
Visual language: industrial instrumentation, precision calibration, technical engineering drawings, editorial technology.

Emotional target: PRECISION · AUTHORITY · CALM · TRUST · INTELLIGENCE

---

## Color System

| Token          | Hex       | Usage                              |
|----------------|-----------|------------------------------------|
| metro-bg       | #080c14   | Page background                    |
| metro-surface  | #0f172a   | Primary surface                    |
| metro-panel    | #131c2e   | Panel / sidebar                    |
| metro-border   | #1e293b   | Standard borders                   |
| metro-accent   | #2563eb   | Primary action, active states      |
| metro-pass     | #10b981   | PASS, valid, certified             |
| metro-fail     | #ef4444   | FAIL, error, invalid               |
| metro-amber    | #f59e0b   | Warning, DEMO mode, scheduled      |

Rule: Status colors are never decorative. Always pair with text label AND icon.

---

## Typography

| Role      | Family        | Usage                                        |
|-----------|---------------|----------------------------------------------|
| Display   | Space Grotesk | H1–H3, large numerals, editorial headings    |
| UI        | Inter         | Body, labels, descriptions, table content    |
| Monospace | JetBrains Mono| IDs, measurements, hashes, timestamps        |

Large numbers (measurement values, stat counts) → font-display font-extrabold. Never wrap in generic stat cards.

---

## Layout Principles

- Variable container widths (full-width hero, max-w-[1400px] operational, max-w-2xl certificate, max-w-xl verify)
- Asymmetric grid splits: 70/30, 75/25, alternating section rhythm
- 3-zone inspection layout: [Left: step rail] [Center: measurement input] [Right: instrument context]
- Border-only separation preferred over card containers

---

## Component Rules

Buttons:
- font-mono font-bold tracking-wider
- No border-radius on primary buttons (sharp corners = precision)
- Color change on hover, not scale transform

Inputs:
- Border color changes on focus (no box-shadow/ring)
- bg-[#05080e] border border-slate-800 focus:border-blue-600

Tables:
- font-mono text-[10px] tracking-widest uppercase headers
- Thin bottom borders only, no zebra striping, no border-radius

Status badges:
- Text-only by default
- PASS/VALID = emerald-400, FAIL = rose-400, PENDING = amber-400

---

## Empty States

Always:
1. Large descriptive heading (font-display)
2. One line of explanation (font-mono text-xs text-slate-600)

Example:
  NO ACTIVE INSPECTIONS
  Your assigned inspection queue is currently empty for this filter.

---

## What Not To Do

- No gradient blob backgrounds
- No glassmorphism
- No rounded rectangles around every statistic
- No fake metrics or AI marketing copy
- No fake government seals
- No pre-filled demo values masquerading as real measurements
- No identical layout for every section
