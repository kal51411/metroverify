import { Layout } from '../components/layout/Layout'
import {
  Code2,
  Shield,
  Server,
  Layers,
  FileCheck2,
  Lock,
  Smartphone,
  Cpu,
  CheckCircle2,
  ExternalLink,
  BookOpen
} from 'lucide-react'

export default function ArchitectureView() {
  return (
    <Layout
      role="officer"
      title="System Technical Documentation &amp; Security Framework"
      subtitle="Compliance with Legal Metrology Act, 2009 &amp; General Rules, 2011"
    >
      <div className="max-w-4xl space-y-8">
        {/* Executive Summary Card */}
        <div className="card p-6 border-l-4 border-l-brand-600 bg-gradient-to-r from-brand-50/40 to-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-600 text-white rounded-xl shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Legal Metrology Digital Governance Framework
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                MetroVerify is an enterprise digital verification and lifecycle management architecture designed specifically to replace fragmented physical stamping and manual record-keeping with a secure, centralized, multi-stakeholder ecosystem under the <strong>Legal Metrology Act, 2009</strong> and the <strong>Legal Metrology (General) Rules, 2011</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Software Architecture */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            1. Software Architecture &amp; Component Layering
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Presentation Layer</span>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>React 18 Single-Page Architecture</li>
                <li>Vite high-speed bundle optimizer</li>
                <li>Tailwind CSS design system</li>
                <li>Mobile-responsive Field Mode</li>
                <li>Dynamic QR Code Renderers</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Application &amp; API Layer</span>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>FastAPI (ASGI async framework)</li>
                <li>Deterministic Error Calculation Engine</li>
                <li>ReportLab PDF Digital Stamp Engine</li>
                <li>Pydantic Schema Validation</li>
                <li>RESTful endpoints with CORS guards</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Persistence &amp; Storage</span>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>SQLAlchemy ORM Data Abstraction</li>
                <li>Relational database (SQLite/PostgreSQL)</li>
                <li>Serverless ephemeral fallback (/tmp)</li>
                <li>Encrypted local &amp; S3 document store</li>
                <li>Centralized audit log tables</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono">
            <code>
              [Trader/Business] ──► [Central API Gateway] ◄── [State LMOs &amp; GATCs]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br />
              [Rule-Based Tolerance Engine (MPE)] ──► [QR Signed Certificate] ──► [Public Registry]
            </code>
          </div>
        </div>

        {/* Section 2: Security & Tamper-Proof Framework */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            2. Security Framework &amp; Anti-Tamper Measures
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                Cryptographic QR Tokens
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Every digital certificate embeds a unique UUID-based cryptographic verification token. Public scanning directs directly to the state authority's authoritative URL (`/verify/:certificateId`), preventing counterfeit certificates.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                Lead Seal Stamping Correlation
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Digital records bridge the physical and virtual verification gap by recording the physical lead stamping seal number (e.g. <code>MH-26-SEAL-XXXX</code>) and GPS geotagging upon field completion.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                Deterministic Non-LLM Calculation
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Pass/Fail decisions are computed purely using deterministic arithmetic rules: <code>((Observed - Standard) / Standard) * 100 &lt;= Tolerance</code>, guaranteeing mathematical precision required for statutory compliance.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                Field Evidence Geotagging
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Supports integration with field mobile devices for capturing real-time device photographs, lead seal placement, and geolocation logging during spot verification audits.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Statutory Workflow & GATC Delegation */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-violet-600" />
            3. Statutory Workflow under Rule 27 &amp; Section 24 (GATCs)
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">Dual Stamping Channels: State LMOs &amp; Notified GATCs</span>
              Under Section 24 of the Legal Metrology Act, government-notified testing laboratories (GATCs) can test, calibrate, and verify designated classes of instruments, distributing workload away from overburdened state inspectors.
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">Automated Re-verification Lifecycles (Rule 27)</span>
              Weights, measures, and electronic scales expire annually or biennially. MetroVerify automatically classifies instruments into <strong>Active (&gt;90 days)</strong>, <strong>Expiring Soon (30-90 days)</strong>, <strong>Expiring (&lt;30 days)</strong>, and <strong>Overdue Expired</strong>, issuing 1-click renewal applications.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
