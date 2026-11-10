import React from 'react';
import { Settings as SettingsIcon, Sliders, Shield, Database } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#2b312e] pb-4">
        <h1 className="text-xl font-medium tracking-tight text-[#f4f3ee]">Console Settings &amp; Engine Configuration</h1>
        <p className="text-xs text-[#969e99] mt-1">Review operational thresholds, taxonomy enforcement flags, and model endpoint settings.</p>
      </div>

      <div className="max-w-2xl space-y-4 text-xs">
        <div className="p-4 rounded-lg bg-[#161a18] border border-[#2b312e] space-y-3">
          <div className="flex items-center gap-2 font-semibold text-[#f4f3ee]">
            <Sliders className="w-4 h-4 text-[#6ba883]" />
            <span>AI Triage Parameters</span>
          </div>
          <div className="text-[#969e99] space-y-2">
            <div className="flex justify-between py-1 border-b border-[#212623]">
              <span>Model ID</span>
              <span className="font-mono text-[#f4f3ee]">deepseek-ai/deepseek-v4.1-flash</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#212623]">
              <span>Host Provider</span>
              <span className="font-mono text-[#f4f3ee]">NVIDIA NIM Hosted Inference</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Auto-Apply Threshold</span>
              <span className="font-mono text-[#8fd1a8]">0.90 Confidence + Taxonomy auto:true</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#161a18] border border-[#2b312e] space-y-3">
          <div className="flex items-center gap-2 font-semibold text-[#f4f3ee]">
            <Shield className="w-4 h-4 text-[#7a9e8b]" />
            <span>Security Governance</span>
          </div>
          <p className="text-[#78827c] leading-relaxed">
            All student comments are treated as untrusted user input. Injection indicators (such as R027) trigger isolated investigation flags without modifying system prompts.
          </p>
        </div>
      </div>
    </div>
  );
}

