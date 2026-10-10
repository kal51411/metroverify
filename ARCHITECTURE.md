# MetroVerify v3: System Architecture & Technical Specification

## 1. Architectural Overview
MetroVerify v3 is an asynchronous, high-throughput Legal Metrology Verification and IoT Monitoring Platform.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MetroVerify v3 Architecture                     │
└────────────────────────────────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────────────────────┐
     │           Vite + React 18 + TS Frontend (src/v3/)            │
     │  Obsidian Dark (#0A0A0B) · Framer Motion · Zero-UI Libs      │
     └──────────────┬───────────────────────────────┬───────────────┘
                    │ REST API (JSON)               │ WebSockets (WS)
                    ▼                               ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                    FastAPI Backend (app/)                    │
     │  ┌───────────────────────┐      ┌─────────────────────────┐  │
     │  │   Auth / RBAC Router  │      │  Telemetry WS Manager   │  │
     │  │   (JWT + Refresh)     │      │  (Live Drift & Jitter)  │  │
     │  └───────────┬───────────┘      └────────────┬────────────┘  │
     │              │                               │               │
     │  ┌───────────▼───────────┐      ┌────────────▼────────────┐  │
     │  │   AI & Vision OCR     │      │   MPE Rule Calculator   │  │
     │  │   (Tesseract/Pillow)  │      │   (Legal Rules 2011)    │  │
     │  └───────────┬───────────┘      └────────────┬────────────┘  │
     │              │                               │               │
     │  ┌───────────▼───────────────────────────────▼────────────┐  │
     │  │               Cryptographic Audit Ledger               │  │
     │  │               SHA-256 Hash Chain Generator             │  │
     │  └───────────────────────────┬────────────────────────────┘  │
     └──────────────────────────────┼───────────────────────────────┘
                                    │ SQLAlchemy 2.0 ORM
                                    ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                Database Engine (SQLite / Postgres)           │
     │  Users · Instruments · Applications · Inspections · Certs   │
     └──────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (v3 Data Models)

### `users` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | INTEGER | Primary Key, Auto-increment |
| `username` | VARCHAR(100) | Unique, Index, Not Null |
| `email` | VARCHAR(255) | Unique, Index, Not Null |
| `full_name` | VARCHAR(255) | Not Null |
| `hashed_password` | VARCHAR(255) | Scrypt/Bcrypt salted hash |
| `role` | ENUM | `APPLICANT`, `INSPECTOR`, `ADMIN` |
| `designation` | VARCHAR(150) | Nullable |
| `department` | VARCHAR(150) | Nullable |
| `is_active` | BOOLEAN | Default True |
| `created_at` | DATETIME | Timezone-aware UTC timestamp |

### `v3_telemetry_logs` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | INTEGER | Primary Key, Auto-increment |
| `instrument_id` | VARCHAR(64) | Foreign Key / Ref, Index, Not Null |
| `timestamp` | DATETIME | UTC Timestamp, Index |
| `gross_weight` | FLOAT | Computed Total Weight (kg) |
| `cell_1_weight` | FLOAT | Corner 1 Load (kg) |
| `cell_2_weight` | FLOAT | Corner 2 Load (kg) |
| `cell_3_weight` | FLOAT | Corner 3 Load (kg) |
| `cell_4_weight` | FLOAT | Corner 4 Load (kg) |
| `zero_drift` | FLOAT | Drift from calibrated zero ($kg$) |
| `corner_imbalance`| FLOAT | Maximum corner load delta ($kg$) |
| `status` | VARCHAR(20) | `NORMAL`, `WARNING`, `CRITICAL` |

### `v3_inspections` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | INTEGER | Primary Key |
| `inspection_id` | VARCHAR(64) | Unique, Index (e.g., `LM-INS-2026-X`) |
| `application_id` | INTEGER | Foreign Key to applications |
| `inspector_id` | INTEGER | Foreign Key to users |
| `geo_latitude` | FLOAT | Inspection GPS Latitude |
| `geo_longitude` | FLOAT | Inspection GPS Longitude |
| `inspection_address` | TEXT | Physical verified address |
| `visual_inspection_status`| VARCHAR(20) | `PASS`, `FAIL` |
| `stamping_plate_ocr_json` | TEXT | Extracted plate metadata |
| `max_error_observed` | FLOAT | Max error recorded during load tests |
| `mpe_allowance` | FLOAT | Applicable legal MPE |
| `result` | VARCHAR(10) | `PASS`, `FAIL` |
| `audit_hash` | VARCHAR(64) | SHA-256 integrity hash |
| `created_at` | DATETIME | UTC Timestamp |

---

## 3. API Contracts (v3 Endpoints)

### A. Authentication & RBAC (`/api/v3/auth`)
* `POST /api/v3/auth/register` $\to$ Registers user with role assignment and hashed password.
* `POST /api/v3/auth/login` $\to$ Returns standard `access_token` (JWT), `refresh_token`, and user payload.
* `POST /api/v3/auth/refresh` $\to$ Refreshes expired access tokens.
* `GET  /api/v3/auth/me` $\to$ Returns authenticated user profile, validated via Bearer token.

### B. Core Metrology & MPE Engine (`/api/v3/metrology`)
* `POST /api/v3/metrology/mpe/calculate`
  * Input: `{ load: float, e: float, accuracy_class: str, verification_mode: "INITIAL" | "IN_SERVICE" }`
  * Output: `{ mpe_value: float, mpe_factor_in_e: float, band: str, compliant: bool }`
* `POST /api/v3/metrology/high-capacity/substitution`
  * Input: `{ max_capacity: float, e: float, r1: float, r2: float, r3: float }`
  * Output: `{ std_dev: float, allowed_substitution_percentage: float, passes_substitution_test: bool }`

### C. AI Vision & Plate OCR (`/api/v3/ai`)
* `POST /api/v3/ai/ocr-parse`
  * Input: Multipart Image File (Weighing instrument nameplate or calibration slip)
  * Output: `{ serial_number: str, max_capacity: float, e: float, model: str, raw_text: str, confidence: float }`
* `POST /api/v3/ai/copilot`
  * Input: `{ query: str, context: Optional[dict] }`
  * Output: `{ answer: str, legal_clauses: list[str], statutory_reference: str }`

### D. WebSocket Real-Time Telemetry (`/api/v3/telemetry`)
* `GET /api/v3/telemetry/stats/{instrument_id}` $\to$ Historical summary of zero drift and stability.
* `WS  /api/v3/telemetry/ws/{instrument_id}` $\to$ Continuous duplex stream delivering load-cell states at 2 Hz.

---

## 4. WebSocket Telemetry Protocol

```
Client (Browser)                                    Server (FastAPI)
      │                                                     │
      ├─── WS Connect /api/v3/telemetry/ws/WB-101 ─────────►│
      │◄── 101 Switching Protocols ─────────────────────────┤
      │                                                     │
      │◄── Telemetry Packet { cells: [4], gross, drift } ───┤ (Every 500ms)
      │◄── Telemetry Packet { cells: [4], gross, drift } ───┤
      │                                                     │
      ├─── Send Command { action: "TARE" | "CALIBRATE" } ──►│
      │◄── Command Ack { status: "OK", new_zero: 0.0 } ─────┤
```

---

## 5. Frontend Architecture & Component Hierarchy

### Design System Constants
* **Background:** `#0A0A0B`
* **Surfaces:** `#111113`, Cards `#18181B` with `1px border border-white/[0.08]`
* **Typography:** Inter, tracking `-0.03em`, headings leading `1.05`, weights $\le 600$.
* **Motion:** Framer Motion with `cubic-bezier(0.16, 1, 0.3, 1)`.

### Component Tree (`frontend/src/v3/`)
```
App.tsx
 └── v3/AppV3.tsx
      ├── v3/components/NavbarV3.tsx (Frosted Glass, sliding active tab pill, live pulse indicator)
      ├── Main Viewport (AnimatePresence)
      │    ├── v3/pages/HeroV3.tsx (Word-by-word reveal, real-time stats, animated SVG scale)
      │    ├── v3/pages/TelemetryDashboard.tsx (4-cell interactive weighbridge canvas, real-time drift chart)
      │    ├── v3/pages/AIInspectionAssistant.tsx (Drop zone, animated laser scan beam, extracted card grid)
      │    ├── v3/pages/GeoInspectionModal.tsx (GPS acquisition radar, haptic pass/fail toggles)
      │    └── v3/components/MetrologyCopilot.tsx (Floating AI drawer, typing effect, statutory rule chips)
      └── v3/components/FooterV3.tsx
```
