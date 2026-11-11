import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  ShieldAlert, 
  Clock, 
  Layers, 
  BookOpen, 
  Cpu, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  History,
  FileText,
  Binary,
  Lightbulb,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getCaseDetails } from '../services/caseService';
import QuestionRenderer from '../components/QuestionRenderer';
import PersistedInvestigationPanel from '../components/PersistedInvestigationPanel';

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLiveTriage, setShowLiveTriage] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCaseDetails(caseId);
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Case not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#626965] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[#6ba883]" />
        <span>Loading academic investigation context and native MathML...</span>
      </div>
    );
  }

  if (error || !data?.case) {
    return (
      <div className="p-6 rounded-lg bg-[#271917] border border-[#4a2723] text-xs text-[#f2b8b3] space-y-3">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-[#e07167]" />
          <span>Case Load Error: {error || 'Investigation case not found.'}</span>
        </div>
        <Link
          to="/queue"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181d1a] border border-[#2b312e] text-[#f4f3ee] hover:bg-[#202723]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Investigation Queue</span>
        </Link>
      </div>
    );
  }

  const { case: invCase, question, taxonomy } = data;
  const qType = question?.questionType || invCase.questionSnapshot?.questionType || 'scq';
  const qPayload = question ? question[qType] : null;
  const aiTriage = invCase.triageResult || invCase.aiTriage;

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-12">
      {/* Navigation & Case Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b312e] pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/queue"
            className="p-2 rounded-lg bg-[#181d1a] hover:bg-[#202723] text-[#969e99] hover:text-[#f4f3ee] border border-[#2b312e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-medium tracking-tight text-[#f4f3ee] font-mono">
                {invCase.caseId}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1e2722] text-[#8fd1a8] border border-[#2e4437]">
                {invCase.status}
              </span>
              {invCase.reportCount > 1 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#2b271d] text-[#e0c082] border border-[#4d4229]">
                  {invCase.reportCount} Reports
                </span>
              )}
            </div>
            <div className="text-xs text-[#78827c] font-mono mt-0.5">
              Question ID: {invCase.questionId} · Type: {qType.toUpperCase()}
            </div>
          </div>
        </div>

        <button
          onClick={fetchDetails}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1a1f1c] hover:bg-[#222925] text-[#969e99] hover:text-[#f4f3ee] border border-[#2b312e] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* 1. Case Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#2b312e]">
          <span className="text-[10px] text-[#78827c] uppercase font-semibold block">Subject</span>
          <span className="text-[#f4f3ee] font-medium text-sm mt-0.5 block">{invCase.questionSnapshot?.subject || 'JEE Academic'}</span>
        </div>
        <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#2b312e]">
          <span className="text-[10px] text-[#78827c] uppercase font-semibold block">Chapter</span>
          <span className="text-[#f4f3ee] font-medium text-sm mt-0.5 block truncate">{invCase.questionSnapshot?.chapter || 'General'}</span>
        </div>
        <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#2b312e]">
          <span className="text-[10px] text-[#78827c] uppercase font-semibold block">First Reported</span>
          <span className="text-[#b3beba] mt-0.5 block font-mono">{new Date(invCase.firstReportedAt).toLocaleDateString()}</span>
        </div>
        <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#2b312e]">
          <span className="text-[10px] text-[#78827c] uppercase font-semibold block">Latest Reported</span>
          <span className="text-[#b3beba] mt-0.5 block font-mono">{new Date(invCase.lastReportedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* 9. Injection Risk Indicators (Flagged Banner) */}
      {invCase.injectionAnalysis?.injectionDetected && (
        <div className="p-4 rounded-lg bg-[#271917] border border-[#4a2723] text-xs text-[#f2b8b3] space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-[#fce8e6]">
            <ShieldAlert className="w-4 h-4 text-[#e07167]" />
            <span>Adversarial Prompt Injection Flagged ({invCase.injectionAnalysis.riskLevel.toUpperCase()})</span>
          </div>
          <p className="text-[11px] text-[#d69894] leading-relaxed">
            {invCase.injectionAnalysis.summary} The system has isolated the student input as untrusted evidence. Core decision models and taxonomy rules remain protected.
          </p>
        </div>
      )}

      {/* 2, 3, 4, 5. Question Stem, Rendered MathML, Options & Stored Answer */}
      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#242b27] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#6ba883]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
              Original Question &amp; Options (Native MathML)
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2722] text-[#8fd1a8] border border-[#2e4437]">
            Sanitized MathML
          </span>
        </div>

        {/* Question HTML with inline MathML */}
        <div className="p-4 rounded-lg bg-[#121514] border border-[#202522] min-h-[140px] overflow-x-auto">
          {qPayload?.question ? (
            <QuestionRenderer htmlContent={qPayload.question} />
          ) : (
            <div className="text-xs text-[#626965] italic">No question stem recorded.</div>
          )}
        </div>

        {/* 5. Original Answer Key */}
        <div className="p-3.5 rounded-lg bg-[#141b17] border border-[#27382f] flex items-center justify-between text-xs">
          <span className="text-[#969e99]">Official Stored Answer Key:</span>
          <span className="font-mono font-bold text-[#8fd1a8] text-sm">
            {Array.isArray(qPayload?.answer)
              ? qPayload.answer.filter(Boolean).join(', ')
              : String(qPayload?.answer ?? '—')}
          </span>
        </div>
      </div>

      {/* 6. Supplied Solution */}
      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#242b27] pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#e0c082]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
              Supplied Official Solution
            </h2>
          </div>
          <span className="text-[10px] text-[#626965]">Stored working</span>
        </div>

        <div className="p-4 rounded-lg bg-[#121514] border border-[#202522] min-h-[120px] overflow-x-auto">
          {qPayload?.solution ? (
            <QuestionRenderer htmlContent={qPayload.solution} />
          ) : (
            <div className="text-xs text-[#626965] italic">No official solution text stored for this question.</div>
          )}
        </div>
      </div>

      {/* 7. Student Reports & Individual Comments */}
      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#242b27] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#7a9e8b]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
              Student Reports ({invCase.reports?.length || 0})
            </h2>
          </div>
          <span className="text-[10px] text-[#626965]">Untrusted feedback claims</span>
        </div>

        <div className="space-y-2">
          {invCase.reports?.map((rep, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-[#121514] border border-[#202522] text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#626965]">
                <span className="font-mono text-[#8ba895] font-medium">{rep.reportId} · Student ID: {rep.studentId}</span>
                <span>{new Date(rep.reportedAt).toLocaleString()} ({rep.source || 'web'})</span>
              </div>
              <div className="text-[#f4f3ee] italic leading-relaxed">
                "{rep.comment || 'No comment provided'}"
              </div>
              {rep.injectionRisk?.injectionDetected && (
                <div className="text-[10px] text-[#e07167] font-mono">
                  Adversarial indicator: {rep.injectionRisk.riskLevel} - {rep.injectionRisk.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 8. Error History */}
      {invCase.errorHistoryContext && invCase.errorHistoryContext.length > 0 && (
        <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#242b27] pb-3">
            <History className="w-4 h-4 text-[#6ba883]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
              Question Error History (Prior Corrections)
            </h2>
          </div>
          <div className="space-y-2 text-xs">
            {invCase.errorHistoryContext.map((eh, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#121514] border border-[#202522] flex items-start justify-between gap-3">
                <div>
                  <span className="font-semibold text-[#8fd1a8]">{eh.type}</span>
                  <p className="text-[#b3beba] text-[11px] mt-0.5">{eh.note || 'No notes'}</p>
                </div>
                <div className="text-right text-[10px] text-[#626965] font-mono shrink-0">
                  <div>{eh.actor || 'faculty'}</div>
                  <div>{eh.at ? new Date(eh.at).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Primary Academic Investigation Findings (Persisted MongoDB Investigations) */}
      <PersistedInvestigationPanel 
        investigations={data.investigations || invCase.investigations || []} 
        caseData={invCase} 
      />

      {/* Optional: Live AI Inference Diagnostic Console (Decoupled from Stored Findings) */}
      <div className="bg-[#141816] border border-[#242b27] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#78827c]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#969e99]">
              Live AI Inference Console (Optional Diagnostic)
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
          <div className="pt-3 border-t border-[#202522] space-y-3 text-xs">
            {aiTriage ? (
              <div className="space-y-3">
                {aiTriage.status === 'failed' && (
                  <div className="p-3.5 rounded bg-[#271917] border border-[#4a2723] text-[#f2b8b3] space-y-1">
                    <span className="font-semibold text-[#fce8e6] block">Previous Live Inference Log</span>
                    <p className="text-[11px] text-[#e07167]">Error: {aiTriage.error || 'Request error occurred.'}</p>
                    {aiTriage.requiresManualRecovery && (
                      <p className="text-[10px] text-[#e0c082] mt-1 font-mono">
                        Note: Request reached timeout threshold. The authoritative academic investigation findings are already persisted above.
                      </p>
                    )}
                  </div>
                )}
                {aiTriage.status === 'processing' && (
                  <div className="p-3.5 rounded bg-[#1e2722] border border-[#2e4437] text-[#8fd1a8] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6ba883]" />
                    <span className="text-xs">Inference in progress with NVIDIA NIM. Request locked against duplicate submission.</span>
                  </div>
                )}
                {aiTriage.status === 'completed' && (
                  <div className="p-3.5 rounded bg-[#121514] border border-[#202522] space-y-2">
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
    </div>
  );
}

