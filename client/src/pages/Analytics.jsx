import React from 'react';
import { BarChart3, TrendingUp, PieChart, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#2b312e] pb-4">
        <h1 className="text-xl font-medium tracking-tight text-[#f4f3ee]">Operational Analytics &amp; QA Metrics</h1>
        <p className="text-xs text-[#969e99] mt-1">Telemetry on report intake volume, defect distributions, and prompt injection attempts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#161a18] border border-[#2b312e]">
          <span className="text-[10px] text-[#78827c] uppercase font-semibold">Triage Accuracy Target</span>
          <div className="text-2xl font-bold text-[#8fd1a8] mt-2">100%</div>
          <p className="text-[11px] text-[#626965] mt-1">Strict taxonomy validation</p>
        </div>
        <div className="p-4 rounded-lg bg-[#161a18] border border-[#2b312e]">
          <span className="text-[10px] text-[#78827c] uppercase font-semibold">Flagged Injections</span>
          <div className="text-2xl font-bold text-[#e07167] mt-2">1 / 44</div>
          <p className="text-[11px] text-[#626965] mt-1">2.27% Adversarial attack rate</p>
        </div>
        <div className="p-4 rounded-lg bg-[#161a18] border border-[#2b312e]">
          <span className="text-[10px] text-[#78827c] uppercase font-semibold">Multi-Report Questions</span>
          <div className="text-2xl font-bold text-[#e0c082] mt-2">4 Questions</div>
          <p className="text-[11px] text-[#626965] mt-1">High-velocity student complaints</p>
        </div>
      </div>
    </div>
  );
}

