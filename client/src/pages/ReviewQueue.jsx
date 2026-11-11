import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Inbox, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Clock, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  SlidersHorizontal,
  FileQuestion,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  FileCheck,
  CheckCircle
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { getCaseDetails, getPaginatedCases } from '../services/caseService';
import CaseDetail from '../components/CaseDetail';

export default function ReviewQueue() {
  const [searchParams] = useSearchParams();
  const initialCaseParam = searchParams.get('caseId');
  const initialSearchParam = searchParams.get('search') || '';

  // Query parameters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [search, setSearch] = useState(initialSearchParam || (initialCaseParam ? initialCaseParam : ''));
  
  // Faculty-Oriented Filters
  const [facultyReview, setFacultyReview] = useState('all'); // 'all' | 'needs_review' | 'no_review_needed' | 'review_completed'
  const [findingType, setFindingType] = useState('all'); // 'all' | 'defect' | 'no_error' | 'display_issue' | ...
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'newest' | 'oldest' | 'highest_confidence' | 'lowest_confidence'

  // Response data
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [reviewSummary, setReviewSummary] = useState({ needsReview: 0, noReviewNeeded: 0, reviewCompleted: 0, totalCases: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected case state for slide-in or detailed view
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCaseFull, setSelectedCaseFull] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPaginatedCases({
        page: page.toString(),
        limit: limit.toString(),
        search,
        facultyReview,
        findingType,
        sortBy
      });
      if (res.success) {
        setItems(res.items || []);
        setPagination(res.pagination || { page: 1, limit: 8, total: 0, totalPages: 1 });
        if (res.reviewSummary) {
          setReviewSummary(res.reviewSummary);
        }
        if (res.items?.length > 0) {
          // If previously selected case is in current page, retain it; otherwise select first
          const stillPresent = res.items.some(i => i.caseId === selectedCaseId);
          if (!stillPresent || !selectedCaseId) {
            handleSelectCase(res.items[0].caseId);
          }
        } else {
          setSelectedCaseId(null);
          setSelectedCaseFull(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch investigation queue');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (caseId) => {
    setSelectedCaseId(caseId);
    setDetailLoading(true);
    try {
      const res = await getCaseDetails(caseId);
      if (res.success) {
        setSelectedCaseFull(res);
      }
    } catch (err) {
      console.error('Failed to load case context', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Re-fetch on filter or page change
  useEffect(() => {
    fetchQueue();
  }, [page, limit, facultyReview, findingType, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchQueue();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b312e] pb-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f3ee]">
            Faculty Review Queue
          </h1>
          <p className="text-xs text-[#969e99] mt-1">
            Question-level investigation cases prioritized by review status, taxonomy findings, and calibrated confidence.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1a1f1c] hover:bg-[#222925] text-[#969e99] hover:text-[#f4f3ee] border border-[#2b312e] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 2. Review Summary Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Needs Review Pill */}
        <button
          onClick={() => { setFacultyReview('needs_review'); setPage(1); }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            facultyReview === 'needs_review'
              ? 'bg-[#2b271d] border-[#4d4229] ring-1 ring-[#e0c082]/40'
              : 'bg-[#161a18] border-[#2b312e] hover:border-[#38413c]'
          }`}
        >
          <div className="flex items-center justify-between text-[#e0c082]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Needs Review</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-mono font-semibold text-[#f4f3ee] mt-1">
            {reviewSummary.needsReview}
          </div>
          <span className="text-[10px] text-[#969e99]">Pending human decision</span>
        </button>

        {/* No Review Needed Pill */}
        <button
          onClick={() => { setFacultyReview('no_review_needed'); setPage(1); }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            facultyReview === 'no_review_needed'
              ? 'bg-[#1a2620] border-[#2e4437] ring-1 ring-[#8fd1a8]/40'
              : 'bg-[#161a18] border-[#2b312e] hover:border-[#38413c]'
          }`}
        >
          <div className="flex items-center justify-between text-[#8fd1a8]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">No Review Needed</span>
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-mono font-semibold text-[#f4f3ee] mt-1">
            {reviewSummary.noReviewNeeded}
          </div>
          <span className="text-[10px] text-[#969e99]">Auto-eligible or clean</span>
        </button>

        {/* Review Completed Pill */}
        <button
          onClick={() => { setFacultyReview('review_completed'); setPage(1); }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            facultyReview === 'review_completed'
              ? 'bg-[#1b252f] border-[#2f4356] ring-1 ring-[#8bb3d6]/40'
              : 'bg-[#161a18] border-[#2b312e] hover:border-[#38413c]'
          }`}
        >
          <div className="flex items-center justify-between text-[#8bb3d6]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Review Completed</span>
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-mono font-semibold text-[#f4f3ee] mt-1">
            {reviewSummary.reviewCompleted}
          </div>
          <span className="text-[10px] text-[#969e99]">Signed off by faculty</span>
        </button>

        {/* Total Cases Pill */}
        <button
          onClick={() => { setFacultyReview('all'); setFindingType('all'); setPage(1); }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            facultyReview === 'all' && findingType === 'all'
              ? 'bg-[#1e2220] border-[#38413c] ring-1 ring-[#969e99]/40'
              : 'bg-[#161a18] border-[#2b312e] hover:border-[#38413c]'
          }`}
        >
          <div className="flex items-center justify-between text-[#969e99]">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Cases</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-mono font-semibold text-[#f4f3ee] mt-1">
            {reviewSummary.totalCases}
          </div>
          <span className="text-[10px] text-[#969e99]">All 39 question cases</span>
        </button>
      </div>

      {/* 3. Controls Toolbar: Search & Faculty-Oriented Dropdowns */}
      <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#2b312e] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-[#626965] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Case ID, Question, Comment..."
            className="w-full bg-[#121514] border border-[#242b27] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f4f3ee] placeholder-[#626965] focus:outline-none focus:border-[#4d7c5f]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter 1: Faculty Review (Prominent First) */}
          <div className="flex items-center gap-1.5 bg-[#121514] border border-[#2e4437] rounded-lg px-2.5 py-1">
            <span className="text-[11px] font-medium text-[#8fd1a8]">Faculty Review:</span>
            <select
              value={facultyReview}
              onChange={(e) => { setFacultyReview(e.target.value); setPage(1); }}
              className="bg-transparent text-[#f4f3ee] font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#161a18] text-[#f4f3ee]">All Cases</option>
              <option value="needs_review" className="bg-[#161a18] text-[#e0c082]">Needs Review</option>
              <option value="no_review_needed" className="bg-[#161a18] text-[#8fd1a8]">No Review Needed</option>
              <option value="review_completed" className="bg-[#161a18] text-[#8bb3d6]">Review Completed</option>
            </select>
          </div>

          {/* Filter 2: Finding Type (Taxonomy Verdicts) */}
          <div className="flex items-center gap-1.5 bg-[#121514] border border-[#242b27] rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-[#969e99]">Finding Type:</span>
            <select
              value={findingType}
              onChange={(e) => { setFindingType(e.target.value); setPage(1); }}
              className="bg-transparent text-[#b3beba] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#161a18] text-[#f4f3ee]">All Findings</option>
              <option value="defect" className="bg-[#161a18] text-[#f2b8b3]">Defect</option>
              <option value="no_error" className="bg-[#161a18] text-[#8fd1a8]">No Error</option>
              <option value="display_issue" className="bg-[#161a18] text-[#e0c082]">Display Issue</option>
              <option value="app_issue" className="bg-[#161a18] text-[#e0c082]">App Issue</option>
              <option value="language_mode" className="bg-[#161a18] text-[#b3beba]">Language Mode</option>
              <option value="already_fixed" className="bg-[#161a18] text-[#8fd1a8]">Already Fixed</option>
              <option value="not_actionable" className="bg-[#161a18] text-[#969e99]">Not Actionable</option>
            </select>
          </div>

          {/* Filter 3: Sort By */}
          <div className="flex items-center gap-1.5 bg-[#121514] border border-[#242b27] rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-[#969e99]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-transparent text-[#b3beba] text-xs focus:outline-none cursor-pointer"
            >
              <option value="urgency" className="bg-[#161a18] text-[#f4f3ee]">Urgency (Default)</option>
              <option value="newest" className="bg-[#161a18] text-[#f4f3ee]">Newest First</option>
              <option value="oldest" className="bg-[#161a18] text-[#f4f3ee]">Oldest First</option>
              <option value="highest_confidence" className="bg-[#161a18] text-[#f4f3ee]">Highest Confidence</option>
              <option value="lowest_confidence" className="bg-[#161a18] text-[#f4f3ee]">Lowest Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-[#271917] border border-[#4a2723] text-[#f2b8b3] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#e07167]" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Main Split View: Queue List (Left) and Case Detail Studio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Paginated Queue Table / Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#78827c] px-1">
            <span>
              Showing {items.length} of {pagination.total} cases
            </span>
            <span className="font-mono">Page {pagination.page} / {pagination.totalPages || 1}</span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-[#626965] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#6ba883]" />
              <span>Loading investigation queue...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#626965] bg-[#161a18] border border-[#2b312e] rounded-lg space-y-2">
              <p>No investigation cases match the applied filters.</p>
              <button
                onClick={() => { setFacultyReview('all'); setFindingType('all'); setSearch(''); setPage(1); }}
                className="text-[11px] text-[#8fd1a8] hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
              {items.map((item) => {
                const isSelected = selectedCaseId === item.caseId;

                return (
                  <div
                    key={item.caseId}
                    onClick={() => handleSelectCase(item.caseId)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#1b221e] border-[#3e5647] shadow-sm'
                        : 'bg-[#161a18] border-[#2b312e] hover:border-[#38413c] hover:bg-[#191e1b]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-[#f4f3ee]">
                            {item.caseId}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2421] text-[#969e99] border border-[#2b312e]">
                            {item.questionType}
                          </span>
                          {item.priority === 'High' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2b271d] text-[#e0c082] border border-[#4d4229] font-medium">
                              {item.reportCount} reports
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#78827c] mt-1 truncate">
                          {item.subject} · {item.chapter}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {/* Review Status Badge */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                          item.reviewStatus === 'Needs Review'
                            ? 'bg-[#272115] text-[#e0c082] border-[#443820]'
                            : item.reviewStatus === 'Review Completed'
                              ? 'bg-[#1b252f] text-[#8bb3d6] border-[#2f4356]'
                              : 'bg-[#17241c] text-[#8fd1a8] border-[#294233]'
                        }`}>
                          {item.reviewStatus}
                        </span>

                        {item.injectionDetected && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#3b1f1c] text-[#f2b8b3] border border-[#5c2b26]">
                            <ShieldAlert className="w-3 h-3 text-[#e07167]" />
                            <span>Adversarial</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Student comment preview */}
                    <div className="mt-2.5 text-xs text-[#b8c2bc] italic line-clamp-1 bg-[#121514] px-2.5 py-1.5 rounded border border-[#202522]">
                      "{item.representativeComment || 'No comment provided'}"
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#626965]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.lastReportedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.aiConfidence && (
                          <span className="font-mono text-[#78827c]">
                            {((item.aiConfidence || 0) * 100).toFixed(0)}%
                          </span>
                        )}
                        <span className="text-[#8ba895] font-mono capitalize">
                          {item.aiVerdict ? item.aiVerdict.replace(/_/g, ' ') : item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#181d1a] border border-[#2b312e] text-[#969e99] hover:text-[#f4f3ee] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-[11px] text-[#626965]">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#181d1a] border border-[#2b312e] text-[#969e99] hover:text-[#f4f3ee] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Full Case Investigation Studio (Rendered MathML & AI Recommendation) */}
        <div className="lg:col-span-7 bg-[#161a18] border border-[#2b312e] rounded-lg p-5 sticky top-4 max-h-[calc(100vh-180px)] overflow-y-auto">
          {detailLoading ? (
            <div className="py-24 text-center text-xs text-[#626965] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#6ba883]" />
              <span>Loading complete question context and MathML...</span>
            </div>
          ) : selectedCaseFull?.case ? (
            <CaseDetail
              caseData={selectedCaseFull.case}
              questionData={selectedCaseFull.question}
              taxonomy={selectedCaseFull.taxonomy}
              investigations={selectedCaseFull.investigations || []}
              onAction={(action, id) => console.log('Action:', action, id)}
              actionLoading={false}
            />
          ) : (
            <div className="text-center py-24 text-[#626965] text-xs">
              Select an investigation case from the queue to view full academic context.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
