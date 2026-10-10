# MetroVerify v3 - Implementation Plan & Milestone Tracker

## Status: ACTIVE ON BRANCH `v3`

### Milestones & Deliverables

#### Milestone 1: Discovery & Specification (Completed)
- [x] Repository audit and backwards-compatibility verification.
- [x] Problem statement defined in `PROBLEM_STATEMENT.md`.
- [x] Architectural specification in `ARCHITECTURE.md`.
- [x] Creation of implementation tracker `V3_IMPLEMENTATION_PLAN.md`.

#### Milestone 2: Backend Core (In Progress)
- [ ] Dependencies updated in `requirements.txt` (JWT, bcrypt, websockets, Pillow, pytesseract).
- [ ] Database models and schemas (`app/models/` and `app/schemas/`).
- [ ] JWT authentication with refresh tokens and RBAC middleware (`app/services/v3_auth_service.py`).
- [ ] Statutory MPE calculation service (`app/services/v3_mpe_service.py`).
- [ ] AI vision & plate OCR parsing service (`app/services/v3_ocr_service.py`).
- [ ] WebSocket IoT telemetry streaming service (`app/services/v3_telemetry_service.py`).
- [ ] v3 API routers (`app/routers/v3_auth.py`, `app/routers/v3_ai.py`, `app/routers/v3_telemetry.py`, `app/routers/v3_inspections.py`).
- [ ] Integration of v3 routers into `app/main.py`.

#### Milestone 3: Comprehensive Testing (`tests/v3/`)
- [ ] Test JWT authentication and RBAC permissions.
- [ ] Test statutory MPE calculation engine edge cases.
- [ ] Test OCR parsing logic and fallback routines.
- [ ] Test WebSocket telemetry streams and broadcast protocol.

#### Milestone 4: Frontend v3 Architecture ("Bluma-Level")
- [ ] Tailwind CSS v4 styling & dark theme palette (`#0A0A0B`, `#111113`, Inter font).
- [ ] Navigation bar with animated layout pill (`NavbarV3.tsx`).
- [ ] Hero section with word-by-word stagger entrance (`HeroV3.tsx`).
- [ ] Real-time IoT Weighbridge Telemetry Dashboard (`TelemetryDashboard.tsx`).
- [ ] AI Vision Stamping Plate OCR Assistant (`AIInspectionAssistant.tsx`).
- [ ] Geo-tagged Field Inspection Execution Modal (`GeoInspectionModal.tsx`).
- [ ] Interactive Legal Metrology AI Copilot (`MetrologyCopilot.tsx`).

#### Milestone 5: Integration, Verification & Preview
- [ ] Integration into `frontend/src/App.tsx`.
- [ ] Production build verification (`tsc && vite build`).
- [ ] Verification of test suite.
- [ ] Verification that `Main` and `metroverify-v2` branches remain completely untouched.
- [ ] Start backend and frontend preview servers.
