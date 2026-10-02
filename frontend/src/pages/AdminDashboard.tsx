import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { Database, ShieldCheck, MapPin, Scale, Plus, CheckCircle2, Clock, Calendar } from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const [standards, setStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"STANDARDS" | "JURISDICTIONS" | "FEES" | "INTERVALS">("STANDARDS");

  const loadData = async () => {
    try {
      setLoading(true);
      const stds = await api.getStandards();
      setStandards(stds);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Supervisor & Standards Reference Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Traceable Working Standards (NPL/RRSL), Maharashtra Jurisdiction Tables, and Statutory Rulesets.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === "STANDARDS" ? "bg-blue-600 text-white" : "text-slate-400"}`}
          >
            Traceable Standards
          </button>
          <button
            onClick={() => setActiveTab("JURISDICTIONS")}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === "JURISDICTIONS" ? "bg-blue-600 text-white" : "text-slate-400"}`}
          >
            State Jurisdictions
          </button>
          <button
            onClick={() => setActiveTab("FEES")}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === "FEES" ? "bg-blue-600 text-white" : "text-slate-400"}`}
          >
            Fee Schedule (2018)
          </button>
          <button
            onClick={() => setActiveTab("INTERVALS")}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === "INTERVALS" ? "bg-blue-600 text-white" : "text-slate-400"}`}
          >
            Verification Intervals
          </button>
        </div>
      </div>

      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Traceable Working Standards Inventory (NPL / RRSL Calibration)
            </h3>
            <span className="text-xs text-slate-400">{standards.length} Standard Assets Registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Asset ID / Tag</th>
                  <th className="p-3">Mass & Class</th>
                  <th className="p-3">Calibration Cert #</th>
                  <th className="p-3">Calibrating Lab</th>
                  <th className="p-3">Traceability Hierarchy</th>
                  <th className="p-3">Valid Until</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {standards.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-bold text-blue-400">{s.standard_asset_id}</div>
                      <div className="text-[11px] text-slate-500 font-sans">{s.asset_tag}</div>
                    </td>
                    <td className="p-3 text-slate-200">
                      <b>{s.nominal_mass} {s.unit}</b> ({s.accuracy_class})
                    </td>
                    <td className="p-3 text-slate-300">{s.certificate_number}</td>
                    <td className="p-3 font-sans text-slate-400">{s.laboratory}</td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold">
                        {s.hierarchy_level}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      {new Date(s.valid_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "JURISDICTIONS" && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Maharashtra State Territorial Legal Metrology Jurisdiction Table
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { code: "MH-MUM-01", division: "Mumbai", district: "Mumbai City", office: "Assistant Controller Legal Metrology, Mumbai South" },
              { code: "MH-MUM-02", division: "Mumbai", district: "Mumbai Suburban", office: "Assistant Controller Legal Metrology, Mumbai North" },
              { code: "MH-PUN-01", division: "Pune", district: "Pune", office: "Assistant Controller Legal Metrology, Pune Central" },
              { code: "MH-PUN-02", division: "Pune", district: "Solapur", office: "Inspector Legal Metrology, Solapur" },
              { code: "MH-THN-01", division: "Konkan", district: "Thane", office: "Assistant Controller Legal Metrology, Thane" },
              { code: "MH-NAS-01", division: "Nashik", district: "Nashik", office: "Assistant Controller Legal Metrology, Nashik" },
              { code: "MH-AUR-01", division: "Aurangabad", district: "Chhatrapati Sambhajinagar", office: "Assistant Controller Legal Metrology, Sambhajinagar" },
              { code: "MH-NAG-01", division: "Nagpur", district: "Nagpur", office: "Assistant Controller Legal Metrology, Nagpur East" },
            ].map((j, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-400 block">{j.code}</span>
                  <span className="font-semibold text-slate-200">{j.office}</span>
                  <span className="text-[11px] text-slate-400 block">{j.district} District | {j.division} Division</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  VALIDATED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "FEES" && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Maharashtra Statutory Fee Schedule (Notification 20-04-2018)
            </h3>
            <p className="text-xs text-slate-400">Statutory fees payable via Maharashtra GRAS System</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <b className="text-slate-200 block">Class III Non-Automatic Scale (0-50 kg)</b>
                <span className="text-slate-400 text-[11px]">Base Fee: INR 100.0 | Premises extra: INR 100.0</span>
              </div>
              <span className="font-mono font-bold text-blue-400">INR 100 - 200</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <b className="text-slate-200 block">Class III Platform Scale (50-200 kg)</b>
                <span className="text-slate-400 text-[11px]">Base Fee: INR 200.0 | Premises extra: INR 150.0</span>
              </div>
              <span className="font-mono font-bold text-blue-400">INR 200 - 350</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <b className="text-slate-200 block">Heavy Weighbridge (5,000-100,000 kg)</b>
                <span className="text-slate-400 text-[11px]">Base Fee: INR 3000.0 | Premises extra: INR 2000.0</span>
              </div>
              <span className="font-mono font-bold text-blue-400">INR 3000 - 5000</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "INTERVALS" && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Statutory Verification Interval Rules (Rule 27 & Amendments)
          </h3>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <b className="text-slate-200 block">Commercial Weighing Instruments & Weighbridges</b>
                <span className="text-slate-400 text-[11px]">Rule 27(1)(b) Legal Metrology (General) Rules, 2011</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">12 Months (1 Year)</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
              <div>
                <b className="text-slate-200 block">Weights, Capacity Measures & Fuel Dispensers</b>
                <span className="text-slate-400 text-[11px]">Legal Metrology (General) Seventh Amendment Rules, 2025 (Rule 27(2)(a))</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">24 Months (2 Years)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
