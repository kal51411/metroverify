import React from "react";
import { Scale, ShieldCheck } from "lucide-react";

export function FooterV3() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#111113] py-16 px-6 lg:px-12 mt-28">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm text-[#FAFAFA] tracking-tight">
              MetroVerify v3 Enterprise
            </div>
            <div className="text-xs text-zinc-500 font-mono mt-0.5">
              Government of India · Statutory Metrology Verification Engine
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end text-xs font-mono text-zinc-500 leading-relaxed space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Legal Metrology Act, 2009 & General Rules, 2011 (Amended 2026)</span>
          </div>
          <div className="text-zinc-600">
            Smart India Hackathon (SIH) · SHA-256 Tamper-Evident Verification Ledger
          </div>
        </div>
      </div>
    </footer>
  );
}
