# MetroVerify: Technical Architecture, Security Framework & Deployment Methodology

## 1. Statutory Context & Legal Framework
MetroVerify is an enterprise digital verification and lifecycle management platform engineered for India's Legal Metrology ecosystem under:
* **The Legal Metrology Act, 2009 (Act No. 1 of 2010)**: Section 14 (Government Approved Test Centres), Section 24 (Verification and stamping of weights and measures).
* **The Legal Metrology (General) Rules, 2011 (Amended 2024–2026)**:
  * Schedule VII: Specification and testing tolerances for Non-Automatic Weighing Instruments (NAWI Classes I, II, III, IIII).
  * Rule 27: Periodic verification intervals and advance notices for premises inspections.
  * Weighbridge Test Weight Substitution: Repeatability ($\sigma$) enforcement at $\frac{1}{2} Max$ or $\frac{1}{5} Max$.

---

## 2. Software Architecture

### A. System Architecture Diagram
```
                       +----------------------------------+
                       |   MetroVerify Citizen & Reg. UI  |
                       |    (React 18 + Tailwind + Vite)  |
                       +-----------------+----------------+
                                         |
                       +-----------------v----------------+
                       |    FastAPI Modular API Gateway   |
                       |   (OAuth2 JWT + REST + WebSockets|
                       +--------+---------------+---------+
                                |               |
             +------------------+               +------------------+
             |                                                     |
+------------v------------+                               +--------v---------------+
|  Statutory Rule Engine  |                               | Centralized Repository |
|  - Piecewise MPE Limits |                               |  - QR Code Engine      |
|  - Repeatability (σ)    |                               |  - PDF Generation      |
|  - Fee Schedules        |                               |  - Spotlight Search    |
+------------+------------+                               +--------+---------------+
             |                                                     |
+------------v-----------------------------------------------------v---------------+
|                    Cryptographic Tamper-Evident Ledger                           |
|                    - SHA-256 Block-chained Audit Trail                           |
|                    - SQLite / PostgreSQL ACID Data Store                         |
+----------------------------------------------------------------------------------+
```

### B. Core Functional Modules
1. **Unified Command Hub (`UnifiedCommandHub.tsx`)**:
   - Zero-clutter, role-adaptive workspace dynamically configuring tools for:
     - **Commercial Traders / Users**: Scale registry, validity radar, 1-click renewal.
     - **State Legal Metrology Officers (LMOs)**: Scheduled queue, field inspection suite, digital stamping.
     - **Government Approved Test Centres (GATCs)**: Accredited test request processing, working standard traceability.
     - **State Enforcement Administrators**: State-wide pendency, allocation dispatcher, fee reconciliation.
2. **Statutory Validity Radar & 1-Click Renewal (`AlertService`)**:
   - Scans instrument due dates against Legal Metrology Rule 27.
   - Categorizes expiry risk into 60-day (INFO), 30-day (WARNING), 15-day (CRITICAL), and EXPIRED.
   - 1-Click Renewal automatically generates pre-filled `RE_VERIFICATION` applications and submits them for scheduling.
3. **Field Verification Mobile Suite with Live MPE Gauge**:
   - Computes statutory Maximum Permissible Error ($0.5e, 1.0e, 1.5e$) dynamically as test loads are keyed in.
   - Locks GPS geo-coordinates and records digital lead seal numbers.
4. **Universal Centralized Ledger & Public QR Verification (`UniversalLedgerSearch.tsx`, `verify.py`)**:
   - Zero-trust public lookup via QR scan or search bar.
   - Re-computes SHA-256 certificate hashes on the fly to detect any database or paper tampering.

---

## 3. Security Framework

### A. Authentication & Role-Based Access Control (RBAC)
* **JWT Tokens**: Signed using HMAC-SHA256 with configurable expiry (`ACCESS_TOKEN_EXPIRE_MINUTES`).
* **Roles**:
  * `APPLICANT`: Commercial trader/owner of weights and measures.
  * `LMO`: State Legal Metrology Officer authorized to inspect, verify, and stamp instruments.
  * `GATC`: Government Approved Test Centre notified under Section 14.
  * `ADMIN`: Controller / Assistant Controller with state-wide oversight and allocation powers.
* **Password Hashing**: Dual-layer verification supporting `sha256_crypt` and salted SHA-256.

### B. Cryptographic Integrity & Tamper-Evident Audit Ledger
* Every verification event, inspection observation, seal assignment, and certificate issuance generates a deterministic SHA-256 block hash:
  $$\text{Hash}_n = \text{SHA256}(\text{EventID} \,\|\, \text{Timestamp} \,\|\, \text{Payload} \,\|\, \text{Hash}_{n-1})$$
* Any retroactive manipulation of certificates or inspections breaks the ledger hash chain, immediately flagged by `/api/audit/verify-chain`.

---

## 4. Deployment Methodology

### A. Local Development & Testing
1. **Clone & Set Up Environment**:
   ```bash
   git clone <repo-url>
   cd metroverify
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Run Pytest Test Suite**:
   ```bash
   python3 -m pytest tests/ -v
   ```
3. **Start Backend**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### B. Production Containerized Deployment (Docker)
1. **Dockerfile (Backend)**:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 8000
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
   ```
2. **Production Reverse Proxy (Nginx)**:
   ```nginx
   server {
       listen 80;
       server_name metroverify.gov.in;

       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location / {
           root /home/kalpesh/metroverify/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```
