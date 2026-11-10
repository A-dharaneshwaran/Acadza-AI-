import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Inbox, 
  UserCheck, 
  Flame, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight,
  ShieldAlert,
  Layers,
  Activity
} from 'lucide-react';
import { apiRequest } from '../services/api';
import MetricCard from '../components/MetricCard';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/overview/stats');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve overview metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = data?.stats;

  return (
    <div className="space-y-7">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b312e] pb-5">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f3ee]">
            Overview Dashboard
          </h1>
          <p className="text-xs text-[#969e99] mt-1 max-w-2xl leading-relaxed">
            Real-time quality assurance operations, case volumes, and investigation telemetry across Acadza's JEE/NEET question bank.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/queue"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#24332a] hover:bg-[#2e4236] text-[#bde8ce] border border-[#3e5647] transition-colors"
          >
            <span>Open Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1a1f1c] hover:bg-[#222925] text-[#969e99] hover:text-[#f4f3ee] border border-[#2b312e] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-[#271917] border border-[#4a2723] text-[#f2b8b3] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#e07167] mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-[#fce8e6]">Backend Unreachable:</span> {error}. Ensure backend is running (`npm start`).
          </div>
        </div>
      )}

      {/* 2. Top Metric Cards (Real Database Numbers Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Questions"
          value={stats?.totalQuestions}
          sublabel="Authoritative JEE/NEET items"
          icon={BookOpen}
          accentColor="text-[#6ba883]"
        />

        <MetricCard
          label="Total Reports"
          value={stats?.totalReports}
          sublabel="Raw student complaints"
          icon={FileText}
          accentColor="text-[#7a9e8b]"
        />

        <MetricCard
          label="Open Investigations"
          value={stats?.openInvestigationCases}
          sublabel="Grouped question cases"
          icon={Inbox}
          accentColor="text-[#8ba895]"
        />

        <MetricCard
          label="Awaiting Faculty"
          value={stats?.casesAwaitingFacultyReview}
          sublabel={stats?.casesAwaitingFacultyReview === 0 ? "No pending approvals" : "Pending human sign-off"}
          icon={UserCheck}
          accentColor="text-[#a8956e]"
          badgeText={stats?.casesAwaitingFacultyReview > 0 ? "Review Required" : "Clean"}
          badgeType={stats?.casesAwaitingFacultyReview > 0 ? "warning" : "default"}
        />

        <MetricCard
          label="High Priority"
          value={stats?.highPriorityCasesCount}
          sublabel="Multi-reports or adversarial"
          icon={Flame}
          accentColor="text-[#e07167]"
          badgeText={stats?.highPriorityCasesCount > 0 ? "Urgent" : null}
          badgeType="danger"
        />
      </div>

      {/* 3. Mid Section: Status Distribution & High-Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Status Breakdown */}
        <div className="lg:col-span-5 bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#242b27] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#6ba883]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
                Investigation Status Distribution
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#78827c]">Live Atlas Store</span>
          </div>

          {stats?.statusDistribution ? (
            <div className="space-y-3">
              {Object.entries(stats.statusDistribution).map(([statusKey, count]) => {
                const total = stats.openInvestigationCases || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={statusKey} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[#969e99]">
                      <span className="font-mono capitalize text-[#f4f3ee]">
                        {statusKey.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[#8ba895]">
                        {count} <span className="text-[#626965]">({percentage}%)</span>
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#121514] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#4d7c5f] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#626965]">
              No investigation case distribution data available.
            </div>
          )}
        </div>

        {/* Right: High-Priority Cases */}
        <div className="lg:col-span-7 bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#242b27] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#e07167]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
                High-Priority Investigations
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#78827c]">Multiple Reports / Injections</span>
          </div>

          <div className="space-y-2.5">
            {data?.highPriorityCases && data.highPriorityCases.length > 0 ? (
              data.highPriorityCases.map((hp) => (
                <div 
                  key={hp.caseId}
                  className="p-3 rounded-lg bg-[#121514] border border-[#202522] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#f4f3ee] font-medium">{hp.caseId}</span>
                      {hp.reportCount > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2b271d] text-[#e0c082] border border-[#4d4229]">
                          {hp.reportCount} reports
                        </span>
                      )}
                      {hp.injectionDetected && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#3b1f1c] text-[#f2b8b3] border border-[#5c2b26]">
                          <ShieldAlert className="w-3 h-3 text-[#e07167]" />
                          <span>Adversarial</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#78827c] truncate mt-0.5">
                      {hp.chapter} · Last reported {new Date(hp.lastReportedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <Link
                    to="/queue"
                    className="p-1.5 rounded bg-[#181d1a] hover:bg-[#222925] text-[#8ba895] hover:text-[#f4f3ee] border border-[#2b312e] transition-colors shrink-0"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#626965]">
                No critical high-priority cases at this time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Recent Investigation Activity Feed */}
      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#242b27] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7a9e8b]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f4f3ee]">
              Recent Investigation Activity
            </h2>
          </div>
          <span className="text-[10px] text-[#626965]">Latest incoming reports</span>
        </div>

        {data?.recentActivity && data.recentActivity.length > 0 ? (
          <div className="divide-y divide-[#212623] text-xs">
            {data.recentActivity.map((act) => (
              <div key={act.caseId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#8fd1a8] font-medium">{act.caseId}</span>
                    <span className="text-[10px] text-[#78827c]">({act.subject} · {act.chapter})</span>
                    {act.injectionDetected && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3b1f1c] text-[#f2b8b3] border border-[#5c2b26]">
                        Quarantined
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#b8c2bc] italic truncate mt-1">
                    "{act.latestComment || 'Report recorded'}"
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[#626965] shrink-0">
                  <span>{new Date(act.lastReportedAt).toLocaleDateString()}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#1e2722] text-[#8ba895] border border-[#2e4437]">
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#626965]">
            No recent activity logged.
          </div>
        )}
      </div>
    </div>
  );
}
