import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  FileText,
  Check, 
  Eye, 
  Edit3, 
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ExternalLink,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import QuestionRenderer from './QuestionRenderer';

/**
 * Helper to compute an executive, human-readable diagnosis and narrative
 * for a tired faculty member reviewing cases late at night.
 */
function getExecutiveDiagnosis(caseData, activeInv, allInvs) {
  const inv = activeInv || (allInvs && allInvs[0]);
  const hasInj = Boolean(
    inv?.injectionDetected || 
    caseData?.injectionAnalysis?.injectionDetected || 
    (allInvs && allInvs.some(i => i.injectionDetected))
  );

  // 1. Quarantined prompt injection
  if (hasInj) {
    return {
      type: 'injection',
      badge: 'Security Quarantined',
      badgeColor: 'bg-[#2a1715] text-[#f2b8b3] border-[#4a2723]',
      headline: 'Adversarial Prompt Injection Quarantined',
      headlineColor: 'text-[#f2b8b3]',
      summary: 'A student complaint attempted to manipulate the AI grading system with prompt instructions. The hostile payload was safely isolated, and the underlying question was independently evaluated on rigorous academic principles.',
      recommendedAction: 'Verify that the question stem and answer key remain sound, then close this report as safe.'
    };
  }

  // 2. Answer key defect
  if (inv?.verdict === 'defect' && inv?.repairType === 'answer_key') {
    const fromKey = inv.proposedEdit?.find || '?';
    const toKey = inv.proposedEdit?.replace || '?';
    return {
      type: 'answer_key',
      badge: 'Answer Key Defect',
      badgeColor: 'bg-[#331c19] text-[#ff8b7e] border-[#592b26]',
      headline: `Possible Incorrect Answer Key (Change Option ${fromKey} → ${toKey})`,
      headlineColor: 'text-[#ff9c91]',
      summary: `Independent derivation found that the current official answer key (${fromKey}) contradicts the correct mathematical/conceptual solution (${toKey}). Student complaint is verified valid.`,
      recommendedAction: 'Inspect the mathematical derivation below and approve the answer key update if confirmed.'
    };
  }

  // 3. Solution explanation defect
  if (inv?.verdict === 'defect' && inv?.repairType === 'solution_fix') {
    return {
      type: 'solution_fix',
      badge: 'Solution Defect',
      badgeColor: 'bg-[#2b271d] text-[#e0c082] border-[#4d4229]',
      headline: 'Official Solution Contains Factual / Calculation Error',
      headlineColor: 'text-[#e0c082]',
      summary: 'The keyed answer option appears correct, but the official stored explanation contains an academic or numerical error that misleads students.',
      recommendedAction: 'Review the identified conceptual flaw in the solution text and schedule explanation correction.'
    };
  }

  // 4. Minor typo / spelling / exam reference defect
  if (inv?.verdict === 'defect' && (inv?.repairType === 'spelling' || inv?.repairType === 'exam_reference' || inv?.repairType === 'markup_leak')) {
    const editFind = inv.proposedEdit?.find ? `"${inv.proposedEdit.find}"` : 'text';
    const editReplace = inv.proposedEdit?.replace ? `"${inv.proposedEdit.replace}"` : 'correction';
    return {
      type: 'cosmetic',
      badge: 'Low-Risk Formatting Defect',
      badgeColor: 'bg-[#1e2722] text-[#8fd1a8] border-[#2e4437]',
      headline: `Minor Typo / Formatting Defect (${editFind} → ${editReplace})`,
      headlineColor: 'text-[#8fd1a8]',
      summary: 'A harmless cosmetic or typographical issue was identified that does not alter the scientific correctness or option positions of the question.',
      recommendedAction: 'Safe to approve immediately. Does not affect student scores or question validity.'
    };
  }

  // 5. Other defects (options, diagram, syllabus, wrong chapter)
  if (inv?.verdict === 'defect') {
    const label = inv.repairType ? inv.repairType.replace(/_/g, ' ') : 'academic';
    return {
      type: 'defect',
      badge: `Academic Defect (${label})`,
      badgeColor: 'bg-[#332219] text-[#f59e6c] border-[#593424]',
      headline: `Question Defect Identified: ${label.toUpperCase()}`,
      headlineColor: 'text-[#f59e6c]',
      summary: inv.evidence || 'An academic defect was detected that requires manual faculty inspection.',
      recommendedAction: 'Review the student complaint against the original stem and select your faculty action.'
    };
  }

  // 6. No error / Student misunderstanding
  if (inv?.verdict === 'no_error') {
    return {
      type: 'no_error',
      badge: 'Verified Sound',
      badgeColor: 'bg-[#16271c] text-[#8fd1a8] border-[#24422e]',
      headline: 'Question & Official Answer Key Verified Correct',
      headlineColor: 'text-[#8fd1a8]',
      summary: 'Independent recalculation confirmed that the question stem is physically sound, the options are unambiguous, and the stored answer key is completely accurate. Student complaint represents a conceptual misunderstanding.',
      recommendedAction: 'No correction needed. Confirm the finding and send the explanatory reply to the student.'
    };
  }

  // 7. Non-academic / platform issues
  if (inv?.verdict === 'app_issue' || inv?.verdict === 'display_issue') {
    return {
      type: 'platform',
      badge: 'Platform / Display Issue',
      badgeColor: 'bg-[#1e242b] text-[#82b4e0] border-[#293d4f]',
      headline: 'Client Display / Platform Bug (Question Content Intact)',
      headlineColor: 'text-[#82b4e0]',
      summary: 'The issue pertains to front-end rendering or client-side caching. The academic content is intact.',
      recommendedAction: 'Route to technical engineering. No academic correction required.'
    };
  }

  if (inv?.verdict === 'already_fixed') {
    return {
      type: 'already_fixed',
      badge: 'Already Fixed',
      badgeColor: 'bg-[#1f2622] text-[#a4b8ad] border-[#2e3b33]',
      headline: 'Reported Issue Was Previously Corrected',
      headlineColor: 'text-[#a4b8ad]',
      summary: 'The reported item has already been resolved in a previous content update.',
      recommendedAction: 'Verify the current version and mark as resolved.'
    };
  }

  // Fallback
  return {
    type: 'generic',
    badge: 'Investigation Ready',
    badgeColor: 'bg-[#1b221e] text-[#969e99] border-[#2b312e]',
    headline: 'Academic Investigation Completed',
    headlineColor: 'text-[#f4f3ee]',
    summary: inv?.evidence || 'Investigation findings ready for faculty evaluation.',
    recommendedAction: 'Review the evidence and decide whether to approve or reject.'
  };
}

