# MetroVerify ⚖️

**Digital Verification & Compliance System for Weighing and Measuring Instruments**  
*Built for Legal Metrology Department Hackathon Demo*

MetroVerify digitizes the entire Legal Metrology verification lifecycle for commercial weighing and measuring devices — from instrument registration and officer document review to deterministic calibration error calculation, QR code certificate generation, and public zero-auth verification.

---

## 🚀 Key Features

1. **3 Demo Roles**:
   - **Business Owner**: Register instruments, submit applications, view verification timelines, download certificates.
   - **Legal Metrology Officer**: Review applications, AI document extraction assistant, schedule inspections, perform digital calibrations.
   - **Public Verification**: Zero-auth certificate authenticity lookup by ID or QR scan with tamper indicators.
2. **Deterministic Error Calculation**:
   - Automated real-time error percentage calculations against configurable legal metrology limits (e.g. `±0.50%`).
   - Rule-based `PASS` / `FAIL` determination.
3. **Tamper-Proof Certificates**:
   - Dynamic QR codes pointing to public verification endpoint.
   - Professional PDF certificate download generated with ReportLab.
4. **Pre-Seeded Demo Data**:
   - Comes out-of-the-box with 5 instruments, 8 applications, 3 verified certificates, 1 failed, and 2 expiring soon.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Python 3, FastAPI, SQLAlchemy, SQLite
- **Libraries**: ReportLab (PDF), QRCode (PIL), Axios

---

## 📦 Local Development

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

---

## ☁️ Deployment on Vercel

1. Import this repository into **[Vercel](https://vercel.com/new)**.
2. Vercel automatically detects the configuration via `vercel.json`:
   - Frontend is built from `frontend/`
   - Backend runs as serverless Python functions from `api/index.py`
3. Click **Deploy**!
