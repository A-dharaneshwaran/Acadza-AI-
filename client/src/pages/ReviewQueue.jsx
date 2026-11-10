import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { getCaseDetails } from '../services/caseService';
import CaseDetail from '../components/CaseDetail';

export default function ReviewQueue() {
  // Query parameters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency');

  // Response data
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
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
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status: statusFilter,
        priority: priorityFilter,
        sortBy
      });

      const res = await apiRequest(`/cases/paginated?${queryParams.toString()}`);
      if (res.success) {
        setItems(res.items || []);
        setPagination(res.pagination || { page: 1, limit: 8, total: 0, totalPages: 1 });
        if (res.items?.length > 0 && !selectedCaseId) {
          handleSelectCase(res.items[0].caseId);
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
  }, [page, limit, statusFilter, priorityFilter, sortBy]);

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
            Investigation Queue
          </h1>
          <p className="text-xs text-[#969e99] mt-1">
            Question-grouped student report investigations with live search, priority filters, and pagination.
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

      {/* 2. Controls Toolbar: Search, Filters, Sorters */}
      <div className="p-3.5 rounded-lg bg-[#161a18] border border-[#2b312e] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#626965] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Case ID, Question ID, Comment..."
            className="w-full bg-[#121514] border border-[#242b27] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f4f3ee] placeholder-[#626965] focus:outline-none focus:border-[#4d7c5f]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#626965]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="bg-[#121514] text-[#b3beba] border border-[#242b27] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#4d7c5f]"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority (All)</option>
              <option value="multi">Multi-Report (2+)</option>
              <option value="injection">Adversarial Injection</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#626965]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-[#121514] text-[#b3beba] border border-[#242b27] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#4d7c5f]"
            >
              <option value="all">All Statuses</option>
              <option value="ready_for_ai">Ready for AI</option>
              <option value="needs_faculty_review">Needs Faculty Review</option>
              <option value="ai_completed">AI Completed</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#626965]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-[#121514] text-[#b3beba] border border-[#242b27] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#4d7c5f]"
            >
              <option value="urgency">Urgency</option>
              <option value="recent">Most Recent</option>
              <option value="reportCount">Report Count</option>
              <option value="subject">Subject</option>
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

      {/* 3. Main Split View: Queue List (Left) and Case Detail Studio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Paginated Queue Table / Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#78827c] px-1">
            <span>
              Showing {items.length} of {pagination.total} investigations
            </span>
            <span className="font-mono">Page {pagination.page} / {pagination.totalPages || 1}</span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-[#626965] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#6ba883]" />
              <span>Loading investigation queue...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#626965] bg-[#161a18] border border-[#2b312e] rounded-lg">
              No investigation cases match the applied filters.
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

                      {item.injectionDetected && (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#3b1f1c] text-[#f2b8b3] border border-[#5c2b26]">
                          <ShieldAlert className="w-3 h-3 text-[#e07167]" />
                          <span>Adversarial</span>
                        </span>
                      )}
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
                      <span className="text-[#8ba895] font-mono capitalize">
                        {item.aiVerdict || item.status.replace(/_/g, ' ')}
                      </span>
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