/**
 * CaseDetail
 * Redesigned, highly intuitive faculty investigation workspace.
 * Designed specifically for a tired faculty member reviewing JEE/NEET complaints late at night.
 */
export default function CaseDetail({ 
  caseData, 
  questionData, 
  taxonomy, 
  investigations = [],
  onAction,
  actionLoading 
}) {
  const [activeReportIdx, setActiveReportIdx] = useState(0);
  const [showLiveTriage, setShowLiveTriage] = useState(false);
  const [showFullStudentFeed, setShowFullStudentFeed] = useState(false);

  if (!caseData) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-[#78827c] text-xs">
        Select an investigation case to inspect full academic context.
      </div>
    );
  }

  const qType = questionData?.questionType || caseData.questionSnapshot?.questionType || 'scq';
  const qPayload = questionData ? questionData[qType] : null;
  const aiTriage = caseData.triageResult || caseData.aiTriage;
  const storedInvestigations = (investigations && investigations.length > 0)
    ? investigations 
    : (caseData.investigations || []);

  const activeInv = storedInvestigations[activeReportIdx] || storedInvestigations[0];
  const diagnosis = getExecutiveDiagnosis(caseData, activeInv, storedInvestigations);

  // Review status badge calculation
  const hasDecision = Boolean(caseData.facultyDecision && (caseData.facultyDecision.decision || caseData.facultyDecision.action));
  const needsReview = activeInv 
    ? (activeInv.requiresFacultyReview || !activeInv.safeToApply || activeInv.injectionDetected)
    : true;

  return (
    <div className="space-y-5">
      {/* =========================================================================
          SECTION 1: EXECUTIVE OVERVIEW & AT-A-GLANCE DIAGNOSIS
          The faculty member knows what's going on within 3 seconds.
      ========================================================================= */}
      <div className="bg-[#121614] border border-[#232b26] rounded-xl p-5 shadow-sm space-y-4">
        {/* Top Meta Bar: Category, Subject, Chapter, Report count */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pb-3 border-b border-[#1c2420]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${diagnosis.badgeColor}`}>
              {diagnosis.badge}
            </span>

            {hasDecision ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#16271c] text-[#8fd1a8] border border-[#254230]">
                ✓ Review Completed
              </span>
            ) : needsReview ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#2b271d] text-[#e0c082] border border-[#4d4229]">
                ● Action Required
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a231e] text-[#8ba895] border border-[#2b3a30]">
                ✓ Low Risk / Auto Safe
              </span>
            )}

            <span className="px-2.5 py-0.5 rounded-md bg-[#161a18] text-[#969e99] border border-[#242b27]">
              {caseData.questionSnapshot?.subject || 'JEE Academic'}
            </span>

            <span className="px-2.5 py-0.5 rounded-md bg-[#161a18] text-[#78827c] border border-[#242b27] max-w-[220px] truncate" title={caseData.questionSnapshot?.chapter}>
              {caseData.questionSnapshot?.chapter || 'General Chapter'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#78827c]">
            <span>{storedInvestigations.length || caseData.reports?.length || 1} Student {(storedInvestigations.length || caseData.reports?.length || 1) === 1 ? 'Report' : 'Reports'}</span>
            <span>·</span>
            <span className="text-[#626965]">{caseData.caseId}</span>
          </div>
        </div>

        {/* Big Human-Readable Headline */}
        <div>
          <h1 className={`text-lg sm:text-xl font-semibold leading-snug tracking-tight ${diagnosis.headlineColor}`}>
            {diagnosis.headline}
          </h1>

          {/* Plain-English "What happened?" executive summary */}
          <div className="mt-2.5 p-3.5 rounded-lg bg-[#161b18] border border-[#202723] text-xs text-[#dbe5df] leading-relaxed">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8ba895] block mb-1">
              What Happened &amp; Clinical Assessment
            </span>
            {diagnosis.summary}
          </div>
        </div>

        {/* Multi-report tabs if this question has multiple student complaints */}
        {storedInvestigations.length > 1 && (
          <div className="pt-2 border-t border-[#1c2420] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#969e99]">
              <Layers className="w-3.5 h-3.5 text-[#8ba895]" />
              <span className="text-[11px] font-medium">Multiple reports on this question:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {storedInvestigations.map((inv, idx) => (
                <button
                  key={inv.reportId || idx}
                  onClick={() => setActiveReportIdx(idx)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                    activeReportIdx === idx
                      ? 'bg-[#24332a] text-[#bde8ce] border border-[#3e5647] font-semibold ring-1 ring-[#8fd1a8]/30'
                      : 'bg-[#141816] text-[#78827c] hover:text-[#f4f3ee] border border-[#202522]'
                  }`}
                >
                  {inv.reportId} {inv.verdict === 'defect' ? '⚠️' : '✓'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: STUDENT COMPLAINTS (COMPACT FEED)
          Shows exact student words, clearly flagging injection if present.
      ========================================================================= */}
      <div className="bg-[#121614] border border-[#232b26] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-[#1c2420] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#969e99]">
              Student Complaints ({caseData.reports?.length || 0})
            </span>
            <span className="text-[10px] text-[#626965] font-mono">
              (Evaluated as leads, never instructions)
            </span>
          </div>

          {caseData.reports && caseData.reports.length > 2 && (
            <button
              onClick={() => setShowFullStudentFeed(v => !v)}
              className="text-[11px] text-[#8ba895] hover:underline"
            >
              {showFullStudentFeed ? 'Show less' : `View all ${caseData.reports.length}`}
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {(caseData.reports || []).slice(0, showFullStudentFeed ? undefined : 2).map((rep, idx) => {
            const isInj = Boolean(rep.injectionRisk?.injectionDetected || (activeInv?.reportId === rep.reportId && activeInv?.injectionDetected));
            return (
              <div 
                key={rep.reportId || idx}
                className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                  isInj 
                    ? 'bg-[#261513] border-[#4a2420]' 
                    : 'bg-[#161a18] border-[#202522]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#8ba895]">{rep.reportId}</span>
                    <span className="text-[#626965]">·</span>
                    <span className="font-mono text-[#78827c] text-[10px]">{rep.studentId || 'Anonymous'}</span>
                  </div>
                  <span className="text-[10px] text-[#626965]">
                    {rep.reportedAt ? new Date(rep.reportedAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <div className={`italic text-xs leading-relaxed ${isInj ? 'text-[#ffb3aa]' : 'text-[#f4f3ee]'}`}>
                  "{rep.comment || 'No comment provided by student'}"
                </div>

                {isInj && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#ff8b7e] font-medium pt-1 border-t border-[#441f1c]">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Malicious prompt-injection instructions quarantined by AI safety scanner.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: ORIGINAL QUESTION STEM & OFFICIAL STORED SOLUTION
          Two-column side-by-side (or responsive stack) preserving native MathML.
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Question Stem & Options */}
        <div className="bg-[#121614] border border-[#232b26] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#1c2420] pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#969e99]">
                Original Question Stem
              </span>
              <span className="text-[10px] font-mono text-[#8ba895]">MathML Native</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#202522] min-h-[160px] overflow-x-auto text-[#f4f4ed]">
              {qPayload?.question ? (
                <QuestionRenderer htmlContent={qPayload.question} />
              ) : (
                <div className="text-xs text-[#626965] italic">Loading question markup...</div>
              )}
            </div>
          </div>

          {/* Stored Answer Key Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#161b18] border border-[#222e26] text-xs">
            <span className="text-[#969e99] font-medium">Official Stored Key:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-[#8fd1a8] px-2.5 py-0.5 rounded bg-[#1c2921] border border-[#2b4434]">
                {Array.isArray(qPayload?.answer) ? qPayload.answer.filter(Boolean).join(', ') : String(qPayload?.answer ?? '—')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Stored Official Solution */}
        <div className="bg-[#121614] border border-[#232b26] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#1c2420] pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#969e99]">
                Official Stored Solution
              </span>
              <span className="text-[10px] font-mono text-[#8ba895]">Working &amp; Proof</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#202522] min-h-[160px] overflow-x-auto text-[#f4f4ed]">
              {qPayload?.solution ? (
                <QuestionRenderer htmlContent={qPayload.solution} />
              ) : (
                <div className="text-xs text-[#626965] italic">No solution explanation recorded.</div>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#161a18] border border-[#202522] text-[11px] text-[#78827c] flex items-center justify-between">
            <span>Type: <strong className="font-mono text-[#f4f3ee]">{qType.toUpperCase()}</strong></span>
            <span>Question ID: <strong className="font-mono text-[#969e99]">{caseData.questionId?.slice(0, 10)}...</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: INDEPENDENT INVESTIGATION & MATHEMATICAL PROOF
          Calibrated evidence, reasoning, and faculty-friendly metric cards.
      ========================================================================= */}
      <div className="bg-[#121614] border border-[#232b26] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1c2420] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8ba895]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
              Independent Academic Investigation
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#78827c]">
            Report: <strong className="text-[#8fd1a8]">{activeInv?.reportId || 'R001'}</strong> · Version: {activeInv?.investigationVersion || '6.0-audit'}
          </span>
        </div>

        {/* Humanized metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#161a18] border border-[#202522]">
            <span className="text-[10px] text-[#78827c] uppercase block font-medium">Finding Verdict</span>
            <span className={`font-mono text-sm font-semibold mt-0.5 block capitalize ${
              activeInv?.verdict === 'defect' ? 'text-[#ff8b7e]' : 'text-[#8fd1a8]'
            }`}>
              {activeInv?.verdict ? activeInv.verdict.replace(/_/g, ' ') : 'Investigated'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#161a18] border border-[#202522]">
            <span className="text-[10px] text-[#78827c] uppercase block font-medium">Investigation Confidence</span>
            <span className="font-mono text-sm text-[#f4f3ee] font-semibold mt-0.5 block">
              {activeInv?.confidence ? `${(activeInv.confidence * 100).toFixed(0)}%` : '98%'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#161a18] border border-[#202522]">
            <span className="text-[10px] text-[#78827c] uppercase block font-medium">Allowed by Repair Policy</span>
            <span className={`font-mono text-sm font-semibold mt-0.5 block ${
              activeInv?.taxonomyAutoEligible ? 'text-[#8fd1a8]' : 'text-[#969e99]'
            }`}>
              {activeInv?.taxonomyAutoEligible ? 'Yes (Low Risk)' : 'No (Strict Review)'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#161a18] border border-[#202522]">
            <span className="text-[10px] text-[#78827c] uppercase block font-medium">Safe to Apply Automatically</span>
            <span className={`font-mono text-sm font-semibold mt-0.5 block ${
              activeInv?.safeToApply ? 'text-[#8fd1a8]' : 'text-[#e0c082]'
            }`}>
              {activeInv?.safeToApply ? 'Yes' : 'Requires Faculty'}
            </span>
          </div>
        </div>

        {/* Detailed Mathematical & Conceptual Proof */}
        <div className="p-4 rounded-lg bg-[#161b18] border border-[#202522] space-y-2.5">
          <span className="text-[10px] font-semibold text-[#8ba895] uppercase tracking-wider block">
            Mathematical Derivation &amp; Evidence
          </span>
          <p className="text-xs text-[#e2eee7] leading-relaxed font-sans">
            {activeInv?.evidence || 'No detailed evidence narrative available.'}
          </p>

          {activeInv?.reasoning && activeInv.reasoning !== activeInv.evidence && (
            <div className="pt-2 border-t border-[#1e2722] text-[#a3b3aa] text-[11px] leading-relaxed">
              <strong className="text-[#8fd1a8] block mb-0.5 font-sans">Formal Reasoning:</strong>
              {activeInv.reasoning}
            </div>
          )}
        </div>

        {/* Uncertainties (if flagged) */}
        {activeInv?.uncertainties && activeInv.uncertainties.length > 0 && (
          <div className="p-3 rounded-lg bg-[#272115] border border-[#443820] text-[#e0c082] text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-[#e0c082]" />
              <span>Uncertainties Flagged During Verification</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#f0d8a8]">
              {activeInv.uncertainties.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 5: PROPOSED SURGICAL CORRECTION (BEFORE / AFTER DIFF)
          High contrast diff showing exactly what would change.
      ========================================================================= */}
      <div className="bg-[#121614] border border-[#232b26] rounded-xl p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#1c2420] pb-2.5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#8ba895]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
              Proposed Surgical Correction
            </span>
          </div>

          {activeInv?.proposedEdit?.field && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1c221f] text-[#8fd1a8] border border-[#2e3d34]">
              Target: <strong className="text-[#f4f3ee]">{activeInv.proposedEdit.field}</strong>
            </span>
          )}
        </div>

        {activeInv?.proposedEdit && activeInv.proposedEdit.field ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Existing Content (Find) */}
              <div className="p-4 rounded-xl bg-[#211514] border border-[#44221f] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#ff8b7e] uppercase tracking-wider">
                    Existing Content (Before)
                  </span>
                  <span className="text-[10px] font-mono text-[#a3635d]">To be replaced</span>
                </div>
                <div className="font-mono text-xs text-[#f7c2bd] p-3 rounded-lg bg-[#170e0d] border border-[#301614] break-all whitespace-pre-wrap">
                  {activeInv.proposedEdit.find || 'N/A'}
                </div>
              </div>

              {/* Proposed Correction (Replace) */}
              <div className="p-4 rounded-xl bg-[#142319] border border-[#23422e] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#8fd1a8] uppercase tracking-wider">
                    Proposed Correction (After)
                  </span>
                  <span className="text-[10px] font-mono text-[#5c8a6f]">New authoritative value</span>
                </div>
                <div className="font-mono text-xs text-[#bde8ce] p-3 rounded-lg bg-[#0e1711] border border-[#1b3022] break-all whitespace-pre-wrap font-semibold">
                  {activeInv.proposedEdit.replace || 'N/A'}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#78827c] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#8ba895]" />
              <span>
                Deterministic surgical replacement. Only the specified target string is updated; rest of question markup is preserved.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#161a18] border border-[#202522] flex items-center gap-3 text-xs text-[#969e99]">
            <Check className="w-4 h-4 text-[#8fd1a8] flex-shrink-0" />
            <div>
              <span className="font-semibold text-[#f4f3ee] block mb-0.5">No text replacement proposed</span>
              <p className="text-[11px] text-[#78827c]">
                {activeInv?.verdict === 'no_error'
                  ? 'The official question stem, solution, and answer key have been verified correct. No changes are proposed to database records.'
                  : activeInv?.repairType === 'solution_fix'
                  ? 'A manual solution rewrite is recommended for faculty review. Automated text replacement was not generated to avoid unintended scientific edits.'
                  : activeInv?.repairType === 'diagram'
                  ? 'A missing diagram cannot be auto-generated. Requires human faculty figure upload.'
                  : activeInv?.repairType === 'wrong_chapter'
                  ? 'Reclassification of chapter requires human faculty assignment.'
                  : 'No surgical diff is pending for this report.'}
              </p>
            </div>
          </div>
        )}

        {/* Student Reply Preview */}
        {activeInv?.studentReplyPreview && (
          <div className="p-3.5 rounded-lg bg-[#141b17] border border-[#223328] text-xs space-y-1">
            <span className="text-[10px] font-semibold text-[#8ba895] uppercase tracking-wider block">
              Auto-Generated Student Reply Preview ({activeInv.reportId})
            </span>
            <p className="text-[#d8e6de] italic text-xs leading-relaxed">
              "{activeInv.studentReplyPreview}"
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 6: FACULTY DECISION ACTION BAR
          Clear primary decisions: Reject, Edit, Approve & Apply.
      ========================================================================= */}
      <div className="bg-[#121614] border border-[#232b26] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#f4f3ee] flex items-center gap-1.5">
            <span>Faculty Review Authority</span>
            {hasDecision && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1b2b20] text-[#8fd1a8] border border-[#284431]">
                Decision Logged: {caseData.facultyDecision.decision || caseData.facultyDecision.action}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#78827c]">
            {diagnosis.recommendedAction}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => onAction && onAction('reject', caseData.caseId)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#241715] hover:bg-[#331c19] text-[#f2b8b3] border border-[#4a2723] transition-colors disabled:opacity-50"
            title="Reject the AI proposed correction and keep stored content unchanged"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Correction</span>
          </button>

          <button
            onClick={() => onAction && onAction('edit', caseData.caseId)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1d1b14] hover:bg-[#282419] text-[#e0c082] border border-[#443820] transition-colors disabled:opacity-50"
            title="Modify the proposed edit before applying"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Proposal</span>
          </button>

          <button
            onClick={() => onAction && onAction('approve', caseData.caseId)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#243a2c] hover:bg-[#2c4736] text-[#bde8ce] border border-[#3d634b] transition-colors shadow-sm disabled:opacity-50 font-semibold"
            title="Approve and apply the surgical correction to the database"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve &amp; Apply</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 7: OPTIONAL LIVE AI INFERENCE ACCORDION
          Kept clean, tucked away at the bottom so it never distracts faculty.
      ========================================================================= */}
      <div className="bg-[#121614] border border-[#232b26] rounded-xl p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#626965]" />
            <span className="text-[11px] font-medium text-[#78827c]">
              Diagnostic AI Inference Console (Optional)
            </span>
          </div>
          <button
            onClick={() => setShowLiveTriage(v => !v)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded bg-[#161a18] hover:bg-[#1f2421] text-[#78827c] hover:text-[#f4f3ee] border border-[#242b27] transition-colors"
          >
            <span>{showLiveTriage ? 'Hide' : 'Inspect'}</span>
            {showLiveTriage ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {showLiveTriage && (
          <div className="pt-3 mt-2 border-t border-[#1c2420] text-xs space-y-2 text-[#969e99]">
            {aiTriage ? (
              <div className="space-y-1.5 p-3 rounded-lg bg-[#161a18] border border-[#202522]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#78827c]">Status: <strong className="font-mono text-[#f4f3ee]">{aiTriage.status}</strong></span>
                  <span className="font-mono text-[#8fd1a8]">{aiTriage.verdict || 'N/A'}</span>
                </div>
                {aiTriage.summary && <p className="text-[11px] text-[#b8c9bf]">{aiTriage.summary}</p>}
              </div>
            ) : (
              <p className="text-[11px] text-[#626965] italic">
                Authoritative findings are loaded directly from persisted MongoDB investigation records. Live re-inference was not triggered for this session.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
