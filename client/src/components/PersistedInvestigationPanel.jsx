import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Cpu, 
  Check, 
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';

/**
 * PersistedInvestigationPanel
 * 
 * Displays the authoritative persisted academic findings from MongoDB (ReportInvestigation)
 * completely independent of whether NVIDIA NIM inference was executed or timed out.
 * 
 * Features:
 * - Tabbed/stacked report findings for multi-complaint cases (e.g. R001, R002, R003)
 * - Academic evidence & mathematical proof
 * - Proposed surgical before/after corrections
 * - Taxonomy compliance & auto-eligibility metrics
 * - Quarantined prompt injection alert
 */
export default function PersistedInvestigationPanel({ investigations = [], caseData }) {
  const [activeReportIdx, setActiveReportIdx] = useState(0);

  if (!investigations || investigations.length === 0) {
    return (
      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#78827c]">
          <FileText className="w-4 h-4 text-[#8ba895]" />
          <span>Authoritative Stored Investigation</span>
        </div>
        <p className="text-xs text-[#626965]">
          No stored investigation found in MongoDB for this case.
        </p>
      </div>
    );
  }

  const current = investigations[activeReportIdx] || investigations[0];

  return (
    <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-5">
      {/* 1. Header Bar: Title, Count, & Report Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242b27] pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#6ba883]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
            Authoritative Stored Investigation Evidence
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1e2722] text-[#8fd1a8] border border-[#2e4437]">
            {investigations.length} {investigations.length === 1 ? 'Finding' : 'Distinct Findings'}
          </span>
        </div>

        {/* Tab selector for multi-report cases */}
        {investigations.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {investigations.map((inv, idx) => (
              <button
                key={inv.reportId}
                onClick={() => setActiveReportIdx(idx)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                  activeReportIdx === idx
                    ? 'bg-[#24332a] text-[#bde8ce] border border-[#3e5647] font-semibold'
                    : 'bg-[#121514] text-[#78827c] hover:text-[#f4f3ee] border border-[#202522]'
                }`}
              >
                {inv.reportId}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Adversarial Prompt Injection Quarantined Banner (if detected on this report) */}
      {current.injectionDetected && (
        <div className="p-3.5 rounded-lg bg-[#271917] border border-[#4a2723] text-xs text-[#f2b8b3] space-y-1">
          <div className="flex items-center gap-2 font-semibold text-[#fce8e6]">
            <ShieldAlert className="w-4 h-4 text-[#e07167]" />
            <span>Adversarial Injection Quarantined (Report: {current.reportId})</span>
          </div>
          <p className="text-[11px] text-[#d69894]">
            {current.injectionEvidence || 'Malicious instruction was isolated. Question was evaluated strictly on academic physics principles.'}
          </p>
        </div>
      )}

      {/* 3. Section A: Investigation Verdict & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-[#121514] border border-[#202522]">
          <span className="text-[10px] text-[#626965] uppercase block font-semibold">Report ID</span>
          <span className="font-mono text-sm text-[#f4f3ee] font-semibold mt-0.5 block">{current.reportId}</span>
        </div>

        <div className="p-3 rounded-lg bg-[#121514] border border-[#202522]">
          <span className="text-[10px] text-[#626965] uppercase block font-semibold">Investigated Verdict</span>
          <span className={`font-mono text-sm font-semibold mt-0.5 block ${
            current.verdict === 'defect' ? 'text-[#e07167]' : 'text-[#8fd1a8]'
          }`}>
            {current.verdict}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#121514] border border-[#202522]">
          <span className="text-[10px] text-[#626965] uppercase block font-semibold">Repair Type</span>
          <span className="font-mono text-sm text-[#e0c082] font-semibold mt-0.5 block truncate">
            {current.repairType || 'None'}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#121514] border border-[#202522]">
          <span className="text-[10px] text-[#626965] uppercase block font-semibold">Calibrated Confidence</span>
          <span className="font-mono text-sm text-[#f4f3ee] font-semibold mt-0.5 block">
            {((current.confidence || 0) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 4. Section B: Academic Evidence & Mathematical Recalculation */}
      <div className="p-4 rounded-lg bg-[#121514] border border-[#202522] space-y-2.5 text-xs">
        <div className="flex items-center justify-between border-b border-[#202522] pb-2">
          <span className="text-[10px] font-semibold text-[#78827c] uppercase tracking-wider">
            Academic Evidence &amp; Independent Recalculation
          </span>
          <span className="text-[10px] font-mono text-[#6ba883]">
            Audit Version: {current.investigationVersion || '6.0-hardened-audit'}
          </span>
        </div>

        <p className="text-[#e2eee7] leading-relaxed font-sans text-xs">
          {current.evidence || 'No detailed evidence recorded.'}
        </p>

        {current.reasoning && (
          <div className="pt-2 border-t border-[#1a1f1c] text-[#a3b3aa] text-[11px] leading-relaxed">
            <strong className="text-[#8fd1a8] block mb-0.5 font-sans">Formal Reasoning:</strong>
            {current.reasoning}
          </div>
        )}
      </div>

      {/* 5. Section C: Proposed Correction Diff Preview */}
      {current.proposedEdit && current.proposedEdit.field && (
        <div className="p-4 rounded-lg bg-[#121514] border border-[#202522] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#78827c] uppercase tracking-wider">
              Proposed Surgical Correction (Target Field: {current.proposedEdit.field})
            </span>
            <span className="text-[10px] font-mono text-[#e0c082]">Stored In ReportInvestigation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded bg-[#271917]/70 border border-[#4a2723] text-[#f2b8b3]">
              <span className="text-[10px] text-[#e07167] block uppercase font-sans mb-1 font-semibold">
                Existing Content (Find)
              </span>
              <div className="break-all whitespace-pre-wrap">{current.proposedEdit.find || 'N/A'}</div>
            </div>

            <div className="p-3 rounded bg-[#17241c]/70 border border-[#294233] text-[#bde8ce]">
              <span className="text-[10px] text-[#6ba883] block uppercase font-sans mb-1 font-semibold">
                Proposed Correction (Replace)
              </span>
              <div className="break-all whitespace-pre-wrap">{current.proposedEdit.replace || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* If verdict is defect with no edit, or no_error, explain clearly */}
      {(!current.proposedEdit || !current.proposedEdit.field) && (
        <div className="p-3 rounded bg-[#121514] border border-[#202522] text-xs text-[#78827c] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#6ba883]" />
          <span>
            {current.verdict === 'no_error'
              ? 'No correction proposed. Stored question stem, MathML solution, and answer key verified sound.'
              : current.repairType === 'diagram'
              ? 'No automated correction proposed. Missing diagram requires human faculty figure upload.'
              : current.repairType === 'wrong_chapter'
              ? 'No text replacement proposed. Reclassification of chapter requires human faculty assignment.'
              : 'No automated text edit generated for this finding.'}
          </span>
        </div>
      )}

      {/* 6. Section D: Faculty Review Safeguards & Taxonomy Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
        <div className="p-2.5 rounded bg-[#121514] border border-[#202522] flex items-center justify-between">
          <span className="text-[#626965]">Faculty Review:</span>
          <span className={`font-semibold ${current.requiresFacultyReview ? 'text-[#e0c082]' : 'text-[#8ba895]'}`}>
            {current.requiresFacultyReview ? 'Mandatory' : 'Optional'}
          </span>
        </div>

        <div className="p-2.5 rounded bg-[#121514] border border-[#202522] flex items-center justify-between">
          <span className="text-[#626965]">Taxonomy Auto:</span>
          <span className={`font-semibold ${current.taxonomyAutoEligible ? 'text-[#8fd1a8]' : 'text-[#626965]'}`}>
            {current.taxonomyAutoEligible ? 'true' : 'false'}
          </span>
        </div>

        <div className="p-2.5 rounded bg-[#121514] border border-[#202522] flex items-center justify-between">
          <span className="text-[#626965]">Auto-Eligible:</span>
          <span className={`font-semibold ${current.autoEligible ? 'text-[#8fd1a8]' : 'text-[#626965]'}`}>
            {current.autoEligible ? 'true' : 'false'}
          </span>
        </div>

        <div className="p-2.5 rounded bg-[#121514] border border-[#202522] flex items-center justify-between">
          <span className="text-[#626965]">Safe To Apply:</span>
          <span className={`font-semibold ${current.safeToApply ? 'text-[#8fd1a8]' : 'text-[#e07167]'}`}>
            {current.safeToApply ? 'true' : 'false'}
          </span>
        </div>
      </div>

      {/* 7. Uncertainties (if any) */}
      {current.uncertainties && current.uncertainties.length > 0 && (
        <div className="p-3 rounded-lg bg-[#272115] border border-[#443820] text-[#e0c082] text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-[#e0c082]" />
            <span>Uncertainties Logged</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#f0d8a8]">
            {current.uncertainties.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 8. Student Response Preview */}
      {current.studentReplyPreview && (
        <div className="p-3 rounded bg-[#151c18] border border-[#283d30] text-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#73a887] uppercase tracking-wider block">
            Generated Student Response Preview ({current.reportId})
          </span>
          <p className="text-[#e2eee7] italic text-xs leading-relaxed">
            "{current.studentReplyPreview}"
          </p>
        </div>
      )}
    </div>
  );
}

