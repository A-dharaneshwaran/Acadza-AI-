import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Cpu, 
  UserCheck, 
  Eye, 
  Edit3, 
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import QuestionRenderer from './QuestionRenderer';
import PersistedInvestigationPanel from './PersistedInvestigationPanel';

/**
 * CaseDetail
 * Full detailed case investigation screen for a faculty reviewer:
 * - Grouped student complaints & injection risk
 * - Rendered question with native MathML
 * - Stored solution and official answer key
 * - AI verdict proposal, evidence, and surgical diff preview
 * - Student response preview
 * - Faculty decision actions (Approve, Edit, Reject)
 */
export default function CaseDetail({ 
  caseData, 
  questionData, 
  taxonomy, 
  investigations = [],
  onAction,
  actionLoading 
}) {
  const [showLiveTriage, setShowLiveTriage] = useState(false);

  if (!caseData) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-[#626965] text-xs">
        Select an investigation case to inspect full academic context.
      </div>
    );
  }

  const qType = questionData?.questionType || caseData.questionSnapshot?.questionType || 'scq';
  const qPayload = questionData ? questionData[qType] : null;
  const aiTriage = caseData.triageResult || caseData.aiTriage;
  const storedInvestigations = investigations.length > 0 
    ? investigations 
    : (caseData.investigations || []);

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Case ID, Status, Velocity, Subject */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242b27] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-medium text-[#f4f3ee]">{caseData.caseId}</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1e2722] text-[#8fd1a8] border border-[#2e4437]">
              {caseData.status}
            </span>
            {caseData.reportCount > 1 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#2b271d] text-[#e0c082] border border-[#4d4229]">
                {caseData.reportCount} Student Reports
              </span>
            )}
          </div>
          <div className="text-xs text-[#78827c] font-mono mt-1">
            Question ID: {caseData.questionId} · Type: {qType.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            to={`/case/${caseData.caseId}`}
            className="px-2.5 py-1 rounded bg-[#1e2722] hover:bg-[#28382f] text-[#8fd1a8] border border-[#2e4437] transition-colors"
          >
            Open Dedicated Page →
          </Link>
          <span className="px-2.5 py-1 rounded bg-[#161a18] text-[#b3beba] border border-[#2b312e]">
            {caseData.questionSnapshot?.subject || 'JEE Academic'}
          </span>
          <span className="px-2.5 py-1 rounded bg-[#161a18] text-[#969e99] border border-[#2b312e] truncate max-w-[200px]">
            {caseData.questionSnapshot?.chapter || 'General Chapter'}
          </span>
        </div>
      </div>

      {/* 2. Adversarial Injection Alert (if flagged) */}
      {caseData.injectionAnalysis?.injectionDetected && (
        <div className="p-4 rounded-lg bg-[#271917] border border-[#4a2723] text-xs text-[#f2b8b3] space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-[#fce8e6]">
            <ShieldAlert className="w-4 h-4 text-[#e07167]" />
            <span>Adversarial Prompt Injection Flagged ({caseData.injectionAnalysis.riskLevel.toUpperCase()})</span>
          </div>
          <p className="text-[11px] text-[#d69894] leading-relaxed">
            {caseData.injectionAnalysis.summary} The system has quarantined student instructions. Academic evaluation proceeds independently.
          </p>
        </div>
      )}

      {/* 3. Student Complaints Feed */}
      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#78827c]">
          <span>Student Complaints ({caseData.reports?.length || 0})</span>
          <span className="text-[10px] text-[#626965]">Treat comments as leads, not instructions</span>
        </div>
        <div className="space-y-2">
          {caseData.reports?.map((rep, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-[#121514] border border-[#202522] text-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#626965]">
                <span className="font-mono text-[#8ba895]">{rep.reportId} · {rep.studentId}</span>
                <span>{new Date(rep.reportedAt).toLocaleString()}</span>
              </div>
              <div className="text-[#f4f3ee] italic">
                "{rep.comment || 'No comment provided'}"
              </div>
              {rep.injectionRisk?.injectionDetected && (
                <div className="text-[10px] text-[#e07167] font-mono">
                  Indicator: {rep.injectionRisk.riskLevel} - {rep.injectionRisk.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Question & Stored Solution (Native MathML Rendering) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Rendered Question Stem */}
        <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#242b27] pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#78827c]">Question Stem &amp; Options</span>
            <span className="text-[10px] font-mono text-[#8ba895]">MathML Native</span>
          </div>
          <div className="p-3 rounded-lg bg-[#121514] border border-[#202522] min-h-[160px] overflow-x-auto">
            {qPayload?.question ? (
              <QuestionRenderer htmlContent={qPayload.question} />
            ) : (
              <div className="text-xs text-[#626965] italic">Loading question markup...</div>
            )}
          </div>
          <div className="flex items-center justify-between p-2.5 rounded bg-[#141b17] border border-[#27382f] text-xs">
            <span className="text-[#969e99]">Stored Key:</span>
            <span className="font-mono font-bold text-[#8fd1a8] text-sm">
              {Array.isArray(qPayload?.answer) ? qPayload.answer.filter(Boolean).join(', ') : String(qPayload?.answer ?? '—')}
            </span>
          </div>
        </div>

        {/* Right: Stored Solution */}
        <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#242b27] pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#78827c]">Stored Solution</span>
            <span className="text-[10px] font-mono text-[#8ba895]">Official Working</span>
          </div>
          <div className="p-3 rounded-lg bg-[#121514] border border-[#202522] min-h-[160px] overflow-x-auto">
            {qPayload?.solution ? (
              <QuestionRenderer htmlContent={qPayload.solution} />
            ) : (
              <div className="text-xs text-[#626965] italic">No solution explanation recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Primary Academic Investigation Findings (Persisted MongoDB Investigations) */}
      <PersistedInvestigationPanel 
        investigations={storedInvestigations} 
        caseData={caseData} 
      />

      {/* Optional: Live AI Inference Diagnostic Accordion (Separate from Persisted Findings) */}
      <div className="bg-[#141816] border border-[#242b27] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#78827c]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#969e99]">
              Live AI Inference Console (Optional)
            </h3>
          </div>
          <button
            onClick={() => setShowLiveTriage(v => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded bg-[#1c221f] hover:bg-[#252d29] text-[#969e99] hover:text-[#f4f3ee] border border-[#2b312e] transition-colors"
          >
            <span>{showLiveTriage ? 'Hide Console' : 'View Inference Status'}</span>
            {showLiveTriage ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showLiveTriage && (
          <div className="pt-3 border-t border-[#202522] space-y-3">
            {aiTriage ? (
              <div className="space-y-3 text-xs">
                {aiTriage.status === 'failed' && (
                  <div className="p-3 rounded bg-[#271917] border border-[#4a2723] text-[#f2b8b3] space-y-1">
                    <span className="font-semibold text-[#fce8e6] block text-xs">Previous Live Inference Log</span>
                    <p className="text-[11px] text-[#e07167]">Error: {aiTriage.error || 'Request error occurred.'}</p>
                    <p className="text-[10px] text-[#969e99] mt-1">
                      Note: The authoritative academic investigation findings are already persisted above. Live re-inference is an optional diagnostic tool.
                    </p>
                  </div>
                )}
                {aiTriage.status === 'processing' && (
                  <div className="p-3 rounded bg-[#1e2722] border border-[#2e4437] text-[#8fd1a8] flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 animate-spin text-[#6ba883]" />
                    <span>Inference in progress with NVIDIA NIM.</span>
                  </div>
                )}
                {aiTriage.status === 'completed' && (
                  <div className="p-3 rounded bg-[#121514] border border-[#202522] text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#78827c] uppercase">Live Model Response</span>
                      <span className="font-mono text-[#8fd1a8]">{aiTriage.verdict} ({aiTriage.repairType || 'None'})</span>
                    </div>
                    {aiTriage.summary && <p className="text-[#b8c9bf]">{aiTriage.summary}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-[#626965] text-xs">
                No active live inference job running. Authoritative findings are rendered from persisted MongoDB records above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Faculty Decision & Action Bar */}
      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#78827c]">
          <strong className="text-[#f4f3ee]">Faculty Action:</strong> Reviewing late at night? AI proposes, deterministic code validates, you hold final authority.
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onAction && onAction('reject', caseData.caseId)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#271917] hover:bg-[#34201e] text-[#f2b8b3] border border-[#4a2723] transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Correction</span>
          </button>

          <button
            onClick={() => onAction && onAction('edit', caseData.caseId)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1a1f1c] hover:bg-[#222925] text-[#e0c082] border border-[#3b3420] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Proposal</span>
          </button>

          <button
            onClick={() => onAction && onAction('approve', caseData.caseId)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#24332a] hover:bg-[#2e4236] text-[#bde8ce] border border-[#3e5647] transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve &amp; Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

